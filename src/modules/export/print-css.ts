import type { FormatPreset } from "@/types";

/**
 * Builds A4 print CSS style sheet rules mapped dynamically from a FormatPreset.
 * Adheres to Times New Roman 13/14pt, line-height 1.5, margins, and page breaks.
 */
export function buildPrintCss(preset: FormatPreset): string {
  const fontPt = preset.fontSizePt || 13;
  const lh = preset.lineHeight || 1.5;
  const align = preset.bodyAlign || "justify";
  const { top, right, bottom, left } = preset.margin || { top: "20mm", right: "20mm", bottom: "20mm", left: "30mm" };
  const breakPageBeforeH1 = preset.chapterStartsNewPage ? "page-break-before: always; break-before: page;" : "";
  const fontFamily = `"${preset.fontFamily || "Times New Roman"}", Times, serif`;

  return `
@media print {
  @page { size: ${preset.page || "A4"}; margin: ${top} ${right} ${bottom} ${left}; }
  body { font-family: ${fontFamily}; font-size: ${fontPt}pt; line-height: ${lh}; color: #000; background: #fff; margin: 0; padding: 0; }
  p, li { text-align: ${align}; }
  h1, h2, h3, h4, h5, h6 { font-family: ${fontFamily}; color: #000; page-break-after: avoid; break-after: avoid; }
  h1 { font-size: 18pt; text-align: center; margin-top: 0; margin-bottom: 20pt; ${breakPageBeforeH1} }
  h2 { font-size: 14pt; margin-top: 24pt; margin-bottom: 12pt; }
  h3 { font-size: 13pt; margin-top: 18pt; margin-bottom: 6pt; }
  .cover-page {
    page-break-before: avoid; break-before: avoid; page-break-after: always; break-after: page;
    height: 90vh; box-sizing: border-box; display: flex; flex-direction: column;
    justify-content: space-between; align-items: center; text-align: center; padding: 20mm 0;
  }
  .page-break { page-break-before: always; break-before: page; }
  figure, img, table, .ws-toc-container { page-break-inside: avoid; break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; margin: 15pt 0; }
  table, th, td { border: 1px solid #000; }
  th, td { padding: 6pt; text-align: left; }
}
@media screen {
  body { font-family: ${fontFamily}; font-size: 14px; line-height: ${lh}; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #f4f4f4; color: #333; }
  .cover-page, .ws-toc-container, .ws-preview-html-section, section { background: #fff; padding: 40px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .page-break { border-top: 1px dashed #ccc; margin: 40px 0; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  table, th, td { border: 1px solid #ddd; }
  th, td { padding: 8px; text-align: left; }
  th { background: #f9f9f9; }
}
/* Common cover page styling */
.cover-page { text-align: center; font-family: ${fontFamily}; }
.cover-school { font-size: 16pt; font-weight: bold; text-transform: uppercase; }
.cover-divider { width: 150px; height: 2px; background: #000; margin: 10px auto 40px; }
.cover-title-container { margin: 80px 0; }
.cover-title { font-size: 24pt; font-weight: bold; text-transform: uppercase; line-height: 1.3; }
.cover-course { font-size: 14pt; font-weight: bold; margin-bottom: 40px; }
.cover-info { margin: 60px auto; max-width: 400px; text-align: left; font-size: 13pt; line-height: 1.6; }
.cover-members-list { margin: 5px 0 0 20px; padding: 0; }
.cover-date { margin-top: auto; font-size: 13pt; }
/* Table of Contents styling */
.ws-toc-container { font-family: ${fontFamily}; }
.ws-toc-title { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
.ws-toc-list { list-style: none; padding: 0; margin: 0; }
.ws-toc-item { margin-bottom: 8px; }
.ws-toc-link { display: flex; justify-content: space-between; text-decoration: none; color: #000; }
.ws-toc-link:hover { text-decoration: underline; }
.ws-toc-level-2 { padding-left: 20px; }
.ws-toc-level-3 { padding-left: 40px; }
  `.trim();
}
