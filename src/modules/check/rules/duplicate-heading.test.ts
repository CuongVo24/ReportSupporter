import { describe, expect, it } from "vitest";
import { duplicateHeadingRule } from "./duplicate-heading";
import type { CheckContext } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";

const mockCtx = (sections: Record<string, string>): CheckContext => {
  const sectionAsts: Record<string, unknown> = {};
  const bundleSections: unknown[] = [];
  
  for (const [id, markdown] of Object.entries(sections)) {
    sectionAsts[id] = parseMarkdown(markdown);
    bundleSections.push({ id, order: 1, title: id, markdown, status: "draft" as const });
  }

  return {
    bundle: {
      project: {
        id: "p",
        title: "t",
        templateId: "temp",
        metadata: {},
        sections: bundleSections,
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
    sectionAsts,
    templateId: "temp",
  };
};

describe("duplicateHeadingRule", () => {
  it("flags duplicate heading text even if IDs are unique due to hierarchy", () => {
    const ctx = mockCtx({
      s1: "# Giới thiệu\n\n## Nội dung\n",
      s2: "# Tổng quan\n\n## Nội dung\n",
    });
    const issues = duplicateHeadingRule.run(ctx);
    expect(issues).toHaveLength(2);
    expect(issues[0].message).toContain("trùng lặp");
    expect(issues[1].message).toContain("trùng lặp");
  });

  it("flags duplicate heading IDs when identical headings exist in the same level", () => {
    const ctx = mockCtx({
      s1: "# Giới thiệu\n\n## Mục 1\n\n## Mục 1\n",
    });
    const issues = duplicateHeadingRule.run(ctx);
    expect(issues).toHaveLength(2);
    expect(issues[0].message).toContain("trùng lặp");
  });

  it("does not flag unique headings", () => {
    const ctx = mockCtx({
      s1: "# Giới thiệu\n\n## Mục 1\n\n## Mục 2\n",
    });
    const issues = duplicateHeadingRule.run(ctx);
    expect(issues).toHaveLength(0);
  });
});
