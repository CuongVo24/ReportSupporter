import { describe, expect, it } from "vitest";
import { brokenImageRule } from "./images";
import type { CheckContext } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";

const mockCtx = (markdown: string, assets: { id: string; url: string }[] = []): CheckContext => {
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
      assets: assets.map((a) => ({
        ...a,
        mimeType: "image/png",
        createdAt: "",
        kind: "image" as const,
        fileName: "img.png",
        data: a.url,
        insertedAt: "",
      })),
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

describe("brokenImageRule", () => {
  it("has the canonical rule id and severity (3.Check.md §5.2)", () => {
    expect(brokenImageRule.id).toBe("broken-image");
    expect(brokenImageRule.severity).toBe("error");
  });

  it("flags images with an empty URL", () => {
    const md = "![alt]()";
    const ctx = mockCtx(md);
    const issues = brokenImageRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("broken-image");
  });

  it("flags orphan asset references (asset not present in bundle.assets)", () => {
    const md = "![alt](asset:ghost-image)";
    const ctx = mockCtx(md, []);
    const issues = brokenImageRule.run(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("broken-image");
    expect(issues[0].message).toContain("ghost-image");
  });

  it("does not flag valid asset references", () => {
    const md = "![alt](asset:valid-image)";
    const ctx = mockCtx(md, [{ id: "valid-image", url: "data:image/png;base64,..." }]);
    const issues = brokenImageRule.run(ctx);
    expect(issues).toEqual([]);
  });

  it("does not flag regular HTTP URLs or absolute local paths (not asset: prefix)", () => {
    const md = "![alt](https://example.com/img.png)\n![alt](/images/local.png)";
    const ctx = mockCtx(md);
    const issues = brokenImageRule.run(ctx);
    expect(issues).toEqual([]);
  });
});
