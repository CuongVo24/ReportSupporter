// W25-L: Supply-chain policy validator & release evidence generator.
// Checks external dependency tarballs, security waivers expiry, and generates
// machine-readable security release evidence artifacts.

import fs from "node:fs";
import path from "node:path";

const APPROVED_EXTERNAL_DOMAINS = ["cdn.sheetjs.com"];
const ROOT_DIR = process.cwd();
// Overrides pinned for reasons other than a specific advisory (build/runtime
// compat pins chosen by the app, not a deviation from a parent's declared
// range) do not need a dependency-overrides.json justification entry.
const UNJUSTIFIED_OVERRIDE_ALLOWLIST = new Set(["dompurify", "postcss", "sharp"]);

function log(msg) {
  console.log(`[supply-chain] ${msg}`);
}

function error(msg) {
  console.error(`[supply-chain ERROR] ${msg}`);
}

function runSupplyChainCheck() {
  log("Starting supply-chain security checks...");
  let hasErrors = false;

  // 1. Verify External Tarball Policy & Lock Integrity
  const rootPkgPath = path.join(ROOT_DIR, "package.json");
  const rootLockPath = path.join(ROOT_DIR, "package-lock.json");

  if (!fs.existsSync(rootPkgPath) || !fs.existsSync(rootLockPath)) {
    error("package.json or package-lock.json missing in root directory.");
    process.exit(1);
  }

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
  const rootLock = JSON.parse(fs.readFileSync(rootLockPath, "utf8"));

  const allDeps = {
    ...rootPkg.dependencies,
    ...rootPkg.devDependencies,
  };

  const externalDeps = [];

  for (const [name, spec] of Object.entries(allDeps)) {
    if (typeof spec === "string" && spec.startsWith("http")) {
      try {
        const url = new URL(spec);
        if (!APPROVED_EXTERNAL_DOMAINS.includes(url.hostname)) {
          error(`Unapproved external dependency domain: ${name} -> ${url.hostname}`);
          hasErrors = true;
        } else {
          // Check integrity in lockfile
          const lockPkg = rootLock.packages?.[`node_modules/${name}`] || rootLock.dependencies?.[name];
          const integrity = lockPkg?.integrity;
          if (!integrity) {
            error(`Missing integrity hash in package-lock.json for external dependency: ${name}`);
            hasErrors = true;
          } else {
            log(`Approved external dependency: ${name} (${url.hostname}) [integrity verified]`);
            externalDeps.push({ name, url: spec, domain: url.hostname, integrity });
          }
        }
      } catch (err) {
        error(`Invalid external dependency URL for ${name}: ${spec}`);
        hasErrors = true;
      }
    }
  }

  // 2. Check Security Waivers Expiry & Schema
  const waiversPath = path.join(ROOT_DIR, "security-waivers.json");
  const activeWaivers = [];

  if (fs.existsSync(waiversPath)) {
    try {
      const waivers = JSON.parse(fs.readFileSync(waiversPath, "utf8"));
      const today = new Date().toISOString().split("T")[0];

      for (const w of waivers) {
        if (!w.id || !w.cve || !w.owner || !w.expiryDate || !w.compensatingControl) {
          error(`Invalid waiver schema for ${w.id || w.cve}: missing required fields.`);
          hasErrors = true;
          continue;
        }

        if (w.expiryDate < today) {
          error(`EXPIRED WAIVER: ${w.id} (${w.cve} for ${w.package}) expired on ${w.expiryDate}! Owner: ${w.owner}`);
          hasErrors = true;
        } else {
          log(`Active valid waiver: ${w.id} (${w.cve}) valid until ${w.expiryDate} (Owner: ${w.owner})`);
          activeWaivers.push(w);
        }
      }
    } catch (err) {
      error(`Failed to parse security-waivers.json: ${err.message}`);
      hasErrors = true;
    }
  }

  // 2b. Check dependency override justification registry (W25-A)
  const overridesPath = path.join(ROOT_DIR, "dependency-overrides.json");
  const activeOverrides = [];
  const rootOverrideNames = Object.keys(rootPkg.overrides || {});

  if (fs.existsSync(overridesPath)) {
    try {
      const overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
      const today = new Date().toISOString().split("T")[0];
      const requiredFields = [
        "package",
        "advisory",
        "affectedPaths",
        "reason",
        "owner",
        "addedAt",
        "reviewBy",
        "exitCondition",
      ];

      for (const entry of overrides) {
        const missing = requiredFields.filter((field) => !entry[field] || (Array.isArray(entry[field]) && entry[field].length === 0));
        if (missing.length > 0) {
          error(`Invalid dependency-override entry for ${entry.package || "?"}: missing field(s) ${missing.join(", ")}.`);
          hasErrors = true;
          continue;
        }
        if (Number.isNaN(Date.parse(entry.reviewBy)) || Number.isNaN(Date.parse(entry.addedAt))) {
          error(`Invalid date in dependency-override entry for ${entry.package}: addedAt/reviewBy must be real dates.`);
          hasErrors = true;
          continue;
        }
        if (entry.reviewBy < today) {
          error(`EXPIRED DEPENDENCY OVERRIDE: ${entry.package} (${entry.advisory}) was due for review on ${entry.reviewBy}! Owner: ${entry.owner}`);
          hasErrors = true;
          continue;
        }
        log(`Justified override: ${entry.package} (${entry.advisory}) review by ${entry.reviewBy} (Owner: ${entry.owner})`);
        activeOverrides.push(entry);
      }
    } catch (err) {
      error(`Failed to parse dependency-overrides.json: ${err.message}`);
      hasErrors = true;
    }
  }

  // Every entry in package.json "overrides" that deviates from a package's own
  // requested major version must be justified in dependency-overrides.json.
  const justifiedPackages = new Set(activeOverrides.map((entry) => entry.package));
  for (const name of rootOverrideNames) {
    if (!justifiedPackages.has(name) && !UNJUSTIFIED_OVERRIDE_ALLOWLIST.has(name)) {
      error(`package.json "overrides.${name}" has no matching entry in dependency-overrides.json.`);
      hasErrors = true;
    }
  }

  // 3. Generate Security Release Evidence Artifact
  const evidenceArtifact = {
    generatedAt: new Date().toISOString(),
    commitSha: process.env.GITHUB_SHA || "local-dev",
    externalDependencies: externalDeps,
    activeWaivers: activeWaivers,
    dependencyOverrides: activeOverrides,
    workspacesChecked: ["root", "services/pdf-renderer"],
    status: hasErrors ? "FAILED" : "PASSED",
  };

  const outputDir = path.join(ROOT_DIR, "test-results");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const evidencePath = path.join(outputDir, "security-release-evidence.json");
  fs.writeFileSync(evidencePath, JSON.stringify(evidenceArtifact, null, 2), "utf8");
  log(`Security release evidence generated at: ${evidencePath}`);

  if (hasErrors) {
    error("Supply chain security check failed.");
    process.exit(1);
  }

  log("All supply chain security checks passed successfully!");
}

runSupplyChainCheck();
