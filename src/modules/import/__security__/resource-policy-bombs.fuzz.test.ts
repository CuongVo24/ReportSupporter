import { describe, expect, it } from "vitest";
import {
  validateZipPreflight,
  createInflationTracker,
  validateCanvasPixels,
  IMPORT_LIMITS,
  ImportBudgetExceededError,
} from "../resource-policy";
import type JSZip from "jszip";

describe("Import Resource Budgets & Bomb Protection (W25-H)", () => {
  describe("ZIP Archive Preflight Validation", () => {
    it("rejects archives exceeding maximum entry count (5,000 entries)", () => {
      const mockZip = {
        files: Object.fromEntries(
          Array.from({ length: 5001 }, (_, i) => [`file_${i}.txt`, { name: `file_${i}.txt` }]),
        ),
      } as unknown as JSZip;

      const result = validateZipPreflight(mockZip);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("chứa quá nhiều mục");
    });

    it("rejects archives containing path traversal entries ('../')", () => {
      const mockZip = {
        files: {
          "safe.xml": { name: "safe.xml" },
          "../evil.sh": { name: "../evil.sh" },
        },
      } as unknown as JSZip;

      const result = validateZipPreflight(mockZip);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("path traversal");
    });

    it("rejects archives with excessive directory depth (>20 levels)", () => {
      const deepPath = "a/".repeat(22) + "deep.xml";
      const mockZip = {
        files: {
          [deepPath]: { name: deepPath },
        },
      } as unknown as JSZip;

      const result = validateZipPreflight(mockZip);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("lồng quá sâu");
    });

    it("detects ZIP bomb metadata with extreme compression ratios (>100x)", () => {
      const mockZip = {
        files: {
          "bomb.xml": {
            name: "bomb.xml",
            _data: {
              compressedSize: 200 * 1024,
              uncompressedSize: 50 * 1024 * 1024, // 250x compression ratio
            },
          },
        },
      } as unknown as JSZip;

      const result = validateZipPreflight(mockZip);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("ZIP bomb");
    });

    it("rejects single entry exceeding 100MB limit", () => {
      const mockZip = {
        files: {
          "big.xml": {
            name: "big.xml",
            _data: { compressedSize: 10 * 1024 * 1024, uncompressedSize: 150 * 1024 * 1024 },
          },
        },
      } as unknown as JSZip;

      const result = validateZipPreflight(mockZip);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("giải nén quá lớn");
    });

    it("rejects archives exceeding total uncompressed byte limits (250MB)", () => {
      const mockZip = {
        files: {
          "part1.xml": {
            name: "part1.xml",
            _data: { compressedSize: 10 * 1024 * 1024, uncompressedSize: 90 * 1024 * 1024 },
          },
          "part2.xml": {
            name: "part2.xml",
            _data: { compressedSize: 10 * 1024 * 1024, uncompressedSize: 90 * 1024 * 1024 },
          },
          "part3.xml": {
            name: "part3.xml",
            _data: { compressedSize: 10 * 1024 * 1024, uncompressedSize: 90 * 1024 * 1024 },
          },
        },
      } as unknown as JSZip;

      const result = validateZipPreflight(mockZip);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Tổng dung lượng giải nén");
    });
  });

  describe("Observed Inflation Stream Counter", () => {
    it("throws ImportBudgetExceededError when actual inflated bytes exceed max limit", () => {
      const tracker = createInflationTracker(10 * 1024 * 1024); // 10MB limit
      tracker.track(5 * 1024 * 1024);
      expect(tracker.getObservedBytes()).toBe(5 * 1024 * 1024);

      expect(() => tracker.track(6 * 1024 * 1024)).toThrow(ImportBudgetExceededError);
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
  });
});
