import type { Root as MdastRoot, Heading as MdastHeading, PhrasingContent } from "mdast";

export type HeadingNode = { depth: number; text: string; sectionId?: string };

// Recursive helper to extract plain text from phrasing content inside headings (handles strong, emphasis, link, etc.)
function getHeadingText(nodes: PhrasingContent[]): string {
  let text = "";
  for (const node of nodes) {
    if ("value" in node && typeof node.value === "string") {
      text += node.value;
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
export function parseHeadings(ast: MdastRoot): HeadingNode[] {
  const headings: HeadingNode[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") {
      return;
    }
    const n = node as UnistNode;

    if (n.type === "heading") {
      const heading = n as unknown as MdastHeading;
      const text = getHeadingText(heading.children).trim();
      headings.push({
        depth: heading.depth, // 1..6
        text,
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
