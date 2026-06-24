import { describe, it, expect } from "vitest";
import { generateToc } from "./generate-toc";
import type { NumberedHeading } from "./number-headings";

describe("generateToc", () => {
  it("should return empty array for empty input", () => {
    expect(generateToc([])).toEqual([]);
  });

  it("should build a nested tree structure correctly", () => {
    const headings: NumberedHeading[] = [
      { depth: 1, text: "Chương 1", number: "1", id: "1-chuong-1", levelJumped: false },
      { depth: 2, text: "Mục 1.1", number: "1.1", id: "1-1-muc-1-1", levelJumped: false },
      { depth: 3, text: "Mục 1.1.1", number: "1.1.1", id: "1-1-1-muc-1-1-1", levelJumped: false },
      { depth: 2, text: "Mục 1.2", number: "1.2", id: "1-2-muc-1-2", levelJumped: false },
    ];

    const tree = generateToc(headings);
    expect(tree).toHaveLength(1);
    expect(tree[0].text).toBe("Chương 1");
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].text).toBe("Mục 1.1");
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].text).toBe("Mục 1.1.1");
    expect(tree[0].children[1].text).toBe("Mục 1.2");
  });

  it("should obey maxDepth cutoff", () => {
    const headings: NumberedHeading[] = [
      { depth: 1, text: "Chương 1", number: "1", id: "1-chuong-1", levelJumped: false },
      { depth: 2, text: "Mục 1.1", number: "1.1", id: "1-1-muc-1-1", levelJumped: false },
      { depth: 3, text: "Mục 1.1.1", number: "1.1.1", id: "1-1-1-muc-1-1-1", levelJumped: false },
      { depth: 4, text: "Mục sâu hơn", number: "1.1.1.1", id: "1-1-1-1-muc-sau-hon", levelJumped: false },
    ];

    // default maxDepth is 3
    const tree = generateToc(headings);
    expect(tree[0].children[0].children[0].children).toHaveLength(0); // depth 4 is cut off

    // custom maxDepth is 2
    const tree2 = generateToc(headings, 2);
    expect(tree2[0].children[0].children).toHaveLength(0); // depth 3 is cut off
  });

  it("should preserve input IDs", () => {
    const headings: NumberedHeading[] = [
      { depth: 1, text: "Giới thiệu", number: "1", id: "1-gioi-thieu", levelJumped: false },
      { depth: 1, text: "Giới thiệu", number: "2", id: "2-gioi-thieu", levelJumped: false },
    ];

    const tree = generateToc(headings);
    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe("1-gioi-thieu");
    expect(tree[1].id).toBe("2-gioi-thieu");
  });
});
