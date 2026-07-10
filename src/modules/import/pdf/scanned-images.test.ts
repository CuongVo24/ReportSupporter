import { describe, expect, it } from "vitest";
import { isPageScanned } from "./detect-scanned";
import { convertImageObjToBase64, extractPageImages } from "./extract-images";
import { convertPdfPagesToMarkdown } from "./paragraph-merge";
import type { ExtractedPage } from "./extract-text";
import type { ImportWarning } from "@/types";

describe("Scanned Pages & Image Extraction Heuristics", () => {
  // Test scanned page detection
  describe("Scanned Page Detection (isPageScanned)", () => {
    it("should return true when page has very little text and a full-page image", () => {
      const pageWidth = 500;
      const pageHeight = 700;
      const totalTextLength = 20; // very little text
      const images = [
        { x: 10, y: 10, width: 450, height: 650 }, // covers > 70% of width and height
      ];

      expect(isPageScanned(pageWidth, pageHeight, totalTextLength, images)).toBe(true);
    });

    it("should return false when page has plenty of text, even with a full-page image", () => {
      const pageWidth = 500;
      const pageHeight = 700;
      const totalTextLength = 500; // plenty of text
      const images = [
        { x: 10, y: 10, width: 450, height: 650 },
      ];

      expect(isPageScanned(pageWidth, pageHeight, totalTextLength, images)).toBe(false);
    });

    it("should return false when page has very little text but no full-page image", () => {
      const pageWidth = 500;
      const pageHeight = 700;
      const totalTextLength = 20;
      const images = [
        { x: 10, y: 10, width: 100, height: 100 }, // small image
      ];

      expect(isPageScanned(pageWidth, pageHeight, totalTextLength, images)).toBe(false);
    });
  });

  // Test Image Base64 convert and fallbacks
  describe("Image Base64 Converter", () => {
    it("should fallback gracefully to a mock 1x1 transparent PNG in Node.js environment", () => {
      const imgObj = {
        width: 100,
        height: 100,
        data: new Uint8Array(100 * 100 * 4),
      };

      const result = convertImageObjToBase64(imgObj);
      expect(result).not.toBeNull();
      // In Node environment, it returns the fallback base64
      expect(result).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
    });
  });

  // Test extractPageImages limits (decorative and size limit)
  describe("extractPageImages limits", () => {
    it("should skip small decorative images (<24px) silently", async () => {
      const page = {
        objs: {
          get: () => ({
            width: 16,
            height: 16,
            data: new Uint8Array(16 * 16 * 4),
          }),
        },
      };

      const ops = {
        fnArray: [12, 85], // transform, paintImageXObject
        argsArray: [
          [16, 0, 0, -16, 10, 500], // cumulative transform (width 16, height 16)
          ["img_key_1"],
        ],
      };

      const warnings: ImportWarning[] = [];
      const images = await extractPageImages(page, ops, 1, warnings);

      // Should be skipped silently (no images, no warnings)
      expect(images).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it("should issue image-skipped warning if image exceeds 5MB size limit", async () => {
      const hugeBase64 = "data:image/png;base64," + "A".repeat(8000000);

      const page = {
        objs: {
          get: () => ({
            width: 100,
            height: 100,
            data: new Uint8Array(100 * 100 * 4),
          }),
        },
      };

      const ops = {
        fnArray: [12, 85],
        argsArray: [
          [500, 0, 0, -500, 10, 500], // width 500, height 500
          ["img_key_1"],
        ],
      };

      const globalRecord = globalThis as unknown as Record<string, unknown>;
      const originalDocument = globalRecord.document;

      try {
        globalRecord.document = {
          createElement: () => ({
            width: 0,
            height: 0,
            getContext: () => ({
              createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
              putImageData: () => {},
            }),
            toDataURL: () => hugeBase64,
          }),
        };

        const warnings: ImportWarning[] = [];
        await extractPageImages(page, ops, 1, warnings);

        expect(warnings).toHaveLength(1);
        expect(warnings[0].code).toBe("image-skipped");
      } finally {
        globalRecord.document = originalDocument;
      }
    });
  });

  // Test layout integration with scanned pages & images positioning
  describe("Scanned Page Layout Integration", () => {
    it("should produce scanned page placeholder and warning when page is scanned", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 2,
          width: 500,
          height: 700,
          items: [
            { text: "Scanned page text", fontSize: 10, fontName: "Arial", x: 10, y: 500, width: 50 }, // very little text
          ],
          images: [
            {
              type: "image",
              id: "scanned-page-img",
              fileName: "page-2.png",
              data: "data:image/png;base64,mock",
              x: 10,
              y: 10,
              width: 480, // covers > 70% width
              height: 680, // covers > 70% height
            },
          ],
        },
      ];

      const { markdown, warnings } = convertPdfPagesToMarkdown(pages, 10, {});
      expect(markdown).toContain("> [Trang 2: bản scan — chưa trích được chữ. Thử OCR (experimental) ở bản W24.]");
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("scanned-page");
      expect(warnings[0].location).toBe("trang 2");
    });

    it("should interleave text and images correctly sorted by y descending", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "Paragraph above image", fontSize: 10, fontName: "Arial", x: 10, y: 600, width: 100 },
            { text: "Paragraph below image", fontSize: 10, fontName: "Arial", x: 10, y: 400, width: 100 },
          ],
          images: [
            {
              type: "image",
              id: "img-mid",
              fileName: "mid.png",
              data: "data:image/png;base64,mock",
              x: 10,
              y: 500, // y is between 600 and 400
              width: 100,
              height: 100,
            },
          ],
        },
      ];

      const { markdown, assets } = convertPdfPagesToMarkdown(pages, 10, {});
      const lines = markdown.split("\n\n");
      expect(lines[0]).toBe("Paragraph above image");
      expect(lines[1]).toBe("![mid.png](asset:img-mid)");
      expect(lines[2]).toBe("Paragraph below image");
      expect(assets).toHaveLength(1);
      expect(assets[0].id).toBe("img-mid");
    });
  });
});
