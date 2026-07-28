import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import {
  readJson,
  resolveWithin,
  scanSecrets,
  sha256Buffer,
  sha256File,
} from "./qa-core.mjs";
import { validateQaPackage } from "./qa-validate.mjs";

function runDirectory() {
  const index = process.argv.indexOf("--run");
  if (index === -1 || !process.argv[index + 1]) throw new Error("Usage: npm run qa:bundle -- --run <run-dir>");
  return path.resolve(process.argv[index + 1]);
}

const runDir = runDirectory();
const validation = validateQaPackage({ runDir });
if (validation.errors.length > 0) {
  validation.errors.forEach((error) => console.error(`QA bundle validation: ${error}`));
  process.exit(1);
}

for (const requiredReport of ["report.md", "report.json"]) {
  if (!fs.existsSync(path.join(runDir, requiredReport))) throw new Error(`Run report missing: ${requiredReport}. Run qa:report first.`);
}

const evidenceIndex = readJson(path.join(runDir, "evidence-index.json"));
const zip = new JSZip();
const included = new Set();

function addFile(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  if (included.has(normalized)) return;
  const filePath = resolveWithin(runDir, normalized);
  const buffer = fs.readFileSync(filePath);
  const findings = scanSecrets(buffer, normalized);
  if (findings.length > 0) throw new Error(`Secret scan failed for ${normalized}: ${findings.join(", ")}`);
  zip.file(normalized, buffer, { date: new Date("1980-01-01T00:00:00.000Z") });
  included.add(normalized);
}

for (const coreFile of ["run.json", "case-results.csv", "defects.json", "evidence-index.json", "report.md", "report.json"]) addFile(coreFile);
for (const evidence of evidenceIndex.entries) addFile(evidence.path);

const archive = await zip.generateAsync({
  type: "nodebuffer",
  compression: "DEFLATE",
  compressionOptions: { level: 9 },
  platform: "DOS",
});
const archivePath = path.join(runDir, "qa-evidence.zip");
const checksum = sha256Buffer(archive);
fs.writeFileSync(archivePath, archive);
fs.writeFileSync(path.join(runDir, "qa-evidence.zip.sha256"), `${checksum}  qa-evidence.zip\n`, "utf8");

if (sha256File(archivePath) !== checksum) throw new Error("QA bundle checksum verification failed after write");
console.log(`Created ${archivePath} (${archive.length} bytes, sha256 ${checksum}).`);
