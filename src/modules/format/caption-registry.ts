import type { Root as MdastRoot, Content as MdastContent, Heading as MdastHeading, Image as MdastImage } from "mdast";
import type { CaptionEntry } from "@/types";
import { flattenNodeText } from "@/lib/markdown-pipeline";

/**
 * Detects the base chapter depth (the shallowest level, H1 or H2) in the document.
 * Excludes single H1 title headings at the very beginning of the document.
 */
export function detectChapterDepth(sections: { ast: MdastRoot }[]): number {
  const headings: { depth: number; text: string }[] = [];

  function walk(node: MdastContent | MdastRoot) {
    if (!node) return;
    if (node.type === "heading") {
      const headingNode = node as MdastHeading;
      const text = flattenNodeText(headingNode).trim();
      if (text) {
        headings.push({ depth: headingNode.depth, text });
      }
    }
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((child) => walk(child as MdastContent));
    }
  }

  sections.forEach((s) => walk(s.ast));

  if (headings.length === 0) return 1;

  const depths = headings.map((h) => h.depth);
  const minDepth = Math.min(...depths);

  // Mitigation: if minDepth is 1, check if there is exactly 1 H1 heading at the start
  if (minDepth === 1) {
    const h1Count = headings.filter((h) => h.depth === 1).length;
    const firstHeadingIsH1 = headings[0]?.depth === 1;

    if (h1Count === 1 && firstHeadingIsH1 && headings.length > 1) {
      const h2Headings = headings.filter((h) => h.depth === 2);
      
      let hasH2WithSingleNumber = false;
      let hasH2WithSubNumber = false;
      
      for (const h2 of h2Headings) {
        const match = h2.text.match(/^\s*(\d+(?:\.\d+)*)\s*[.)-]?\s+/);
        if (match) {
          const numStr = match[1];
          if (numStr.includes(".")) {
            hasH2WithSubNumber = true;
          } else {
            hasH2WithSingleNumber = true;
          }
        }
      }

      const h1Text = headings[0].text;
      const h1HasNumber = /^\s*(?:chương\s+\d+|\d+)/i.test(h1Text);

      if (h1HasNumber) {
        return 1;
      }

      if (hasH2WithSingleNumber && !hasH2WithSubNumber) {
        const otherDepths = headings.filter((h) => h.depth > 1).map((h) => h.depth);
        if (otherDepths.length > 0) {
          return Math.min(...otherDepths);
        }
      }

      // Length heuristic: if H1 is long (>= 6 words or > 25 chars) and H2 is not clearly a sub-number
      const h1WordCount = h1Text.split(/\s+/).filter(Boolean).length;
      const isH1Long = h1WordCount >= 6 || h1Text.length > 25;

      if (isH1Long && !hasH2WithSubNumber) {
        const otherDepths = headings.filter((h) => h.depth > 1).map((h) => h.depth);
        if (otherDepths.length > 0) {
          return Math.min(...otherDepths);
        }
      }
      
      return 1;
    }
  }

  return minDepth;
}

/**
 * Extracts author-defined N.N numbers from text.
 */
