import { parseMarkdown } from "@/lib/markdown-pipeline";

/**
 * Adjusts heading levels in a markdown string by a given delta.
 * Clamps heading depth to be between 1 and 6.
 * Traverses the AST to only modify actual headings and avoid changing code block comments.
 * Replaces headings from right to left (descending offset) to prevent shifting subsequent offsets.
 *
 * @param markdown The raw markdown content.
 * @param delta The depth delta to apply (positive or negative).
 */
export function remapMarkdownHeadings(markdown: string, delta: number): string {
  if (delta === 0 || !markdown) return markdown;

  const ast = parseMarkdown(markdown);
  const headings: { start: number; end: number; depth: number }[] = [];

  interface MarkdownNode {
    type: string;
    depth?: number;
    position?: {
      start?: { offset?: number };
      end?: { offset?: number };
    };
    children?: MarkdownNode[];
  }

  function traverse(node: MarkdownNode) {
    if (node.type === "heading" && node.depth !== undefined) {
      if (
        node.position?.start?.offset !== undefined &&
        node.position?.end?.offset !== undefined
      ) {
        headings.push({
          start: node.position.start.offset,
          end: node.position.end.offset,
          depth: node.depth,
        });
      }
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(ast);

  // Sort by start offset descending (right-to-left replacement)
  headings.sort((a, b) => b.start - a.start);

  let result = markdown;
  for (const h of headings) {
    const headingText = result.slice(h.start, h.end);
    const newDepth = Math.min(6, Math.max(1, h.depth + delta));

    // Try matching standard ATX heading style (e.g. "## Heading Content")
    const match = headingText.match(/^(#+)(\s+[\s\S]*)/);
    if (match) {
      const rest = match[2];
      const newHashes = "#".repeat(newDepth);
      const newHeadingText = newHashes + rest;
      result = result.slice(0, h.start) + newHeadingText + result.slice(h.end);
    } else {
      // Fallback for setext headings or non-standard heading formats
      const newHashes = "#".repeat(newDepth);
      const newHeadingText = newHashes + " " + headingText.trim();
      result = result.slice(0, h.start) + newHeadingText + result.slice(h.end);
    }
  }

  return result;
}
