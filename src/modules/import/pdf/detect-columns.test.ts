import { describe, expect, it } from "vitest";
import { detectAndSortColumns, groupItemsIntoLines, detectTableLines } from "./detect-columns";
import { convertPdfPagesToMarkdown } from "./paragraph-merge";
import type { TextItem, ExtractedPage } from "./extract-text";

describe("detect-columns helpers", () => {
  describe("detectAndSortColumns", () => {
    it("should identify normal layout (isTwoColumn = false)", () => {
      const items: TextItem[] = [
        { text: "Intro paragraph", fontSize: 10, fontName: "Arial", x: 10, y: 500, width: 200 },
        { text: "Middle paragraph", fontSize: 10, fontName: "Arial", x: 10, y: 480, width: 200 },
      ];

      const { sortedItems, isTwoColumn } = detectAndSortColumns(items, 500);
      expect(isTwoColumn).toBe(false);
      expect(sortedItems).toHaveLength(2);
    });

    it("should identify 2-column layout and sort left column first, then right column", () => {
      const items: TextItem[] = [
        { text: "Right row 1", fontSize: 10, fontName: "Arial", x: 280, y: 500, width: 100 },
        { text: "Left row 1", fontSize: 10, fontName: "Arial", x: 20, y: 500, width: 100 },
        { text: "Right row 2", fontSize: 10, fontName: "Arial", x: 280, y: 450, width: 100 },
        { text: "Left row 2", fontSize: 10, fontName: "Arial", x: 20, y: 450, width: 100 },
      ];

      // 50% left, 50% right, 0% gutter cross -> two column
      const { sortedItems, isTwoColumn } = detectAndSortColumns(items, 500);
      expect(isTwoColumn).toBe(true);
      expect(sortedItems).toHaveLength(4);
      expect(sortedItems[0].text).toBe("Left row 1");
      expect(sortedItems[1].text).toBe("Left row 2");
      expect(sortedItems[2].text).toBe("Right row 1");
      expect(sortedItems[3].text).toBe("Right row 2");
    });
  });

  describe("groupItemsIntoLines", () => {
    it("should group items on the same y baseline (within 5 units tolerance)", () => {
      const items: TextItem[] = [
        { text: "Col 2", fontSize: 10, fontName: "Arial", x: 100, y: 200, width: 50 },
        { text: "Col 1", fontSize: 10, fontName: "Arial", x: 10, y: 202, width: 50 },
        { text: "Next line", fontSize: 10, fontName: "Arial", x: 10, y: 150, width: 50 },
      ];

      const lines = groupItemsIntoLines(items);
      expect(lines).toHaveLength(2);
      expect(lines[0].items).toHaveLength(2);
      expect(lines[0].items[0].text).toBe("Col 1"); // sorted by x
      expect(lines[0].items[1].text).toBe("Col 2");
      expect(lines[1].items[0].text).toBe("Next line");
    });
  });

  describe("detectTableLines", () => {
    it("should detect table lines when >= 3 consecutive lines have >= 2 aligned columns", () => {
      const items: TextItem[] = [
        // Row 1 (y = 300)
        { text: "Row1 C1", fontSize: 10, fontName: "Arial", x: 10, y: 300, width: 50 },
        { text: "Row1 C2", fontSize: 10, fontName: "Arial", x: 150, y: 300, width: 50 },
        // Row 2 (y = 280)
        { text: "Row2 C1", fontSize: 10, fontName: "Arial", x: 12, y: 280, width: 50 },
        { text: "Row2 C2", fontSize: 10, fontName: "Arial", x: 152, y: 280, width: 50 },
        // Row 3 (y = 260)
        { text: "Row3 C1", fontSize: 10, fontName: "Arial", x: 10, y: 260, width: 50 },
        { text: "Row3 C2", fontSize: 10, fontName: "Arial", x: 148, y: 260, width: 50 },
        // Regular line (y = 200)
        { text: "Regular paragraph text line", fontSize: 10, fontName: "Arial", x: 10, y: 200, width: 200 },
      ];

      const lines = groupItemsIntoLines(items);
      const tableLines = detectTableLines(lines);

      expect(tableLines.size).toBe(3);
      expect(tableLines.has(300)).toBe(true);
      expect(tableLines.has(280)).toBe(true);
      expect(tableLines.has(260)).toBe(true);
      expect(tableLines.has(200)).toBe(false);
    });

    it("should not detect tables when consecutive lines are less than 3", () => {
      const items: TextItem[] = [
        // Row 1 (y = 300)
        { text: "Row1 C1", fontSize: 10, fontName: "Arial", x: 10, y: 300, width: 50 },
        { text: "Row1 C2", fontSize: 10, fontName: "Arial", x: 150, y: 300, width: 50 },
        // Row 2 (y = 280)
        { text: "Row2 C1", fontSize: 10, fontName: "Arial", x: 12, y: 280, width: 50 },
        { text: "Row2 C2", fontSize: 10, fontName: "Arial", x: 152, y: 280, width: 50 },
      ];

      const lines = groupItemsIntoLines(items);
      const tableLines = detectTableLines(lines);
      expect(tableLines.size).toBe(0); // less than 3 lines
    });
  });

  describe("Markdown Conversion with Columns/Tables", () => {
    it("should format table rows with tab characters and issue table-flattened warning", () => {
      const pages: ExtractedPage[] = [
        {
          pageNumber: 1,
          width: 500,
          height: 700,
          items: [
            { text: "R1 C1", fontSize: 10, fontName: "Arial", x: 10, y: 300, width: 50 },
            { text: "R1 C2", fontSize: 10, fontName: "Arial", x: 150, y: 300, width: 50 },
            { text: "R2 C1", fontSize: 10, fontName: "Arial", x: 10, y: 280, width: 50 },
            { text: "R2 C2", fontSize: 10, fontName: "Arial", x: 150, y: 280, width: 50 },
            { text: "R3 C1", fontSize: 10, fontName: "Arial", x: 10, y: 260, width: 50 },
            { text: "R3 C2", fontSize: 10, fontName: "Arial", x: 150, y: 260, width: 50 },
          ],
        },
      ];

      const { markdown, warnings } = convertPdfPagesToMarkdown(pages, 10, {});
      expect(markdown).toBe("R1 C1\tR1 C2\n\nR2 C1\tR2 C2\n\nR3 C1\tR3 C2");
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("table-flattened");
      expect(warnings[0].location).toBe("trang 1");
    });
  });
});
