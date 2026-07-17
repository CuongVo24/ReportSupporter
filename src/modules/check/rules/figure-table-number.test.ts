import { describe, expect, it } from "vitest";
import { figureTableNumberRule } from "./figure-table-number";
import type { CheckContext, ReportSection, MdastRoot } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";

const mockCtx = (
  sections: Record<string, string>,
  captionNumbering: "continuous" | "per-chapter" = "per-chapter",
  respectAuthorNumbering = true
): CheckContext => {
  const sectionAsts: Record<string, MdastRoot> = {};
  const bundleSections: ReportSection[] = [];
  
  for (const [id, markdown] of Object.entries(sections)) {
    sectionAsts[id] = parseMarkdown(markdown) as MdastRoot;
    bundleSections.push({ id, order: 1, title: id, markdown, status: "draft" as const, revision: 0 });
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
        captionNumbering,
        respectAuthorNumbering,
      },
      schemaVersion: 1,
    },
    sectionAsts,
    templateId: "temp",
  };
};

describe("figureTableNumberRule", () => {
  it("flags gaps in continuous numbering", () => {
    const ctx = mockCtx(
      {
        s1: `
![Alt](img1.png)
Hình 1: Ảnh 1

![Alt](img2.png)
Hình 3: Ảnh 3
        `,
      },
      "continuous",
      true
    );
    const issues = figureTableNumberRule.run(ctx);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues.some(i => i.message.includes("không liên tục"))).toBe(true);
  });

  it("flags gaps in per-chapter numbering", () => {
    const ctx = mockCtx(
      {
        s1: `
# Chương 1
![Alt](img1.png)
Hình 1.1: Ảnh 1

![Alt](img2.png)
Hình 1.3: Ảnh 3
        `,
      },
      "per-chapter",
      true
    );
    const issues = figureTableNumberRule.run(ctx);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues.some(i => i.message.includes("không liên tục trong chương"))).toBe(true);
  });

  it("flags conflicts between typed numbers and generated numbers", () => {
    const ctx = mockCtx(
      {
        s1: `
# Chương 1
![Alt](img1.png)
Hình 1.5: Ảnh 1
        `,
      },
      "per-chapter",
      false // do not respect author numbering, so system calculates 1.1 but author typed 1.5
    );
    const issues = figureTableNumberRule.run(ctx);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues.some(i => i.message.includes("không khớp"))).toBe(true);
  });
});
