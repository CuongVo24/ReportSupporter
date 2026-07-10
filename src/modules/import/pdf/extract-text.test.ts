import { describe, expect, it } from "vitest";
import { sortTextItems, mergeAdjacentTextItems } from "./extract-text";
import type { TextItem } from "./extract-text";

describe("extract-text helpers", () => {
  describe("sortTextItems", () => {
    it("should sort items from top to bottom (y descending)", () => {
      const items: TextItem[] = [
        { text: "Bottom", fontSize: 10, fontName: "Arial", x: 10, y: 100, width: 50 },
        { text: "Middle", fontSize: 10, fontName: "Arial", x: 10, y: 200, width: 50 },
        { text: "Top", fontSize: 10, fontName: "Arial", x: 10, y: 300, width: 50 },
      ];

      const sorted = sortTextItems(items);
      expect(sorted[0].text).toBe("Top");
      expect(sorted[1].text).toBe("Middle");
      expect(sorted[2].text).toBe("Bottom");
    });

    it("should sort items from left to right (x ascending) when y coordinates are close", () => {
      const items: TextItem[] = [
        { text: "Right", fontSize: 10, fontName: "Arial", x: 100, y: 200, width: 50 },
        { text: "Left", fontSize: 10, fontName: "Arial", x: 10, y: 202, width: 50 },
      ];

      const sorted = sortTextItems(items);
      expect(sorted[0].text).toBe("Left");
      expect(sorted[1].text).toBe("Right");
    });

    it("should prioritize y difference over x when y diff exceeds tolerance", () => {
      const items: TextItem[] = [
        { text: "Lower but Left", fontSize: 10, fontName: "Arial", x: 10, y: 190, width: 50 },
        { text: "Higher but Right", fontSize: 10, fontName: "Arial", x: 100, y: 200, width: 50 },
      ];

      const sorted = sortTextItems(items);
      expect(sorted[0].text).toBe("Higher but Right");
      expect(sorted[1].text).toBe("Lower but Left");
    });
  });

  describe("mergeAdjacentTextItems", () => {
    it("should merge items that are close on the same line", () => {
      const items: TextItem[] = [
        { text: "Hello", fontSize: 10, fontName: "Arial", x: 10, y: 200, width: 30 },
        { text: "World", fontSize: 10, fontName: "Arial", x: 40.5, y: 200, width: 30 },
      ];

      const merged = mergeAdjacentTextItems(items);
      expect(merged).toHaveLength(1);
      expect(merged[0].text).toBe("HelloWorld");
      expect(merged[0].width).toBe(60.5);
    });

    it("should insert space between words based on gap size", () => {
      const items: TextItem[] = [
        { text: "Hello", fontSize: 10, fontName: "Arial", x: 10, y: 200, width: 30 },
        { text: "World", fontSize: 10, fontName: "Arial", x: 44, y: 200, width: 30 },
      ];

      const merged = mergeAdjacentTextItems(items);
      expect(merged).toHaveLength(1);
      expect(merged[0].text).toBe("Hello World");
      expect(merged[0].width).toBe(64);
    });

    it("should not merge items that are far apart", () => {
      const items: TextItem[] = [
        { text: "Hello", fontSize: 10, fontName: "Arial", x: 10, y: 200, width: 30 },
        { text: "World", fontSize: 10, fontName: "Arial", x: 100, y: 200, width: 30 },
      ];

      const merged = mergeAdjacentTextItems(items);
      expect(merged).toHaveLength(2);
      expect(merged[0].text).toBe("Hello");
      expect(merged[1].text).toBe("World");
    });

    it("should not merge items on different lines", () => {
      const items: TextItem[] = [
        { text: "Line 1", fontSize: 10, fontName: "Arial", x: 10, y: 200, width: 30 },
        { text: "Line 2", fontSize: 10, fontName: "Arial", x: 12, y: 190, width: 30 },
      ];

      const merged = mergeAdjacentTextItems(items);
      expect(merged).toHaveLength(2);
      expect(merged[0].text).toBe("Line 1");
      expect(merged[1].text).toBe("Line 2");
    });
  });
});
