// W25-L: release evidence manifest generator. Links commit, lockfile
// hashes, renderer image digest, SBOM, image scan and dependency audits
// into ONE machine-readable, offline-verifiable JSON artifact. Contains NO
// secrets, env values, or report/report-body content — only hashes, paths,
// and aggregate counts.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT_DIR = process.cwd();
const OUT_DIR = path.join(ROOT_DIR, "test-results");
const STRICT = process.argv.includes("--strict");

function sha256File(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function gitCommitSha() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT_DIR }).toString().trim();
  } catch {
    return null;
  }
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const rootAudit = readJsonSafe(path.join(OUT_DIR, "root-audit.json"));
  const rendererAudit = readJsonSafe(path.join(OUT_DIR, "pdf-renderer-audit.json"));
  const sbomPath = path.join(OUT_DIR, "pdf-renderer-sbom.spdx.json");
  const scanPath = path.join(OUT_DIR, "pdf-renderer-trivy.json");
  const scanSummary = readJsonSafe(scanPath);
  const qaPlanPath = path.join(ROOT_DIR, "Design", "QA", "KichBan-Test-Tong-The.md");
  const qaCatalogPath = path.join(ROOT_DIR, "Design", "QA", "catalog", "test-cases.json");
  const qaFixtureManifestPath = path.join(ROOT_DIR, "Design", "QA", "fixtures", "manifest.json");
  const qaCatalog = readJsonSafe(qaCatalogPath);
  const workflowPath = path.join(ROOT_DIR, ".github", "workflows", "ci.yml");
  const qaBundlePath = process.env.QA_BUNDLE_PATH
    ? path.resolve(ROOT_DIR, process.env.QA_BUNDLE_PATH)
    : null;
  const ciRunUrl = process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
    ? `${process.env.GITHUB_SERVER_URL || "https://github.com"}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;

  const manifest = {
    schema: "report-supporter-release-evidence@2",
    generatedAt: new Date().toISOString(),
    commitSha: gitCommitSha(),
    ci: {
      runId: process.env.GITHUB_RUN_ID || null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
      runUrl: ciRunUrl,
      workflowPath: ".github/workflows/ci.yml",
      workflowSha256: sha256File(workflowPath),
    },
    qa: {
      planVersion: qaCatalog?.version ?? null,
      plan: {
        path: "Design/QA/KichBan-Test-Tong-The.md",
        sha256: sha256File(qaPlanPath),
      },
      catalog: {
        path: "Design/QA/catalog/test-cases.json",
        sha256: sha256File(qaCatalogPath),
      },
      fixtureManifest: {
        path: "Design/QA/fixtures/manifest.json",
        sha256: sha256File(qaFixtureManifestPath),
      },
      bundle: qaBundlePath && fs.existsSync(qaBundlePath)
        ? {
            path: path.relative(ROOT_DIR, qaBundlePath),
            sha256: sha256File(qaBundlePath),
          }
        : null,
    },
    lockfile: {
      root: {
        path: "package-lock.json",
        sha256: sha256File(path.join(ROOT_DIR, "package-lock.json")),
      },
      renderer: {
        path: "services/pdf-renderer/package-lock.json",
        sha256: sha256File(path.join(ROOT_DIR, "services", "pdf-renderer", "package-lock.json")),
      },
    },
    rendererImage: {
      // Set by CI right after `docker build`/`docker inspect` on the SAME
      // image that was SBOM'd, scanned, and used for the integration test —
      // never a rebuild, so this digest is authoritative for all three.
      digest: process.env.PDF_RENDERER_IMAGE_DIGEST || null,
      baseImage:
        "ghcr.io/puppeteer/puppeteer:25.3.0@sha256:9665f5b57abc5cc7080a641878964018de219055a4d2c9d8d050ceb1161778ba",
    },
    sbom: {
      path: fs.existsSync(sbomPath) ? path.relative(ROOT_DIR, sbomPath) : null,
      sha256: sha256File(sbomPath),
    },
    imageScan: {
      tool: "trivy",
      path: fs.existsSync(scanPath) ? path.relative(ROOT_DIR, scanPath) : null,
      sha256: sha256File(scanPath),
      resultsCount: Array.isArray(scanSummary?.Results) ? scanSummary.Results.length : null,
    },
    audits: {
      root: rootAudit ? { vulnerabilities: rootAudit.metadata?.vulnerabilities ?? null } : null,
      renderer: rendererAudit ? { vulnerabilities: rendererAudit.metadata?.vulnerabilities ?? null } : null,
    },
  };

  const missing = [];
  if (!manifest.commitSha) missing.push("commitSha");
  if (!manifest.lockfile.root.sha256) missing.push("lockfile.root.sha256");
  if (!manifest.lockfile.renderer.sha256) missing.push("lockfile.renderer.sha256");
  if (!manifest.ci.workflowSha256) missing.push("ci.workflowSha256");
  if (!manifest.qa.planVersion) missing.push("qa.planVersion");
  if (!manifest.qa.plan.sha256) missing.push("qa.plan.sha256");
  if (!manifest.qa.catalog.sha256) missing.push("qa.catalog.sha256");
  if (!manifest.qa.fixtureManifest.sha256) missing.push("qa.fixtureManifest.sha256");
  if (!manifest.audits.root) missing.push("audits.root (run npm audit --omit=dev --json > test-results/root-audit.json first)");
  if (!manifest.audits.renderer) missing.push("audits.renderer");
  if (STRICT) {
    if (!manifest.rendererImage.digest) missing.push("rendererImage.digest (set PDF_RENDERER_IMAGE_DIGEST)");
    if (!manifest.sbom.path) missing.push("sbom.path");
    if (!manifest.imageScan.path) missing.push("imageScan.path");
  }

  const outPath = path.join(OUT_DIR, "release-evidence-manifest.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`[release-evidence] wrote ${path.relative(ROOT_DIR, outPath)}`);

  if (missing.length > 0) {
    const msg = `[release-evidence] missing/incomplete: ${missing.join("; ")}`;
    if (STRICT) {
      console.error(msg);
      process.exitCode = 1;
      return;
    }
    console.warn(msg);
  }
}

main();
