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
  const firstH1AvoidBreak = preset.chapterStartsNewPage ? "\n  .report-body > h1:first-of-type { page-break-before: avoid !important; break-before: avoid !important; }" : "";
  const fontFamily = `"${preset.fontFamily || "Times New Roman"}", Times, serif`;

  const levelStyles = Array.from({ length: 6 }, (_, idx) => {
    const level = idx + 1;
    const padding = (level - 1) * 20; // 20px per level indent
    return `.ws-toc-level-${level} { padding-left: ${padding}px !important; }`;
  }).join("\n  ");

  return `
@media print {
  @page {
    size: ${preset.page || "A4"};
    margin: 0;
  }
  body { font-family: ${fontFamily}; font-size: ${fontPt}pt; line-height: ${lh}; color: #000; background: #fff; margin: 0; padding: 0; }
  .print-page-wrapper {
    padding: ${top} ${right} ${bottom} ${left};
    box-sizing: border-box;
  }
  p, li { text-align: ${align}; orphans: 3; widows: 3; }
  li { page-break-inside: avoid; break-inside: avoid; }
  h1, h2, h3, h4, h5, h6 { font-family: ${fontFamily}; color: #000; page-break-after: avoid !important; break-after: avoid !important; }
  h1 { font-size: 18pt; text-align: center; margin-top: 0; margin-bottom: 20pt; ${breakPageBeforeH1} }${firstH1AvoidBreak}
  h2 { font-size: 14pt; margin-top: 24pt; margin-bottom: 12pt; }
  h3 { font-size: 13pt; margin-top: 18pt; margin-bottom: 6pt; }
  .cover-page {
    page-break-before: avoid; break-before: avoid; page-break-after: always; break-after: page;
    box-sizing: border-box; display: flex; flex-direction: column;
    align-items: center; text-align: center; min-height: 297mm; padding: ${top} ${right} ${bottom} ${left};
  }
  .page-break { page-break-before: always; break-before: page; }
  figure, img, table { page-break-inside: avoid; break-inside: avoid; }
  .ws-toc-container { page-break-inside: auto; break-inside: auto; }
  .ws-toc-item { page-break-inside: avoid; break-inside: avoid; }
  .fig-caption, .tbl-caption { page-break-inside: avoid; break-inside: avoid; }
  .fig-caption { page-break-before: avoid; break-before: avoid; }
  .tbl-caption { page-break-after: avoid; break-after: avoid; }
  table { width: 100%; border-collapse: collapse; margin: 15pt 0; }
  table, th, td { border: 1px solid #000; }
  th, td { padding: 8pt; text-align: left; }
  img[alt^="QR:"] { width: 80pt; height: 80pt; vertical-align: middle; }
}
@media screen {
  body { font-family: ${fontFamily}; font-size: 14px; line-height: ${lh}; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #f4f4f4; color: #333; }
  .cover-page, .ws-toc-container, .ws-preview-html-section, section { background: #fff; padding: 40px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .page-break { border-top: 1px dashed #ccc; margin: 40px 0; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  table, th, td { border: 1px solid #ddd; }
  th, td { padding: 8px; text-align: left; }
  th { background: #f9f9f9; }
  img[alt^="QR:"] { width: 100px; height: 100px; vertical-align: middle; }
}
/* Common cover page styling */
.cover-page { text-align: center; font-family: ${fontFamily}; }
.cover-school { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-bottom: 5pt; }
.cover-divider { width: 150px; height: 2px; background: #000; margin: 5pt auto 20pt; }
.cover-title-container { margin: auto 0; }
.cover-title { font-size: 24pt; font-weight: bold; text-transform: uppercase; line-height: 1.3; margin: 0; }
.cover-course { font-size: 14pt; font-weight: bold; margin-top: 10pt; margin-bottom: auto; }
.cover-info { margin-top: auto; margin-bottom: auto; max-width: 400px; text-align: left; font-size: 13pt; line-height: 1.6; }
.cover-members-list { margin: 5px 0 0 20px; padding: 0; }
.cover-date { margin-top: auto; font-size: 13pt; }
/* Table of Contents styling */
.ws-toc-container { font-family: ${fontFamily}; }
.ws-toc-title { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
.ws-toc-list { list-style: none; padding: 0; margin: 0; }
.ws-toc-item { margin-bottom: 8px; }
.ws-toc-link { display: flex; align-items: flex-end; text-decoration: none; color: #000; width: 100%; }
.ws-toc-link:hover { text-decoration: underline; }
.ws-toc-left { display: flex; gap: 5pt; flex-shrink: 0; max-width: 85%; }
.ws-toc-number { font-weight: bold; }
.ws-toc-text { }
.ws-toc-leader { flex-grow: 1; border-bottom: 1px dotted #000; margin: 0 5pt 3pt; min-width: 15px; }
.ws-toc-page { flex-shrink: 0; min-width: 25px; text-align: right; }
${levelStyles}
  `.trim();
}
