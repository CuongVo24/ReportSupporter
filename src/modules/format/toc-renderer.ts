import type { TocNode } from "@/types";

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
          .map(
            (node) => `
          <li class="ws-toc-item ws-toc-level-${node.level}">
            <a href="#${node.id}" class="ws-toc-link">
              <span class="ws-toc-left">
                <span class="ws-toc-number">${node.number}</span>
                <span class="ws-toc-text">${node.text}</span>
              </span>
              <span class="ws-toc-leader"></span>
              <span class="ws-toc-page">...</span>
            </a>
            ${node.children && node.children.length > 0 ? renderNodes(node.children) : ""}
          </li>
        `,
          )
          .join("")}
      </ul>
    `;
  }

  return renderNodes(nodes);
}
