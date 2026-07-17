// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { parseMarkdown, renderMdastToHtml, stringifyHast } from "@/lib/markdown-pipeline";
import { parseHeadings, numberHeadings, injectHeadingNumbers } from "@/modules/format";
import type { HeadingNode } from "@/modules/format";
import { prepareExport } from "./prepare-export";
import { buildPrintableHtml } from "./print-preview";
import type { ReportProjectBundle } from "@/types";

function createMockBundle(sections: { id: string; markdown: string }[], evidenceUrls: string[] = []): ReportProjectBundle {
  return {
    project: {
      id: "proj-1",
      title: "Parity Test Report",
      templateId: "software-project",
      metadata: {},
      sections: sections.map((s, index) => ({
        id: s.id,
        order: index,
        title: `Section ${s.id}`,
        markdown: s.markdown,
        status: "draft",
        revision: 0,
      })),
      updatedAt: "2026-06-29T00:00:00Z",
    },
    assets: [],
    evidence: evidenceUrls.map((url, index) => ({
      id: `ev-${index + 1}`,
      kind: "github",
      title: `Evidence ${index + 1}`,
      url,
      qrEnabled: false,
      createdAt: "2026-06-29T00:00:00Z",
    })),
    formatSettings: {
      presetId: "academic-default",
      includeToc: true,
      includeListOfFigures: false,
      includeListOfTables: false,
      captionNumbering: "continuous",
    },
    schemaVersion: 1,
  };
}

describe("Preview and Export Render Parity", () => {
  it("renders headings with identical IDs and clobberPrefix override", () => {
    const bundle = createMockBundle([
      { id: "sec-1", markdown: "# Mục tiêu dự án\n\nNội dung mục tiêu." },
      { id: "sec-2", markdown: "## Thiết kế chi tiết\n\nXem [github](https://github.com/user/repo)" }
    ], ["https://github.com/user/repo"]);

    // 1. Prepare export (creates hast)
    const exportOutput = prepareExport(bundle);
    const exportHtml = stringifyHast(exportOutput.formatted.hast);

    // 2. Live preview style rendering
    const allHeadings: HeadingNode[] = [];
    const parsedSections = bundle.project.sections.map((sec) => {
      const ast = parseMarkdown(sec.markdown);
      allHeadings.push(...parseHeadings(ast).map(h => ({ ...h, sectionId: sec.id })));
      return { sec, ast };
    });

    const globalNumberedHeadings = numberHeadings(allHeadings);
    const renderState = { index: 0 };
    
    const previewHtmlParts = parsedSections.map((p) => {
      const numberedAst = injectHeadingNumbers(p.ast, globalNumberedHeadings, renderState);
      return renderMdastToHtml(numberedAst);
    });
    const previewHtmlCombined = previewHtmlParts.join("");

    // Assertions: heading elements contain the exact same IDs
    expect(exportHtml).toContain('id="1-muc-tieu-du-an"');
    expect(previewHtmlCombined).toContain('id="1-muc-tieu-du-an"');
    expect(exportHtml).toContain('id="1-1-thiet-ke-chi-tiet"');
    expect(previewHtmlCombined).toContain('id="1-1-thiet-ke-chi-tiet"');

    // Assertions: no clobberPrefix (e.g. user-content-) is present
    expect(exportHtml).not.toContain('id="user-content-');
    expect(previewHtmlCombined).not.toContain('id="user-content-');
  });

  it("handles blank headings cleanly without off-by-one index shifts in both pipelines", () => {
    const bundle = createMockBundle([
      { id: "sec-1", markdown: "# \n\n# Heading 1" },
      { id: "sec-2", markdown: "# Heading 2" }
    ]);

    const exportOutput = prepareExport(bundle);
    const exportHtml = stringifyHast(exportOutput.formatted.hast);

    const allHeadings: HeadingNode[] = [];
    const parsedSections = bundle.project.sections.map((sec) => {
      const ast = parseMarkdown(sec.markdown);
      allHeadings.push(...parseHeadings(ast).map(h => ({ ...h, sectionId: sec.id })));
      return { sec, ast };
    });

    const globalNumberedHeadings = numberHeadings(allHeadings);
    const renderState = { index: 0 };
    
    const previewHtmlParts = parsedSections.map((p) => {
      const numberedAst = injectHeadingNumbers(p.ast, globalNumberedHeadings, renderState);
      return renderMdastToHtml(numberedAst);
    });
    const previewHtmlCombined = previewHtmlParts.join("");

    // The first heading is blank, so "Heading 1" should be numbered as "1" and "Heading 2" as "2"
    expect(exportHtml).toContain("1 Heading 1");
    expect(previewHtmlCombined).toContain("1 Heading 1");
    expect(exportHtml).toContain("2 Heading 2");
    expect(previewHtmlCombined).toContain("2 Heading 2");
  });

  it("renders identical Table of Contents structures and link targets in print-preview HTML", () => {
    const bundle = createMockBundle([
      { id: "sec-1", markdown: "# Giới thiệu" }
    ]);

    const exportOutput = prepareExport(bundle);
    const printableHtml = buildPrintableHtml(exportOutput);

    expect(printableHtml).toContain('<div class="ws-toc-container">');
    expect(printableHtml).toContain('<a href="#1-gioi-thieu" class="ws-toc-link">');
    expect(printableHtml).toContain('<span class="ws-toc-number">1</span>');
    expect(printableHtml).toContain('<span class="ws-toc-text">Giới thiệu</span>');
  });
});
