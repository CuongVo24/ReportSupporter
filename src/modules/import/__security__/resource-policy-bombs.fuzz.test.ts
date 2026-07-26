import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  validateZipPreflight,
  createInflationTracker,
  validateCanvasPixels,
  IMPORT_LIMITS,
  ImportBudgetExceededError,
} from "../resource-policy";
import { parseZipCentralDirectory } from "../zip-central-directory";

async function buildZip(files: Record<string, string>, options?: { compression?: "STORE" | "DEFLATE" }): Promise<ArrayBuffer> {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content, { compression: options?.compression ?? "DEFLATE" });
  }
  return zip.generateAsync({ type: "arraybuffer", compression: options?.compression ?? "DEFLATE" });
}

describe("Import Resource Budgets & Bomb Protection (W25-H)", () => {
  describe("Raw ZIP Central Directory parser", () => {
    it("parses a real archive's entries with accurate sizes (round-trip against JSZip)", async () => {
      const content = "Hello world ".repeat(50);
      const buffer = await buildZip({ "a.txt": content, "dir/b.txt": "small" });
      const result = parseZipCentralDirectory(buffer);
      expect(result.valid).toBe(true);
      if (!result.valid) return;
      // JSZip auto-creates an implicit "dir/" folder entry for "dir/b.txt".
      const names = result.entries.map((e) => e.name).sort();
      expect(names).toEqual(["a.txt", "dir/", "dir/b.txt"]);
      const aEntry = result.entries.find((e) => e.name === "a.txt")!;
      expect(aEntry.uncompressedSize).toBe(new TextEncoder().encode(content).byteLength);
      expect(aEntry.encrypted).toBe(false);
    });

    it("fails closed on a non-ZIP buffer", () => {
      const junk = new TextEncoder().encode("not a zip file at all").buffer;
      const result = parseZipCentralDirectory(junk);
      expect(result.valid).toBe(false);
    });

    it("fails closed on a truncated/corrupted EOCD", async () => {
      const buffer = await buildZip({ "a.txt": "hello" });
      const truncated = buffer.slice(0, buffer.byteLength - 10);
      const result = parseZipCentralDirectory(truncated);
      expect(result.valid).toBe(false);
    });
  });

  describe("ZIP Archive Preflight Validation", () => {
    it("accepts a well-formed small archive", async () => {
      const buffer = await buildZip({ "doc.xml": "<root>content</root>" });
      const result = validateZipPreflight(buffer);
      expect(result.valid).toBe(true);
    });

    it("rejects archives containing path traversal entries ('../')", async () => {
      const buffer = await buildZip({ "safe.xml": "ok", "../evil.sh": "bad" });
      const result = validateZipPreflight(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("path traversal");
    });

    it("rejects archives with excessive directory depth (>20 levels)", async () => {
      const deepPath = "a/".repeat(22) + "deep.xml";
      const buffer = await buildZip({ [deepPath]: "content" });
      const result = validateZipPreflight(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("lồng quá sâu");
    });

    it("rejects duplicate normalized entry names (same path, different case)", async () => {
      // JSZip only dedupes EXACT string matches, so two entries differing
      // only by case both land in the same real archive — exactly the
      // "resolve to the same extracted path" confusion case being guarded.
      const zip = new JSZip();
      zip.file("Dir/File.txt", "one");
      zip.file("dir/file.txt", "two");
      const buffer = await zip.generateAsync({ type: "arraybuffer" });

      const result = validateZipPreflight(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("trùng lặp");
    });

    it("accepts genuinely distinct entry names (no false positive on the duplicate check)", async () => {
      const buffer = await buildZip({ "a.txt": "one", "b.txt": "two", "dir/c.txt": "three" });
      expect(validateZipPreflight(buffer).valid).toBe(true);
    });

    it("detects ZIP bomb metadata with extreme compression ratios (>100x)", async () => {
      // Highly repetitive content compresses far better than 100x.
      const bombContent = "A".repeat(6 * 1024 * 1024); // 6 MiB of the same byte
      const buffer = await buildZip({ "bomb.xml": bombContent });
      const result = validateZipPreflight(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("ZIP bomb");
    });

    it("rejects encrypted entries", async () => {
      const buffer = await buildZip({ "secret.xml": "content" });
      // Flip the encryption bit (general purpose flag, bit 0) on the local
      // file header AND central directory header to simulate an encrypted entry.
      const bytes = new Uint8Array(buffer);
      const view = new DataView(buffer);
      for (let i = 0; i < bytes.length - 4; i++) {
        if (view.getUint32(i, true) === 0x02014b50) {
          const flagOffset = i + 8;
          view.setUint16(flagOffset, view.getUint16(flagOffset, true) | 0x0001, true);
        }
      }
      const result = validateZipPreflight(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("mã hoá");
    });

    it("rejects an unsupported compression method (not stored/deflate)", async () => {
      const buffer = await buildZip({ "a.xml": "content" });
      const bytes = new Uint8Array(buffer);
      const view = new DataView(buffer);
      for (let i = 0; i < bytes.length - 4; i++) {
        if (view.getUint32(i, true) === 0x02014b50) {
          // Compression method field, offset +10 in the central dir header.
          // 99 is not a method this app's decompressors support.
          view.setUint16(i + 10, 99, true);
        }
      }
      const result = validateZipPreflight(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("không được hỗ trợ");
    });

    it("rejects an entry name that is an absolute path", async () => {
      // JSZip normalizes leading "/" away on some platforms, so craft the
      // buffer via the raw parser test helper pattern: build a normal zip,
      // then rewrite the stored name bytes to start with "/".
      const zip = new JSZip();
      zip.file("etc/passwd", "root:x:0:0");
      const buffer = await zip.generateAsync({ type: "arraybuffer" });
      const bytes = new Uint8Array(buffer);
      const view = new DataView(buffer);
      for (let i = 0; i < bytes.length - 4; i++) {
        if (view.getUint32(i, true) === 0x02014b50) {
          const nameOffset = i + 46;
          // Overwrite the first byte of the stored name with "/" so the
          // parsed name becomes "/tc/passwd" — still same length, valid
          // UTF-8, but now starts with "/" (absolute path marker).
          bytes[nameOffset] = "/".charCodeAt(0);
        }
      }
      const result = validateZipPreflight(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("path traversal");
    });
  });

  describe("Observed Inflation Stream Counter", () => {
    it("throws ImportBudgetExceededError when actual inflated bytes exceed max limit", () => {
      const tracker = createInflationTracker(10 * 1024 * 1024); // 10MB limit
      tracker.track(5 * 1024 * 1024);
      expect(tracker.getObservedBytes()).toBe(5 * 1024 * 1024);

      expect(() => tracker.track(6 * 1024 * 1024)).toThrow(ImportBudgetExceededError);
    });

    it("rejects non-finite, negative and per-entry-overflow observations", () => {
      const tracker = createInflationTracker(100, 60);
      expect(() => tracker.track(Number.NaN, "a.xml")).toThrow(ImportBudgetExceededError);
      expect(() => tracker.track(-1, "a.xml")).toThrow(ImportBudgetExceededError);
      tracker.track(40, "a.xml");
      expect(() => tracker.track(21, "a.xml")).toThrow(ImportBudgetExceededError);
      expect(tracker.getObservedBytes()).toBe(40);
    });
  });

  describe("Canvas & Decoded Pixel Budgets", () => {
    it("rejects oversized canvas dimensions exceeding 8,192px", () => {
      const result = validateCanvasPixels(10_000, 2_000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("quá lớn");
    });

    it("rejects cumulative decoded pixels exceeding max Megapixel limit", () => {
      const result = validateCanvasPixels(4000, 4000, 90_000_000, IMPORT_LIMITS.MAX_PDF_TOTAL_DECODED_PIXELS);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Tổng số điểm ảnh");
    });

    it.each([
      [Number.NaN, 100, 0],
      [-1, 100, 0],
      [1.5, 100, 0],
      [100, 0, 0],
      [100, 100, -1],
      [100, 100, Number.POSITIVE_INFINITY],
    ])("rejects invalid pixel arithmetic (%s x %s, current=%s)", (width, height, current) => {
      expect(validateCanvasPixels(width, height, current).valid).toBe(false);
    });
  });
});
