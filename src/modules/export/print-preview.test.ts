import { describe, it, expect } from "vitest";
import { buildPrintableHtml } from "./print-preview";
import { prepareExport } from "./prepare-export";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";
import type { ReportProjectBundle } from "@/types";

describe("buildPrintableHtml", () => {
  const baseBundle = createProjectFromTemplate(softwareProjectTemplate);

  it("should assemble a complete print-ready HTML page", () => {
    const input = prepareExport(baseBundle);
    const html = buildPrintableHtml(input);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="vi">');
    
    // Should contain cover page
    expect(html).toContain("cover-page");
    expect(html).toContain(baseBundle.project.title);

    // Should contain KaTeX and Mermaid scripts
    expect(html).toContain("katex@0.17.0/dist/katex.min.css");
    expect(html).toContain("mermaid@11.15.0");

    // Should contain print CSS
    expect(html).toContain("@media print");
    expect(html).toContain("Times New Roman");

    // Should contain body content
    expect(html).toContain("report-body");
    expect(html).toContain("Mở đầu");
  });

  it("should include Table of Contents when includeToc is true", () => {
    const tocBundle: ReportProjectBundle = {
      ...baseBundle,
      formatSettings: {
        ...baseBundle.formatSettings,
        includeToc: true,
      },
    };
    const input = prepareExport(tocBundle);
    const html = buildPrintableHtml(input);

    expect(html).toContain("ws-toc-container");
    expect(html).toContain("ws-toc-title");
    expect(html).toContain("Mục lục");
    expect(html).toContain("ws-toc-list");
  });

  it("should omit Table of Contents when includeToc is false", () => {
    const noTocBundle: ReportProjectBundle = {
      ...baseBundle,
      formatSettings: {
        ...baseBundle.formatSettings,
        includeToc: false,
      },
    };
    const input = prepareExport(noTocBundle);
    const html = buildPrintableHtml(input);

    expect(html).not.toContain('<div class="ws-toc-container">');
    expect(html).not.toContain("Mục lục");
  });
});
