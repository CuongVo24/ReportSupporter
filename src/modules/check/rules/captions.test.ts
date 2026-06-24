import { describe, expect, it } from "vitest";
import { missingCaptionsRule } from "./captions";
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

describe("missingCaptionsRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(missingCaptionsRule.id).toBe("missing-captions");
    expect(missingCaptionsRule.severity).toBe("warning");
  });

  it("flags images with empty or missing alt text", () => {
    const md = "![](asset:img)";
    const ctx = mockCtx(md);
    const issues = missingCaptionsRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("missing-captions");
  });

  it("does not flag images with alt text", () => {
    const md = "![Đồ thị kết quả](asset:img)";
    const ctx = mockCtx(md);
    const issues = missingCaptionsRule.run(ctx);
    expect(issues).toEqual([]);
  });

  it("flags tables without adjacent caption paragraph", () => {
    const md = `
| Cột 1 | Cột 2 |
|---|---|
| A | B |
`;
    const ctx = mockCtx(md);
    const issues = missingCaptionsRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("missing-captions");
  });

  it("does not flag tables with preceding caption starting with 'Bảng'", () => {
    const md = `
Bảng 1.1: Danh sách thành viên

| Cột 1 | Cột 2 |
|---|---|
| A | B |
`;
    const ctx = mockCtx(md);
    const issues = missingCaptionsRule.run(ctx);
    expect(issues).toEqual([]);
  });

  it("does not flag tables with succeeding caption starting with 'Table'", () => {
    const md = `
| Cột 1 | Cột 2 |
|---|---|
| A | B |

Table 1.2: Member list
`;
    const ctx = mockCtx(md);
    const issues = missingCaptionsRule.run(ctx);
    expect(issues).toEqual([]);
  });
});
