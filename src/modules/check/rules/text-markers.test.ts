import { describe, expect, it } from "vitest";
import { placeholderTextRule } from "./text-markers";

describe("placeholderTextRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(placeholderTextRule.id).toBe("placeholder-text");
    expect(placeholderTextRule.severity).toBe("warning");
  });

  it("flags TODO / lorem ipsum / fix later (case-insensitive)", () => {
    const md = "Mở đầu\nTODO: viết phần này\nLorem Ipsum dolor\nwill FIX LATER";
    const issues = placeholderTextRule.run(md);
    expect(issues).toHaveLength(3);
    expect(issues.every((i) => i.id === "placeholder-text")).toBe(true);
    expect(issues[0].line).toBe(2);
  });

  it("returns [] for clean content", () => {
    expect(placeholderTextRule.run("Một đoạn văn hoàn chỉnh.")).toEqual([]);
  });

  it("does not match 'todos' as a TODO marker (word boundary)", () => {
    expect(placeholderTextRule.run("Danh sach todos cua nhom")).toEqual([]);
  });
});
