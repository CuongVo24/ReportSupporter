import { describe, expect, it } from "vitest";
import { skippedHeadingLevelRule } from "./heading-levels";
import type { CheckContext } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import type { Root as MdastRoot } from "mdast";

const mockCtx = (sections: { id: string; order: number; markdown: string }[]): CheckContext => {
  const sectionAsts: Record<string, MdastRoot> = {};
  for (const s of sections) {
    sectionAsts[s.id] = parseMarkdown(s.markdown);
  }
  return {
    bundle: {
      project: {
        id: "p",
        title: "t",
        templateId: "temp",
        metadata: {},
        sections: sections.map((s) => ({ ...s, title: "Title", status: "draft" as const })),
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

describe("skippedHeadingLevelRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(skippedHeadingLevelRule.id).toBe("skipped-heading-level");
    expect(skippedHeadingLevelRule.severity).toBe("warning");
  });

  it("flags a level jump (e.g. h1 -> h3)", () => {
    const ctx = mockCtx([
      { id: "sec1", order: 1, markdown: "# Title H1\n### Title H3" },
    ]);
    const issues = skippedHeadingLevelRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("skipped-heading-level");
    expect(issues[0].sectionId).toBe("sec1");
  });

  it("does not flag sequential levels (e.g. h1 -> h2)", () => {
    const ctx = mockCtx([
      { id: "sec1", order: 1, markdown: "# Title H1\n## Title H2" },
    ]);
    const issues = skippedHeadingLevelRule.run(ctx);
    expect(issues).toEqual([]);
  });

  it("flags level jumps across different sections in order", () => {
    const ctx = mockCtx([
      { id: "sec1", order: 1, markdown: "# Section 1 H1" },
      { id: "sec2", order: 2, markdown: "### Section 2 H3" },
    ]);
    const issues = skippedHeadingLevelRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].sectionId).toBe("sec2");
  });
});
