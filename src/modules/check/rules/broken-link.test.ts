import { describe, expect, it } from "vitest";
import { brokenLinkRule } from "./broken-link";
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

describe("brokenLinkRule", () => {
  it("flags empty links", () => {
    const ctx = mockCtx({ sec: "[empty]()" });
    const issues = brokenLinkRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("trống");
  });

  it("flags broken internal anchors", () => {
    const ctx = mockCtx({ sec: "# Giới thiệu\n\n[quay lại](#khong-ton-tai)" });
    const issues = brokenLinkRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("neo không tồn tại");
  });

  it("does not flag valid internal anchors", () => {
    const ctx = mockCtx({ sec: "# Giới thiệu\n\n[quay lại](#1-gioi-thieu)" });
    const issues = brokenLinkRule.run(ctx);
    expect(issues).toHaveLength(0);
  });

  it("flags relative local file links", () => {
    const ctx = mockCtx({ sec: "[tài liệu](docs/guide.md)" });
    const issues = brokenLinkRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("đường dẫn cục bộ chưa hỗ trợ");
  });

  it("does not flag standard remote web links", () => {
    const ctx = mockCtx({ sec: "[google](https://google.com)" });
    const issues = brokenLinkRule.run(ctx);
    expect(issues).toHaveLength(0);
  });
});
