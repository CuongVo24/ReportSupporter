import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { parseZipCentralDirectory } from "./zip-central-directory";

async function buildZip(files: Record<string, string>): Promise<ArrayBuffer> {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content, { compression: "DEFLATE" });
  }
  return zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
}

/** Finds the classic EOCD record (PK\x05\x06) offset in a real ZIP buffer. */
function findEocdOffset(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  for (let i = view.byteLength - 22; i >= 0; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) return i;
  }
  throw new Error("EOCD not found in test fixture");
}

describe("zip-central-directory — parser edge cases (W25-H/K)", () => {
  it("rejects an empty/too-small buffer", () => {
    const result = parseZipCentralDirectory(new ArrayBuffer(4));
    expect(result.valid).toBe(false);
  });

  it("rejects a buffer with no EOCD signature anywhere", () => {
    const buffer = new Uint8Array(100).fill(0x41).buffer; // all 'A' bytes
    const result = parseZipCentralDirectory(buffer);
    expect(result.valid).toBe(false);
  });

  it("fails closed when entryCount signals ZIP64 overflow (0xffff) but no ZIP64 locator follows", async () => {
    const buffer = await buildZip({ "a.txt": "hello" });
    const eocdOffset = findEocdOffset(buffer);
    const view = new DataView(buffer);
    // Total-entries field (offset +10 within EOCD) forced to the ZIP64
    // sentinel value without actually adding ZIP64 records.
    view.setUint16(eocdOffset + 10, 0xffff, true);

    const result = parseZipCentralDirectory(buffer);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("ZIP64");
  });

  it("fails closed when the Central Directory offset points outside the buffer", async () => {
    const buffer = await buildZip({ "a.txt": "hello" });
    const eocdOffset = findEocdOffset(buffer);
    const view = new DataView(buffer);
    // Central-dir offset field (offset +16 within EOCD) corrupted to point
    // past the end of the actual buffer.
    view.setUint32(eocdOffset + 16, buffer.byteLength + 1000, true);

    const result = parseZipCentralDirectory(buffer);
    expect(result.valid).toBe(false);
  });

  it("fails closed when a central directory header has the wrong signature", async () => {
    const buffer = await buildZip({ "a.txt": "hello" });
    const eocdOffset = findEocdOffset(buffer);
    const view = new DataView(buffer);
    const centralDirOffset = view.getUint32(eocdOffset + 16, true);
    // Corrupt the first 4 bytes of the first central-directory header
    // (should be the PK\x01\x02 signature).
    view.setUint32(centralDirOffset, 0xdeadbeef, true);

    const result = parseZipCentralDirectory(buffer);
    expect(result.valid).toBe(false);
  });

  it("fails closed when declared central-directory size does not match parsed entries", async () => {
    const buffer = await buildZip({ "a.txt": "hello" });
    const eocdOffset = findEocdOffset(buffer);
    const view = new DataView(buffer);
    const declaredSize = view.getUint32(eocdOffset + 12, true);
    view.setUint32(eocdOffset + 12, declaredSize + 1, true);

    const result = parseZipCentralDirectory(buffer);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("không khớp");
  });

  it("reports the general-purpose encryption bit accurately per entry", async () => {
    const buffer = await buildZip({ "plain.txt": "hello", "also-plain.txt": "world" });
    const result = parseZipCentralDirectory(buffer);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.entries.every((e) => e.encrypted === false)).toBe(true);
    }
  });

  it("decodes non-ASCII (UTF-8) entry names correctly", async () => {
    const buffer = await buildZip({ "báo cáo/tệp.txt": "content" });
    const result = parseZipCentralDirectory(buffer);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.entries.some((e) => e.name.includes("báo cáo"))).toBe(true);
    }
  });
});
