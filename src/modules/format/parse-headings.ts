import type { Root as MdastRoot, Heading as MdastHeading, PhrasingContent } from "mdast";
import { stripHeadingNumberPrefix } from "./strip-heading-number";

export type HeadingNode = { depth: number; text: string; sectionId?: string };

// Recursive helper to extract plain text from phrasing content inside headings (handles strong, emphasis, link, etc.)
function getHeadingText(nodes: PhrasingContent[]): string {
  let text = "";
  for (const node of nodes) {
    // Raw HTML nodes can occur in a parsed Markdown heading. Only consume node
    // kinds whose value is display text so markup never reaches the TOC.
    if ((node.type === "text" || node.type === "inlineCode") && "value" in node && typeof node.value === "string") {
      text += node.value;
    } else if (node.type === "image" && typeof node.alt === "string") {
      text += node.alt;
    } else if ("children" in node && Array.isArray(node.children)) {
      text += getHeadingText(node.children as PhrasingContent[]);
    }
  }
  return text;
}

interface UnistNode {
  type: string;
  children?: UnistNode[];
}

/**
 * Traverses the mdast AST to collect all headings in document order, extracting flat text.
 */
export function parseHeadings(ast: MdastRoot, sectionId?: string): HeadingNode[] {
  const headings: HeadingNode[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") {
      return;
    }
    const n = node as UnistNode;

    if (n.type === "heading") {
      const heading = n as unknown as MdastHeading;
      const rawText = getHeadingText(heading.children).trim();
      const text = stripHeadingNumberPrefix(rawText);
      headings.push({
        depth: heading.depth, // 1..6
        text,
        sectionId,
      });
    }

    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) {
        walk(child);
      }
    }
  }

  walk(ast);
  return headings;
}
