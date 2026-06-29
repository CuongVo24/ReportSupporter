import { describe, expect, it } from "vitest";
import { tocDriftRule } from "./toc-drift";
import type { CheckContext, ReportSection, MdastRoot } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";

const mockCtx = (sections: Record<string, string>): CheckContext => {
  const sectionAsts: Record<string, MdastRoot> = {};
  const bundleSections: ReportSection[] = [];
  
  for (const [id, markdown] of Object.entries(sections)) {
    sectionAsts[id] = parseMarkdown(markdown) as MdastRoot;
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

describe("tocDriftRule", () => {
  it("flags broken TOC links (non-existent anchors)", () => {
    const ctx = mockCtx({
      s1: `
# Mục lục
- [1. Giới thiệu](#1-gioi-thieu)
- [2. Nội dung](#khong-ton-tai)

# Giới thiệu
Nội dung giới thiệu.
      `,
    });
    const issues = tocDriftRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("neo không tồn tại");
  });

  it("flags mismatch in TOC heading texts", () => {
    const ctx = mockCtx({
      s1: `
# Mục lục
- [1. Sai Tên Giới Thiệu](#1-gioi-thieu)

# Giới thiệu
Nội dung.
      `,
    });
    const issues = tocDriftRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("Nội dung mục lục bị lệch");
  });

  it("flags text-only TOC items pointing to non-existent headings", () => {
    const ctx = mockCtx({
      s1: `
# Table of Contents
- 1. Không tồn tại

# Giới thiệu
Nội dung.
      `,
    });
    const issues = tocDriftRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("tiêu đề không tồn tại");
  });

  it("flags text-only TOC items with incorrect numbering", () => {
    const ctx = mockCtx({
      s1: `
# Mục lục
- 3. Giới thiệu

# Giới thiệu
Nội dung.
      `,
    });
    const issues = tocDriftRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("Số thứ tự mục lục bị lệch");
  });

  it("does not flag matching TOC items", () => {
    const ctx = mockCtx({
      s1: `
# Mục lục
- [1. Giới thiệu](#1-gioi-thieu)
- [1.1. Chi tiết](#1-1-chi-tiet)

# Giới thiệu
## Chi tiết
Nội dung.
      `,
    });
    const issues = tocDriftRule.run(ctx);
    expect(issues).toHaveLength(0);
  });
});
