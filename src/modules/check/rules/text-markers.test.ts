import { describe, expect, it } from "vitest";
import { placeholderTextRule } from "./text-markers";
import type { CheckContext } from "@/types";

const mockCtx = (markdown: string): CheckContext => ({
  bundle: {
    project: {
      id: "p",
      title: "t",
      templateId: "temp",
      metadata: {},
      sections: [{ id: "sec", order: 1, title: "t", markdown, status: "draft" as const }],
      updatedAt: "",
    },
    assets: [],
    evidence: [],
    formatSettings: {
      presetId: "academic-default",
      includeToc: true,
      includeListOfFigures: false,
      includeListOfTables: false,
      captionNumbering: "continuous",
    },
    schemaVersion: 1,
  },
  sectionAsts: {},
  templateId: "temp",
});

describe("placeholderTextRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(placeholderTextRule.id).toBe("placeholder-text");
    expect(placeholderTextRule.severity).toBe("warning");
  });

  it("flags TODO / lorem ipsum / fix later (case-insensitive)", () => {
    const md = "Mở đầu\nTODO: viết phần này\nLorem Ipsum dolor\nwill FIX LATER";
    const issues = placeholderTextRule.run(mockCtx(md));
    expect(issues).toHaveLength(3);
    expect(issues.every((i) => i.id === "placeholder-text")).toBe(true);
    expect(issues[0].line).toBe(2);
    expect(issues[0].sectionId).toBe("sec");
  });

  it("returns [] for clean content", () => {
    expect(placeholderTextRule.run(mockCtx("Một đoạn văn hoàn chỉnh."))).toEqual([]);
  });

  it("does not match 'todos' as a TODO marker (word boundary)", () => {
    expect(placeholderTextRule.run(mockCtx("Danh sach todos cua nhom"))).toEqual([]);
  });
});
