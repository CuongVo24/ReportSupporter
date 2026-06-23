import { describe, expect, it } from "vitest";
import { tableTooWideRule } from "./table-width";
import type { CheckContext } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";

const mockCtx = (markdown: string): CheckContext => {
  const ast = parseMarkdown(markdown);
  return {
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
    sectionAsts: {
      sec: ast,
    },
    templateId: "temp",
  };
};

describe("tableTooWideRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(tableTooWideRule.id).toBe("table-too-wide");
    expect(tableTooWideRule.severity).toBe("info");
  });

  it("flags a table with more than 6 columns", () => {
    const md = `
| C1 | C2 | C3 | C4 | C5 | C6 | C7 |
|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 | 6 | 7 |
`;
    const ctx = mockCtx(md);
    const issues = tableTooWideRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("table-too-wide");
    expect(issues[0].message).toContain("7 cột");
  });

  it("does not flag tables with 6 columns or less", () => {
    const md = `
| C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 | 6 |
`;
    const ctx = mockCtx(md);
    const issues = tableTooWideRule.run(ctx);
    expect(issues).toEqual([]);
  });
});
