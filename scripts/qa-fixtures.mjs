import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import {
  FIXTURE_MANIFEST_PATH,
  QA_DIR,
  normalizeRepoPath,
  resolveRepoPath,
  sha256Buffer,
  sha256File,
  writeJson,
  readJson,
} from "./qa-core.mjs";

const command = process.argv[2];
const generatedDir = path.join(QA_DIR, "fixtures", "generated");
const MiB = 1024 * 1024;

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  crcTable[index] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return output;
}

function exactPng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);
  ihdrData.writeUInt32BE(1, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  const ihdr = pngChunk("IHDR", ihdrData);
  const idat = pngChunk("IDAT", zlib.deflateSync(Buffer.from([0, 0, 0, 0, 0]), { level: 9 }));
  const iend = pngChunk("IEND", Buffer.alloc(0));
  const fixedSize = signature.length + ihdr.length + idat.length + iend.length + 12;
  const fillerLength = size - fixedSize;
  if (fillerLength < 0) throw new Error(`PNG target too small: ${size}`);
  const filler = pngChunk("tEXt", Buffer.alloc(fillerLength, 0x71));
  return Buffer.concat([signature, ihdr, idat, filler, iend]);
}

function zipDateFields() {
  return { time: 0, date: 33 }; // 1980-01-01 00:00:00
}

function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  const { time, date } = zipDateFields();
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const input = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data ?? "", "utf8");
    const method = entry.deflate ? 8 : 0;
    const payload = method === 8 ? zlib.deflateRawSync(input, { level: 9 }) : input;
    const checksum = crc32(input);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(input.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, payload);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(input.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + payload.length;
  }
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDirectory, end]);
}

function exactMarkdown(size) {
  const header = Buffer.from("# Boundary fixture\n\nNội dung Markdown hợp lệ.\n\n", "utf8");
  if (size < header.length) return header.subarray(0, size);
  return Buffer.concat([header, Buffer.alloc(size - header.length, 0x61)]);
}

function ensureGeneratedFiles() {
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(path.join(generatedDir, "embedded-image.md"), `# Ảnh nhúng\n\n![Pixel](data:image/png;base64,${exactPng(256).toString("base64")})\n`);
  fs.writeFileSync(path.join(generatedDir, "image-5m-minus-1.png"), exactPng(5 * MiB - 1));
  fs.writeFileSync(path.join(generatedDir, "image-exactly-5m.png"), exactPng(5 * MiB));
  fs.writeFileSync(path.join(generatedDir, "image-5m-plus-1.png"), exactPng(5 * MiB + 1));
  fs.writeFileSync(path.join(generatedDir, "empty.md"), Buffer.alloc(0));
  fs.writeFileSync(path.join(generatedDir, "corrupt.docx"), Buffer.from("PK\u0003\u0004intentionally-truncated-docx", "binary"));
  fs.writeFileSync(path.join(generatedDir, "mime-spoof.pdf"), "This is intentionally not a PDF.\n");
  fs.writeFileSync(path.join(generatedDir, "markdown-50m-plus-1.md"), exactMarkdown(50 * MiB + 1));
  fs.writeFileSync(path.join(generatedDir, "markdown-exactly-50m.md"), exactMarkdown(50 * MiB));

  const duplicateDir = path.join(generatedDir, "duplicate-basename");
  fs.mkdirSync(path.join(duplicateDir, "a"), { recursive: true });
  fs.mkdirSync(path.join(duplicateDir, "b"), { recursive: true });
  fs.writeFileSync(path.join(duplicateDir, "report.md"), "# Duplicate basename\n\n![Chọn ảnh](images/proof.png)\n");
  fs.writeFileSync(path.join(duplicateDir, "a", "proof.png"), exactPng(320));
  fs.writeFileSync(path.join(duplicateDir, "b", "proof.png"), exactPng(321));

  fs.writeFileSync(path.join(generatedDir, "archive-ratio-bomb.zip"), buildZip([
    { name: "payload.txt", data: Buffer.alloc(12 * MiB, 0x41), deflate: true },
  ]));
  fs.writeFileSync(path.join(generatedDir, "archive-total-bomb.zip"), buildZip([
    { name: "a.bin", data: Buffer.alloc(8 * MiB, 0x42), deflate: true },
    { name: "b.bin", data: Buffer.alloc(8 * MiB, 0x43), deflate: true },
    { name: "c.bin", data: Buffer.alloc(8 * MiB, 0x44), deflate: true },
  ]));
  fs.writeFileSync(path.join(generatedDir, "archive-entry-count.zip"), buildZip(
    Array.from({ length: 1001 }, (_, index) => ({ name: `files/${String(index).padStart(4, "0")}.txt`, data: "" })),
  ));
  fs.writeFileSync(path.join(generatedDir, "archive-path-traversal.zip"), buildZip([
    { name: "../escape.txt", data: "escape" },
    { name: "safe/../../escape.txt", data: "duplicate-normalized" },
    { name: "safe.txt", data: "safe" },
  ]));
  fs.writeFileSync(path.join(generatedDir, "ocr-budget.json"), `${JSON.stringify({
    schema: "qa-ocr-budget-fixture@1",
    pages: 501,
    width: 20000,
    height: 20000,
    expected: "resource-policy-rejection-before-allocation",
  }, null, 2)}\n`);
}

