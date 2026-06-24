import type { ExportInput } from "./types";
import type { TocNode } from "@/types";
import { buildCoverPage } from "./build-cover-page";
import { buildPrintCss } from "./print-css";
import { unified } from "unified";
import rehypeStringify from "rehype-stringify";

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
    const renderNodes = (nodes: TocNode[]): string => {
      return `
        <ul class="ws-toc-list">
          ${nodes
            .map(
              (node) => `
            <li class="ws-toc-item ws-toc-level-${node.level}">
              <a href="#${node.id}" class="ws-toc-link">
                <span class="ws-toc-number">${node.number}</span>
                <span class="ws-toc-text">${node.text}</span>
              </a>
              ${node.children && node.children.length > 0 ? renderNodes(node.children) : ""}
            </li>
          `,
            )
            .join("")}
        </ul>
      `;
    };

    tocHtml = `
      <div class="ws-toc-container">
        <div class="ws-toc-title">Mục lục</div>
        ${renderNodes(formatted.toc)}
      </div>
      <div class="page-break"></div>
    `;
  }

  // 3. Stringify HAST to HTML body
  const bodyHtml = unified().use(rehypeStringify).stringify(formatted.hast);

  // 4. Build print CSS stylesheet
  const printCss = buildPrintCss(formatted.preset);

  // 5. Construct the full printable HTML document
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(bundle.project.title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css">
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

  <!-- Mermaid Client-side Renderer -->
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>`.trim();
}
