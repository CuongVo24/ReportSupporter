import type { Root as MdastRoot, Content as MdastContent, Heading as MdastHeading, Image as MdastImage } from "mdast";
import type { CaptionEntry } from "@/types";
import { flattenNodeText } from "@/lib/markdown-pipeline";

/**
 * Builds a single, unified registry of figure and table captions from report section ASTs.
 * This registry acts as the single source of truth for body captions, lists of figures/tables,
 * and cross-references.
 * 
 * @param sections List of sections with their parsed ASTs, sorted in document order.
 * @param settings Format settings defining the numbering style (continuous vs per-chapter).
 */
export function buildCaptionRegistry(
  sections: { id: string; ast: MdastRoot }[],
  settings: { captionNumbering: "continuous" | "per-chapter" }
): CaptionEntry[] {
  const registry: CaptionEntry[] = [];
  const captionNumbering = settings.captionNumbering;

  let chapterNum = 0;
  let figChapterCount = 0;
  let figGlobalCount = 0;
  let tableChapterCount = 0;
  let tableGlobalCount = 0;

  // DFS walk through AST nodes
  function walk(
    node: MdastContent | MdastRoot,
    parent: (MdastContent | MdastRoot) | null,
    grandParent: (MdastContent | MdastRoot) | null,
    index: number,
    parentIndex: number,
    sectionId: string
  ) {
    if (!node) return;

    if (node.type === "heading") {
      const heading = node as MdastHeading;
      if (heading.depth === 1) {
        const text = flattenNodeText(heading).trim();
        if (text) {
          chapterNum++;
          figChapterCount = 0;
          tableChapterCount = 0;
        }
      }
    }

    if (node.type === "image") {
      const img = node as MdastImage;
      figChapterCount++;
      figGlobalCount++;

      let captionText = "";

      // 1. Dò inline sibling trong cùng paragraph (parent của image)
      if (parent && parent.type === "paragraph" && "children" in parent && Array.isArray(parent.children)) {
        const adjacentIndices = [index - 1, index + 1];
        for (const idx of adjacentIndices) {
          if (idx >= 0 && idx < parent.children.length) {
            const adj = parent.children[idx];
            if (adj && adj.type === "text" && "value" in adj && typeof adj.value === "string") {
              const text = adj.value.trim();
              if (/^(hình|figure)/i.test(text)) {
                // Strip the starting prefix e.g. "Hình 1.2:" or "Figure 2 -"
                captionText = text.replace(/^(hình|figure)\s*\d+(\.\d+)*\s*[:.-]?\s*/i, "");
                break;
              }
            }
          }
        }
      }

      // 2. Dò block-level paragraph lân cận của paragraph chứa image (parent)
      if (!captionText && grandParent && "children" in grandParent && Array.isArray(grandParent.children)) {
        const adjacentIndices = [parentIndex - 1, parentIndex + 1];
        for (const idx of adjacentIndices) {
          if (idx >= 0 && idx < grandParent.children.length) {
            const adj = grandParent.children[idx];
            if (adj && adj.type === "paragraph") {
              const text = flattenNodeText(adj).trim();
              if (/^(hình|figure)/i.test(text)) {
                // Strip the starting prefix e.g. "Hình 1.2:" or "Figure 2 -"
                captionText = text.replace(/^(hình|figure)\s*\d+(\.\d+)*\s*[:.-]?\s*/i, "");
                break;
              }
            }
          }
        }
      }

      // 3. Fallback to img.alt
      if (!captionText && img.alt) {
        captionText = img.alt.replace(/^(hình|figure)\s*\d+(\.\d+)*\s*[:.-]?\s*/i, "");
      }

      const num = captionNumbering === "per-chapter" ? figChapterCount : figGlobalCount;
      const label = captionNumbering === "per-chapter"
        ? `Hình ${Math.max(chapterNum, 1)}.${figChapterCount}`
        : `Hình ${figGlobalCount}`;

      registry.push({
        id: `fig-${figGlobalCount}`,
        kind: "figure",
        number: num,
        label,
        text: captionText,
        sectionId,
      });
    }

    if (node.type === "table") {
      tableChapterCount++;
      tableGlobalCount++;
      const num = captionNumbering === "per-chapter" ? tableChapterCount : tableGlobalCount;

      let captionText = "";
      if (parent && "children" in parent && Array.isArray(parent.children)) {
        const adjacentIndices = [index - 1, index + 1];
        for (const idx of adjacentIndices) {
          if (idx >= 0 && idx < parent.children.length) {
            const adj = parent.children[idx];
            if (adj && adj.type === "paragraph") {
              const text = flattenNodeText(adj).trim();
              if (/^(bảng|table)/i.test(text)) {
                // Strip the starting prefix e.g. "Bảng 1.1:" or "Table 2 -"
                captionText = text.replace(/^(bảng|table)\s*\d+(\.\d+)*\s*[:.-]?\s*/i, "");
                break;
              }
            }
          }
        }
      }

      const label = captionNumbering === "per-chapter"
        ? `Bảng ${Math.max(chapterNum, 1)}.${tableChapterCount}`
        : `Bảng ${tableGlobalCount}`;

      registry.push({
        id: `table-${tableGlobalCount}`,
        kind: "table",
        number: num,
        label,
        text: captionText,
        sectionId,
      });
    }

    // Traverse children nodes in document order
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((child, idx) => {
        walk(child as MdastContent, node, parent, idx, index, sectionId);
      });
    }
  }

  for (const sec of sections) {
    walk(sec.ast, null, null, 0, 0, sec.id);
  }

  return registry;
}
