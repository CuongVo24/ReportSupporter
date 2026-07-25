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

  const manifest = {
    generatedAt: new Date().toISOString(),
    commitSha: gitCommitSha(),
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
        "ghcr.io/puppeteer/puppeteer:24.16.0@sha256:ad7de9f7e15ee32ce48daca4888616d23510949121f57e84ca64469fce2810e2",
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
