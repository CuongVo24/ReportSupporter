import { describe, expect, it } from "vitest";
import { buildHeadingMap, isItemHeading, getHeadingLevel } from "./heading-heuristic";
import { detectListType, convertPdfPagesToMarkdown } from "./paragraph-merge";
import type { ExtractedPage, TextItem } from "./extract-text";

describe("PDF Layout Heuristics", () => {
  // Test cases 1-3: Font size clustering & mode resolution
  describe("Font Size Clustering (buildHeadingMap)", () => {
    it("case 1: should resolve body size as the mode size based on char weight", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "Title", fontSize: 24, fontName: "Arial", x: 10, y: 500, width: 50 },
            { text: "Long body paragraph content goes here", fontSize: 10, fontName: "Arial", x: 10, y: 400, width: 200 },
            { text: "Another body line here", fontSize: 10, fontName: "Arial", x: 10, y: 380, width: 100 },
          ],
        },
      ];

      const { bodySize } = buildHeadingMap(pages);
      expect(bodySize).toBe(10);
    });

    it("case 2: should identify H1 and H2 sizes correctly above bodySize * 1.15", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "Heading Level 1", fontSize: 20, fontName: "Arial", x: 10, y: 600, width: 100 },
            { text: "Heading Level 2", fontSize: 15, fontName: "Arial", x: 10, y: 500, width: 100 },
            { text: "Standard body text here", fontSize: 10, fontName: "Arial", x: 10, y: 400, width: 150 },
          ],
        },
      ];

      const { headingMap } = buildHeadingMap(pages);
      expect(headingMap[20]).toBe(1);
      expect(headingMap[15]).toBe(2);
      expect(headingMap[10]).toBeUndefined();
    });

    it("case 3: should fallback gracefully when no clear sizes exist", () => {
      const { bodySize, headingMap } = buildHeadingMap([]);
      expect(bodySize).toBe(12);
      expect(headingMap).toEqual({});
    });
  });

  // Test cases 4-7: Heading item detection & levels
  describe("Heading Detection", () => {
    const headingMap = { 20: 1 as const, 15: 2 as const };
    const bodySize = 10;

    it("case 4: should detect exact matched sizes from headingMap", () => {
      const item: TextItem = { text: "Intro", fontSize: 20, fontName: "Arial", x: 10, y: 500, width: 50 };
      expect(isItemHeading(item, bodySize, headingMap)).toBe(true);
      expect(getHeadingLevel(item, bodySize, headingMap)).toBe(1);
    });

    it("case 5: should detect bold short items near body size as H3", () => {
      const item: TextItem = { text: "Section Topic", fontSize: 10, fontName: "Arial (Bold)", x: 10, y: 500, width: 50 };
      expect(isItemHeading(item, bodySize, headingMap)).toBe(true);
      expect(getHeadingLevel(item, bodySize, headingMap)).toBe(3);
    });

    it("case 6: should reject long bold text as heading", () => {
      const item: TextItem = {
        text: "This is a very long bold text segment that represents a standard paragraph rather than a short heading topic, so it should be rejected.",
        fontSize: 10,
        fontName: "Arial (Bold)",
        x: 10,
        y: 500,
        width: 400,
      };
      expect(isItemHeading(item, bodySize, headingMap)).toBe(false);
    });

    it("case 7: should reject standard non-bold body text as heading", () => {
      const item: TextItem = { text: "Plain text", fontSize: 10, fontName: "Arial", x: 10, y: 500, width: 50 };
      expect(isItemHeading(item, bodySize, headingMap)).toBe(false);
    });
  });

  // Test cases 8-9: List prefixes detection
  describe("detectListType", () => {
    it("case 8: should match common bullets correctly", () => {
      expect(detectListType("• First item")).toEqual({ type: "bullet", prefix: "• " });
      expect(detectListType("- Second item")).toEqual({ type: "bullet", prefix: "- " });
      expect(detectListType("* Third item")).toEqual({ type: "bullet", prefix: "* " });
    });

    it("case 9: should match numbered and lettered lists correctly", () => {
      expect(detectListType("1. Numbered")).toEqual({ type: "numbered", prefix: "1. " });
      expect(detectListType("a) Lettered")).toEqual({ type: "numbered", prefix: "a) " });
      expect(detectListType("b. Lettered dot")).toEqual({ type: "numbered", prefix: "b. " });
    });
  });

  // Test cases 10-15: PDF Pages to Markdown Conversion
  describe("convertPdfPagesToMarkdown", () => {
    const headingMap = { 20: 1 as const, 15: 2 as const };
    const bodySize = 10;

    it("case 10: should convert headings and strip hardcoded numbers", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "1. Giới thiệu tổng quan", fontSize: 20, fontName: "Arial", x: 10, y: 600, width: 100 },
          ],
        },
      ];

      const { markdown, warnings } = convertPdfPagesToMarkdown(pages, bodySize, headingMap);
      expect(markdown).toBe("# Giới thiệu tổng quan");
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("heading-guessed");
      expect(warnings[0].location).toBe("trang 1");
    });

    it("case 11: should merge lines into paragraphs when vertical gap is small", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "This is the first line of a paragraph.", fontSize: 10, fontName: "Arial", x: 10, y: 500, width: 150 },
            { text: "And this is the second line.", fontSize: 10, fontName: "Arial", x: 10, y: 485, width: 120 }, // 15 unit gap (< 10 * 2.2)
          ],
        },
      ];

      const { markdown } = convertPdfPagesToMarkdown(pages, bodySize, headingMap);
      expect(markdown).toBe("This is the first line of a paragraph. And this is the second line.");
    });

    it("case 12: should start a new paragraph when vertical gap is large", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "This is paragraph one.", fontSize: 10, fontName: "Arial", x: 10, y: 500, width: 150 },
            { text: "This is paragraph two.", fontSize: 10, fontName: "Arial", x: 10, y: 470, width: 120 }, // 30 unit gap (> 10 * 2.2)
          ],
        },
      ];

      const { markdown } = convertPdfPagesToMarkdown(pages, bodySize, headingMap);
      expect(markdown).toBe("This is paragraph one.\n\nThis is paragraph two.");
    });

    it("case 13: should handle hyphenation removal at line endings", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "We are building an applica-", fontSize: 10, fontName: "Arial", x: 10, y: 500, width: 150 },
            { text: "tion locally.", fontSize: 10, fontName: "Arial", x: 10, y: 485, width: 80 },
          ],
        },
      ];

      const { markdown } = convertPdfPagesToMarkdown(pages, bodySize, headingMap);
      expect(markdown).toBe("We are building an application locally.");
    });

    it("case 14: should format simple lists and strip bullet prefixes", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "• Item one", fontSize: 10, fontName: "Arial", x: 10, y: 500, width: 80 },
            { text: "• Item two", fontSize: 10, fontName: "Arial", x: 10, y: 480, width: 80 },
          ],
        },
      ];

      const { markdown } = convertPdfPagesToMarkdown(pages, bodySize, headingMap);
      expect(markdown).toBe("- Item one\n\n- Item two");
    });

    it("case 15: should format nested lists based on x coordinate indentation", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "Standard paragraph starting at x=10.", fontSize: 10, fontName: "Arial", x: 10, y: 520, width: 150 },
            { text: "• Level 1 list item", fontSize: 10, fontName: "Arial", x: 10, y: 500, width: 80 },
            { text: "• Level 2 nested item", fontSize: 10, fontName: "Arial", x: 30, y: 480, width: 80 }, // Indented (30 > 10 + 15)
          ],
        },
      ];

      const { markdown } = convertPdfPagesToMarkdown(pages, bodySize, headingMap);
      expect(markdown).toBe("Standard paragraph starting at x=10.\n\n- Level 1 list item\n\n  - Level 2 nested item");
    });
  });
});