export function extractCaptionAuthorNumber(
  text: string,
  prefixKeyword: string
): { chapter: number; count: number } | null {
  const regex = new RegExp(`^\\s*(?:${prefixKeyword})\\s*(\\d+)\\.(\\d+)\\s*[:.-]?\\s*`, "i");
  const match = text.match(regex);
  if (match) {
    return {
      chapter: parseInt(match[1], 10),
      count: parseInt(match[2], 10),
    };
  }
  return null;
}

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
  settings: { captionNumbering: "continuous" | "per-chapter"; respectAuthorNumbering?: boolean }
): CaptionEntry[] {
  const registry: CaptionEntry[] = [];
  const captionNumbering = settings.captionNumbering;
  const respectAuthorNumbering = settings.respectAuthorNumbering ?? false;

  const chapterDepth = detectChapterDepth(sections);

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
      if (heading.depth === chapterDepth) {
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

      let rawCaptionText = "";

      // 1. Dò inline sibling trong cùng paragraph (parent của image)
      if (parent && parent.type === "paragraph" && "children" in parent && Array.isArray(parent.children)) {
        const adjacentIndices = [index - 1, index + 1];
        for (const idx of adjacentIndices) {
          if (idx >= 0 && idx < parent.children.length) {
            const adj = parent.children[idx];
            if (adj && adj.type === "text" && "value" in adj && typeof adj.value === "string") {
              const text = adj.value.trim();
              if (/^(hình|figure)/i.test(text)) {
                rawCaptionText = text;
                break;
              }
            }
          }
        }
      }

      // 2. Dò block-level paragraph lân cận của paragraph chứa image (parent)
      if (!rawCaptionText && grandParent && "children" in grandParent && Array.isArray(grandParent.children)) {
        const adjacentIndices = [parentIndex - 1, parentIndex + 1];
        for (const idx of adjacentIndices) {
          if (idx >= 0 && idx < grandParent.children.length) {
            const adj = grandParent.children[idx];
            if (adj && adj.type === "paragraph") {
              const text = flattenNodeText(adj).trim();
              if (/^(hình|figure)/i.test(text)) {
                rawCaptionText = text;
                break;
              }
            }
          }
        }
      }

      // 3. Fallback to img.alt
      if (!rawCaptionText && img.alt) {
        rawCaptionText = img.alt;
      }

      let parsedAuthorNumStr: string | undefined;
      if (rawCaptionText) {
        const match = rawCaptionText.match(/^(?:hình|figure)\s*(\d+(?:\.\d+)*)/i);
        if (match) {
          parsedAuthorNumStr = match[1];
        }
      }

      if (respectAuthorNumbering && rawCaptionText) {
        const authorNum = extractCaptionAuthorNumber(rawCaptionText, "hình|figure");
        if (authorNum) {
          chapterNum = authorNum.chapter;
          figChapterCount = authorNum.count;
        }
      }

      // Clean the caption text from existing numbering prefix
      const captionText = rawCaptionText
        ? rawCaptionText.replace(/^(hình|figure)\s*\d+(\.\d+)*\s*[:.-]?\s*/i, "")
        : "";

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
        authorNumber: parsedAuthorNumStr,
      });
    }

    if (node.type === "table") {
      tableChapterCount++;
      tableGlobalCount++;

      let rawCaptionText = "";
      if (parent && "children" in parent && Array.isArray(parent.children)) {
        const adjacentIndices = [index - 1, index + 1];
        for (const idx of adjacentIndices) {
          if (idx >= 0 && idx < parent.children.length) {
            const adj = parent.children[idx];
            if (adj && adj.type === "paragraph") {
              const text = flattenNodeText(adj).trim();
              if (/^(bảng|table)/i.test(text)) {
                rawCaptionText = text;
                break;
              }
            }
          }
        }
      }

      let parsedAuthorNumStr: string | undefined;
      if (rawCaptionText) {
        const match = rawCaptionText.match(/^(?:bảng|table)\s*(\d+(?:\.\d+)*)/i);
        if (match) {
          parsedAuthorNumStr = match[1];
        }
      }

      if (respectAuthorNumbering && rawCaptionText) {
        const authorNum = extractCaptionAuthorNumber(rawCaptionText, "bảng|table");
        if (authorNum) {
          chapterNum = authorNum.chapter;
          tableChapterCount = authorNum.count;
        }
      }

      const captionText = rawCaptionText
        ? rawCaptionText.replace(/^(bảng|table)\s*\d+(\.\d+)*\s*[:.-]?\s*/i, "")
        : "";

      const num = captionNumbering === "per-chapter" ? tableChapterCount : tableGlobalCount;
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
        authorNumber: parsedAuthorNumStr,
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
