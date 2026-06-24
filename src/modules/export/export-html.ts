import type { ReportProjectBundle, ExportResult, TocNode } from "@/types";
import { prepareExport } from "./prepare-export";
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
 * Exports the project bundle to a self-contained HTML Blob.
 * Integrates the cover page, Table of Contents, print stylesheet, inlined images,
 * and client-side Mermaid rendering scripts.
 */
export function exportHtml(bundle: ReportProjectBundle, qrDataUrls?: Record<string, string>): ExportResult {
  try {
    // 1. Run pipeline
    const { cover, formatted } = prepareExport(bundle, qrDataUrls);

    // 2. Build cover page
    const coverHtml = buildCoverPage(cover);

    // 3. Build TOC block
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

    // 4. Stringify HAST to HTML body
    const bodyHtml = unified().use(rehypeStringify).stringify(formatted.hast);

    // 5. Build full HTML document
    const printCss = buildPrintCss(formatted.preset);
    const htmlContent = `<!DOCTYPE html>
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
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    return { ok: true, blob };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to render HTML report.";
    return {
      ok: false,
      error: {
        stage: "render-html",
        message,
        recoverable: true,
      },
    };
  }
}
