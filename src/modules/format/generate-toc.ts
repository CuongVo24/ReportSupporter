import type { TocNode } from "@/types";
import type { NumberedHeading } from "./number-headings";

/**
 * Turns a list of numbered headings into a hierarchical table of contents tree (depth <= maxDepth).
 * Disambiguates duplicate slugs by appending sequential numbers (e.g., "-2", "-3").
 */
export function generateToc(headings: NumberedHeading[], maxDepth = 3): TocNode[] {
  const filtered = headings.filter((h) => h.depth <= maxDepth);
  const result: TocNode[] = [];
  const idCounts = new Map<string, number>();

  // Helper to ensure all IDs in the TOC tree are unique
  function getUniqueId(baseId: string): string {
    if (!idCounts.has(baseId)) {
      idCounts.set(baseId, 1);
      return baseId;
    }
    const count = idCounts.get(baseId)! + 1;
    idCounts.set(baseId, count);
    return `${baseId}-${count}`;
  }

  type StackEntry = {
    node: TocNode;
    level: number;
  };
  const stack: StackEntry[] = [];

  for (const heading of filtered) {
    const uniqueId = getUniqueId(heading.id);
    const node: TocNode = {
      id: uniqueId,
      number: heading.number,
      text: heading.text,
      level: heading.depth,
      sectionId: heading.sectionId || "",
      children: [],
    };

    // Pop the stack until we find a node with a lower depth (which is the parent)
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, level: heading.depth });
  }

  return result;
}