const entries = [
  ["FX-DOCX-01", "src/modules/import/__fixtures__/vn_mon_hoc_report.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", false, { kind: "docx", unicode: true }],
  ["FX-DOCX-02", "src/modules/import/__fixtures__/vn_anh_nhung_report.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", false, { kind: "docx", embeddedImages: true }],
  ["FX-DOCX-03", "src/modules/import/__fixtures__/vn_track_changes_report.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", false, { kind: "docx", trackChanges: true }],
  ["FX-PDF-01", "src/modules/import/__fixtures__/report-word.pdf", "application/pdf", false, { kind: "pdf", source: "word" }],
  ["FX-PDF-02", "src/modules/import/__fixtures__/paper-latex.pdf", "application/pdf", false, { kind: "pdf", source: "latex" }],
  ["FX-PDF-03", "src/modules/import/__fixtures__/scan-vn.pdf", "application/pdf", false, { kind: "pdf", scanned: true }],
  ["FX-XLSX-01", "src/modules/import/__fixtures__/bang_diem_merges.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", false, { mergedCells: true }],
  ["FX-XLSX-02", "src/modules/import/__fixtures__/sheet_an.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", false, { hiddenSheet: true }],
  ["FX-PPTX-01", "src/modules/import/__fixtures__/defense-ppt.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", false, { source: "powerpoint" }],
  ["FX-PPTX-02", "src/modules/import/__fixtures__/defense-gslides.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", false, { source: "google-slides" }],
  ["FX-PERF-S", "e2e/fixtures/performance-project.ts", "text/typescript", false, { variant: "small", sections: 4 }],
  ["FX-PERF-L", "e2e/fixtures/performance-project.ts", "text/typescript", false, { variant: "large", sections: 40 }],
  ["FX-MD-01", "Design/QA/fixtures/golden/basic-vietnamese.md", "text/markdown", false, { headings: 3, paragraphs: 2, tables: 1, codeBlocks: 1 }],
  ["FX-MD-02", "Design/QA/fixtures/golden/missing-image.md", "text/markdown", false, { missingRefs: 1 }],
  ["FX-MD-03", "Design/QA/fixtures/generated/embedded-image.md", "text/markdown", true, { dataUrlImages: 1 }],
  ["FX-MD-04", "Design/QA/fixtures/golden/xss-payloads.md", "text/markdown", false, { dangerousPayloadClasses: 4 }],
  ["FX-MD-05", "Design/QA/fixtures/golden/remote-image.md", "text/markdown", false, { remoteImages: 1 }],
  ["FX-MD-06", "Design/QA/fixtures/golden/dom-clobbering.md", "text/markdown", false, { domClobbering: true }],
  ["FX-IMG-01", "Design/QA/fixtures/generated/image-5m-minus-1.png", "image/png", true, { exactBytes: 5 * MiB - 1 }],
  ["FX-IMG-02", "Design/QA/fixtures/generated/image-exactly-5m.png", "image/png", true, { exactBytes: 5 * MiB }],
  ["FX-IMG-03", "Design/QA/fixtures/generated/image-5m-plus-1.png", "image/png", true, { exactBytes: 5 * MiB + 1 }],
  ["FX-IMP-01", "Design/QA/fixtures/generated/empty.md", "text/markdown", true, { exactBytes: 0 }],
  ["FX-IMP-02", "Design/QA/fixtures/generated/corrupt.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", true, { intentionallyCorrupt: true }],
  ["FX-IMP-03", "Design/QA/fixtures/generated/mime-spoof.pdf", "application/pdf", true, { intentionallySpoofed: true }],
  ["FX-IMP-04", "Design/QA/fixtures/generated/markdown-50m-plus-1.md", "text/markdown", true, { exactBytes: 50 * MiB + 1 }],
  ["FX-IMP-05", "Design/QA/fixtures/generated/markdown-exactly-50m.md", "text/markdown", true, { exactBytes: 50 * MiB }],
  ["FX-MAP-01", "Design/QA/fixtures/generated/duplicate-basename", "inode/directory", true, { duplicateBasenames: 2 }],
  ["FX-CHK-01", "Design/QA/fixtures/golden/checker-golden.json", "application/json", false, { reviewedGolden: true }],
  ["FX-PAGE-01", "Design/QA/fixtures/golden/pagination-golden.json", "application/json", false, { reviewedGolden: true }],
  ["FX-STRESS-01", "Design/QA/fixtures/golden/checker-300-sections.json", "application/json", false, { sections: 300, reviewedGolden: true }],
  ["FX-REC-01", "Design/QA/fixtures/golden/indexeddb-v1.json", "application/json", false, { dbVersion: 1 }],
  ["FX-REC-02", "Design/QA/fixtures/golden/indexeddb-v2.json", "application/json", false, { dbVersion: 2 }],
  ["FX-REC-03", "Design/QA/fixtures/golden/indexeddb-v3.json", "application/json", false, { dbVersion: 3 }],
  ["FX-REC-04", "Design/QA/fixtures/golden/invalid-draft.json", "application/json", false, { intentionallyInvalid: true }],
  ["FX-IMP-06", "Design/QA/fixtures/generated/archive-ratio-bomb.zip", "application/zip", true, { compressionRatioBomb: true }],
  ["FX-IMP-07", "Design/QA/fixtures/generated/archive-total-bomb.zip", "application/zip", true, { uncompressedTotalBomb: true }],
  ["FX-IMP-08", "Design/QA/fixtures/generated/archive-entry-count.zip", "application/zip", true, { entryCount: 1001 }],
  ["FX-IMP-09", "Design/QA/fixtures/generated/archive-path-traversal.zip", "application/zip", true, { pathTraversal: true }],
  ["FX-OCR-01", "Design/QA/fixtures/generated/ocr-budget.json", "application/json", true, { pages: 501, pixelBudgetExceeded: true }],
].map(([id, filePath, mime, generated, oracle]) => ({
  id,
  path: normalizeRepoPath(filePath),
  mime,
  generated,
  oracle,
  sensitivity: "synthetic-non-sensitive",
  license: "project-test-fixture",
  generatorVersion: generated ? "qa-fixtures@1" : null,
}));

