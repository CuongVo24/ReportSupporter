import type { ExportResult, ReportProjectBundle } from "@/types";
import { slugify } from "@/lib/slugify";
import { renderTocToHtml } from "@/modules/format/toc-renderer";
import { unified } from "unified";
import rehypeStringify from "rehype-stringify";
import { buildCoverPage } from "./build-cover-page";
import { buildPrintCss } from "./print-css";
import { prepareExport } from "./prepare-export";
import { createVerifiedArtifact } from "./artifact-verification";

const KATEX_OFFLINE_CSS = `
@font-face{font-family:KaTeX_Main;src:url(data:font/woff2;base64,d09GMgABAAAAAA) format("woff2");font-weight:400;font-style:normal}
.katex{font:normal 1.21em KaTeX_Main,Times New Roman,serif;line-height:1.2;white-space:nowrap}
.katex-display{display:block;margin:1em 0;text-align:center;overflow-x:auto;overflow-y:hidden}
.katex .base{position:relative;display:inline-block;white-space:nowrap;width:min-content}
.katex .strut{display:inline-block}.katex .mord,.katex .mop,.katex .mbin,.katex .mrel{display:inline-block}
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#039;");
}

function fallbackMermaidSvg(source: string): string {
  const label = escapeHtml(source.split(/\r?\n/u).find((line) => line.trim())?.trim() || "Mermaid diagram");
  return `<figure class="mermaid-container"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 120" role="img" aria-label="Mermaid diagram"><rect width="800" height="120" rx="8" fill="#f8fafc" stroke="#94a3b8"/><text x="24" y="66" font-family="sans-serif" font-size="18" fill="#0f172a">${label}</text></svg></figure>`;
}

async function renderStaticMermaid(bodyHtml: string): Promise<string> {
  if (!bodyHtml.includes("language-mermaid")) return bodyHtml;
  if (typeof document === "undefined") {
    return bodyHtml.replace(
      /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/giu,
      (_match, encoded: string) => fallbackMermaidSvg(encoded.replace(/&lt;/gu, "<").replace(/&gt;/gu, ">").replace(/&amp;/gu, "&")),
    );
  }

  const container = document.createElement("div");
  container.innerHTML = bodyHtml;
  const blocks = Array.from(container.querySelectorAll<HTMLElement>("pre code.language-mermaid"));
  if (blocks.length === 0) return bodyHtml;
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "strict",
    flowchart: { htmlLabels: false },
  });
  for (const [index, block] of blocks.entries()) {
    const source = block.textContent ?? "";
    try {
      const { svg } = await mermaid.render(`export-mermaid-${Date.now()}-${index}`, source);
      const figure = document.createElement("figure");
      figure.className = "mermaid-container";
      figure.innerHTML = svg;
      block.parentElement?.replaceWith(figure);
    } catch {
      block.parentElement?.replaceWith(document.createRange().createContextualFragment(fallbackMermaidSvg(source)));
    }
  }
  return container.innerHTML;
}

/** Create a verified, self-contained, script-free HTML artifact. */
export async function exportHtml(
  bundle: ReportProjectBundle,
  qrDataUrls?: Record<string, string>,
): Promise<ExportResult> {
  try {
    const { cover, formatted } = prepareExport(bundle, qrDataUrls);
    const coverHtml = buildCoverPage(cover);
    const tocHtml = bundle.formatSettings.includeToc && formatted.toc.length > 0
      ? `<div class="ws-toc-container"><div class="ws-toc-title">Mục lục</div>${renderTocToHtml(formatted.toc)}</div><div class="page-break"></div>`
      : "";
    const rawBody = unified().use(rehypeStringify).stringify(formatted.hast).replace(
      /(<img\b[^>]*\bsrc\s*=\s*)["']https?:\/\/[^"']*["']/giu,
      "$1\"\" data-network-resource-blocked=\"true\"",
    );
    const bodyHtml = await renderStaticMermaid(rawBody);
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:;">
  <title>${escapeHtml(bundle.project.title)}</title>
  <style>${KATEX_OFFLINE_CSS}\n${buildPrintCss(formatted.preset)}</style>
</head>
<body>${coverHtml}${tocHtml}<main class="report-body">${bodyHtml}</main></body>
</html>`;
    const artifact = await createVerifiedArtifact({
      target: "html",
      blob: new Blob([html], { type: "text/html;charset=utf-8" }),
      fileName: `${slugify(bundle.project.title) || "report"}.html`,
    });
    return { ok: true, artifact, blob: artifact.blob };
  } catch (error: unknown) {
    return {
      ok: false,
      error: {
        stage: "render-html",
        message: error instanceof Error ? error.message : "Failed to render HTML report.",
        recoverable: true,
      },
    };
  }
}
