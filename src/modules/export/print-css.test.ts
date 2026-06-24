import { describe, it, expect } from "vitest";
import { buildPrintCss } from "./print-css";
import type { FormatPreset } from "@/types";

describe("buildPrintCss", () => {
  const basePreset: FormatPreset = {
    id: "academic-default",
    page: "A4",
    margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "30mm" },
    fontFamily: "Times New Roman",
    fontSizePt: 13,
    lineHeight: 1.5,
    bodyAlign: "justify",
    chapterStartsNewPage: true,
    captionNumbering: "continuous",
  };

  it("should output standard media print styles", () => {
    const css = buildPrintCss(basePreset);
    expect(css).toContain("@media print");
    expect(css).toContain("@media screen");
  });

  it("should set page breaks before H1 only when chapterStartsNewPage is true", () => {
    const cssWithBreak = buildPrintCss({
      ...basePreset,
      chapterStartsNewPage: true,
    });
    expect(cssWithBreak).toContain("h1 { font-size: 18pt; text-align: center; margin-top: 0; margin-bottom: 20pt; page-break-before: always; break-before: page; }");
    expect(cssWithBreak).toContain(".report-body > h1:first-of-type { page-break-before: avoid !important; break-before: avoid !important; }");

    const cssWithoutBreak = buildPrintCss({
      ...basePreset,
      chapterStartsNewPage: false,
    });
    expect(cssWithoutBreak).toContain("h1 { font-size: 18pt; text-align: center; margin-top: 0; margin-bottom: 20pt;  }");
    expect(cssWithoutBreak).not.toContain(".report-body > h1:first-of-type { page-break-before: avoid !important; break-before: avoid !important; }");
  });

  it("should implement widow/orphan control for paragraphs and lists", () => {
    const css = buildPrintCss(basePreset);
    expect(css).toContain("orphans: 3; widows: 3;");
    expect(css).toContain("li { page-break-inside: avoid; break-inside: avoid; }");
  });

  it("should keep captions with figures and tables", () => {
    const css = buildPrintCss(basePreset);
    expect(css).toContain(".fig-caption, .tbl-caption { page-break-inside: avoid; break-inside: avoid; }");
    expect(css).toContain(".fig-caption { page-break-before: avoid; break-before: avoid; }");
    expect(css).toContain(".tbl-caption { page-break-after: avoid; break-after: avoid; }");
  });

  it("should generate running header and footer @page content when provided", () => {
    const cssWithHeaderFooter = buildPrintCss({
      ...basePreset,
      header: "Báo cáo khóa luận",
      footer: "Đại học Bách Khoa",
    });

    expect(cssWithHeaderFooter).toContain('@top-center { content: "Báo cáo khóa luận"');
    expect(cssWithHeaderFooter).toContain('@bottom-center { content: "Đại học Bách Khoa"');
    expect(cssWithHeaderFooter).toContain("@page :first {");
    expect(cssWithHeaderFooter).toContain("content: none !important;");
  });
});
