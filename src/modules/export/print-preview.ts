import type { ExportInput } from "./types";
import { buildCoverPage } from "./build-cover-page";
import { buildPrintCss } from "./print-css";
import { stringifyHast } from "@/lib/markdown-pipeline";
import { renderTocToHtml } from "@/modules/format";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Assembles the print-ready HTML surface (cover + TOC + content + print CSS).
 * Note: Headers, footers, and page numbers are browser best-effort and
 * explicitly not parity-guaranteed at MVP stage.
 */
export function buildPrintableHtml(input: ExportInput): string {
  const { bundle, cover, formatted } = input;

  // 1. Build cover page HTML
  const coverHtml = buildCoverPage(cover);

  // 2. Build TOC block if configured
  let tocHtml = "";
  if (bundle.formatSettings.includeToc && formatted.toc.length > 0) {
    tocHtml = `
      <div class="ws-toc-container">
        <div class="ws-toc-title">Mục lục</div>
        ${renderTocToHtml(formatted.toc)}
      </div>
      <div class="page-break"></div>
    `;
  }

  // 3. Stringify HAST to HTML body
  const bodyHtml = stringifyHast(formatted.hast);

  // 4. Build print CSS stylesheet
  const printCss = buildPrintCss(formatted.preset);

  // 5. Construct the full printable HTML document
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(bundle.project.title)}</title>
  <style>
    ${printCss}
  </style>
</head>
<body>
  ${coverHtml}
  ${tocHtml}
  <div class="report-body">
    ${bodyHtml}
  </div>
</body>
</html>`.trim();
}
