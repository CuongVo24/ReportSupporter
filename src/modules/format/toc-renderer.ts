import type { TocNode } from "@/types";
import { getHeadingAnchorId } from "@/lib/markdown-pipeline";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Renders Table of Contents structure to an identical HTML string
 * for both PreviewPane React injection and Export PDF templates.
 */
export function renderTocToHtml(nodes: TocNode[]): string {
  if (nodes.length === 0) {
    return "";
  }

  function renderNodes(list: TocNode[]): string {
    return `
      <ul class="ws-toc-list">
        ${list
          .map((node) => {
            const level = Number.isFinite(node.level)
              ? Math.min(6, Math.max(1, Math.trunc(node.level)))
              : 1;
            const anchorId = escapeHtml(getHeadingAnchorId(String(node.id)));
            const number = escapeHtml(String(node.number));
            const label = escapeHtml(String(node.text));

            return `
          <li class="ws-toc-item ws-toc-level-${level}">
            <a href="#${anchorId}" class="ws-toc-link">
              <span class="ws-toc-left">
                <span class="ws-toc-number">${number}</span>
                <span class="ws-toc-text">${label}</span>
              </span>
              <span class="ws-toc-leader"></span>
              <span class="ws-toc-page">...</span>
            </a>
            ${node.children && node.children.length > 0 ? renderNodes(node.children) : ""}
          </li>
        `;
          })
          .join("")}
      </ul>
    `;
  }

  return renderNodes(nodes);
}