function directoryDigest(directory) {
  const files = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else files.push(fullPath);
    }
  }
  walk(directory);
  const descriptor = files.map((filePath) => {
    const relative = normalizeRepoPath(path.relative(directory, filePath));
    return `${relative}\0${sha256File(filePath)}\0${fs.statSync(filePath).size}`;
  }).join("\n");
  return {
    sha256: sha256Buffer(Buffer.from(descriptor, "utf8")),
    byteLength: files.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0),
    fileCount: files.length,
  };
}

function metadataFor(entry) {
  const filePath = resolveRepoPath(entry.path);
  if (!fs.existsSync(filePath)) throw new Error(`Missing fixture ${entry.id}: ${entry.path}`);
  if (fs.statSync(filePath).isDirectory()) return directoryDigest(filePath);
  return { sha256: sha256File(filePath), byteLength: fs.statSync(filePath).size };
}

function verifyShape(entry, filePath) {
  if (fs.statSync(filePath).isDirectory()) return;
  const buffer = fs.readFileSync(filePath);
  if (entry.mime === "application/json") JSON.parse(buffer.toString("utf8"));
  if (entry.mime === "image/png") {
    if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error(`${entry.id} is not a PNG`);
    if (!buffer.includes(Buffer.from("IEND", "ascii"))) throw new Error(`${entry.id} has no IEND`);
  }
  if (entry.mime === "application/pdf" && !entry.oracle.intentionallySpoofed && !buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error(`${entry.id} is not a PDF`);
  }
  if (
    [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/zip",
    ].includes(entry.mime)
    && !entry.oracle.intentionallyCorrupt
    && !buffer.subarray(0, 2).equals(Buffer.from("PK"))
  ) {
    throw new Error(`${entry.id} is not a ZIP container`);
  }
  if (entry.oracle.exactBytes !== undefined && buffer.length !== entry.oracle.exactBytes) {
    throw new Error(`${entry.id} size ${buffer.length} != ${entry.oracle.exactBytes}`);
  }
}

function generate() {
  ensureGeneratedFiles();
  const manifestEntries = entries.map((entry) => ({ ...entry, ...metadataFor(entry) }));
  writeJson(FIXTURE_MANIFEST_PATH, {
    schema: "qa-fixture-manifest@1",
    version: "1.0.0",
    entries: manifestEntries,
  });
  console.log(`Generated fixtures and manifest (${manifestEntries.length} entries).`);
}

function verify() {
  const manifest = readJson(FIXTURE_MANIFEST_PATH);
  if (manifest.schema !== "qa-fixture-manifest@1") throw new Error(`Unexpected fixture schema: ${manifest.schema}`);
  const expectedById = new Map(entries.map((entry) => [entry.id, entry]));
  if (manifest.entries.length !== entries.length) throw new Error(`Manifest count ${manifest.entries.length} != ${entries.length}`);
  for (const entry of manifest.entries) {
    const expected = expectedById.get(entry.id);
    if (!expected) throw new Error(`Unknown fixture in manifest: ${entry.id}`);
    if (entry.path !== expected.path || entry.mime !== expected.mime || entry.generated !== expected.generated) {
      throw new Error(`Fixture metadata drift: ${entry.id}`);
    }
    const filePath = resolveRepoPath(entry.path);
    verifyShape(entry, filePath);
    const actual = metadataFor(entry);
    if (entry.sha256 !== actual.sha256 || entry.byteLength !== actual.byteLength) {
      throw new Error(`Fixture hash/size mismatch: ${entry.id}`);
    }
  }
  console.log(`Verified ${manifest.entries.length} fixtures.`);
}

if (command === "generate") generate();
else if (command === "verify") verify();
else throw new Error("Usage: node scripts/qa-fixtures.mjs <generate|verify>");
