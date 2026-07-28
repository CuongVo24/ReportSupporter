import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, sha256File, writeJson } from "./qa-core.mjs";

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1];
}

const runDir = valueAfter("--run");
if (!runDir || !process.argv.includes("--confirm")) {
  throw new Error("Usage: npm run qa:publish -- --run <run-dir> --confirm");
}

const absoluteRunDir = path.resolve(runDir);
const run = readJson(path.join(absoluteRunDir, "run.json"));
const archivePath = path.join(absoluteRunDir, "qa-evidence.zip");
const checksumPath = path.join(absoluteRunDir, "qa-evidence.zip.sha256");
if (!fs.existsSync(archivePath) || !fs.existsSync(checksumPath)) throw new Error("Run qa:bundle before publishing evidence");

const expectedChecksum = fs.readFileSync(checksumPath, "utf8").trim().split(/\s+/)[0];
if (sha256File(archivePath) !== expectedChecksum) throw new Error("Bundle hash differs from checksum file");

const tag = `qa-${run.runId}`;
const title = `QA evidence ${run.runId}`;

function gh(args, allowFailure = false) {
  const result = spawnSync("gh", args, { cwd: process.cwd(), encoding: "utf8", stdio: allowFailure ? "pipe" : "inherit" });
  if (!allowFailure && result.status !== 0) throw new Error(`gh ${args.join(" ")} failed`);
  return result;
}

const existing = gh(["release", "view", tag], true);
if (existing.status !== 0) {
  const createArgs = ["release", "create", tag, "--title", title, "--notes", `Machine-validated QA evidence for ${run.runId}.`];
  if (run.finalized) createArgs.push("--prerelease");
  else createArgs.push("--draft");
  gh(createArgs);
} else if (run.finalized) {
  gh(["release", "edit", tag, "--draft=false", "--prerelease"]);
}

gh(["release", "upload", tag, `${archivePath}#qa-evidence.zip`, `${checksumPath}#qa-evidence.zip.sha256`, "--clobber"]);
const releaseView = gh(["release", "view", tag, "--json", "url", "--jq", ".url"], true);
if (releaseView.status !== 0 || !releaseView.stdout.trim()) throw new Error(`Cannot resolve release URL for ${tag}`);
const releaseUrl = releaseView.stdout.trim();
run.manualEvidenceRelease = {
  url: releaseUrl,
  assetSha256: expectedChecksum,
};
writeJson(path.join(absoluteRunDir, "run.json"), run);

const evidenceIndexPath = path.join(absoluteRunDir, "evidence-index.json");
const evidenceIndex = readJson(evidenceIndexPath);
for (const evidence of evidenceIndex.entries) {
  evidence.storageUrl = `${releaseUrl}#qa-evidence.zip`;
}
writeJson(evidenceIndexPath, evidenceIndex);

const reportResult = spawnSync(process.execPath, ["scripts/qa-report.mjs", "--run", absoluteRunDir], {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: "inherit",
});
if (reportResult.status !== 0) throw new Error("Failed to regenerate report with publication receipt");

const receiptPath = path.join(absoluteRunDir, "publication-receipt.json");
writeJson(receiptPath, {
  schema: "qa-publication-receipt@1",
  runId: run.runId,
  releaseUrl,
  tag,
  bundleSha256: expectedChecksum,
});
gh([
  "release",
  "upload",
  tag,
  `${path.join(absoluteRunDir, "report.md")}#report.md`,
  `${path.join(absoluteRunDir, "report.json")}#report.json`,
  `${evidenceIndexPath}#evidence-index.json`,
  `${receiptPath}#publication-receipt.json`,
  "--clobber",
]);
console.log(`Published QA evidence to ${releaseUrl}.`);
