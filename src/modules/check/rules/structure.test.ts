import { describe, expect, it } from "vitest";
import { hardcodedHeadingNumberRule, emptySectionRule } from "./structure";
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

describe("hardcodedHeadingNumberRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(hardcodedHeadingNumberRule.id).toBe("hardcoded-heading-number");
    expect(hardcodedHeadingNumberRule.severity).toBe("warning");
  });

  it("flags headings starting with hardcoded numbers or chapters", () => {
    const triggers = [
      "# 1. Mở đầu",
      "## 1.2. Mục tiêu",
      "# Chương 1. Giới thiệu",
      "# Chapter 2: Background",
      "### 2.3.4 Chi tiết",
    ];

    for (const md of triggers) {
      const ctx = mockCtx([{ id: "sec", order: 1, markdown: md }]);
      const issues = hardcodedHeadingNumberRule.run(ctx);
      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe("hardcoded-heading-number");
    }
  });

  it("does not flag headings with normal text or inline numbers", () => {
    const nonTriggers = [
      "# Mở đầu",
      "## Lời nói đầu",
      "# Bài học số 1",
      "# Tiêu chuẩn ISO 9001",
      "# 2024 Tổng kết",
      "# 5 bài học",
    ];

    for (const md of nonTriggers) {
      const ctx = mockCtx([{ id: "sec", order: 1, markdown: md }]);
      const issues = hardcodedHeadingNumberRule.run(ctx);
      expect(issues).toEqual([]);
    }
  });
});

describe("emptySectionRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(emptySectionRule.id).toBe("empty-section");
    expect(emptySectionRule.severity).toBe("warning");
  });

  it("flags sections that only contain headings and whitespace", () => {
    const triggers = [
      "# Mở đầu",
      "# Mở đầu\n\n  \n",
      "# Mở đầu\n## Subheading",
    ];

    for (const md of triggers) {
      const ctx = mockCtx([{ id: "sec", order: 1, markdown: md }]);
      const issues = emptySectionRule.run(ctx);
      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe("empty-section");
    }
  });

  it("does not flag sections with body content", () => {
    const nonTriggers = [
      "# Mở đầu\nĐây là nội dung.",
      "# Mở đầu\n- Một danh sách\n- Hai danh sách",
      "# Mở đầu\n![](asset:img)",
      "# Mở đầu\n```ts\nconst x = 42;\n```",
    ];

    for (const md of nonTriggers) {
      const ctx = mockCtx([{ id: "sec", order: 1, markdown: md }]);
      const issues = emptySectionRule.run(ctx);
      expect(issues).toEqual([]);
    }
  });
});
