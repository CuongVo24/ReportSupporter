import { parseMarkdown, flattenNodeText } from "@/lib/markdown-pipeline";
import type { ReportSection } from "@/types";

/**
 * Parses Markdown README text and maps its headings of depth 1 or 2
 * to structured ReportSections in a pure and deterministic way.
 */
export function importReadme(markdown: string): ReportSection[] {
  if (!markdown || markdown.trim() === "") {
    return [];
  }

  const ast = parseMarkdown(markdown);
  const children = ast.children || [];

  // Find all top-level headings of depth 1 or 2
  const headingIndices: number[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === "heading" && (child.depth === 1 || child.depth === 2)) {
      headingIndices.push(i);
    }
  }

  const sections: ReportSection[] = [];
  let order = 0;

  // 1. Process leading content before the first heading of depth 1 or 2
  if (headingIndices.length > 0 && headingIndices[0] > 0) {
    const firstHeadingNode = children[headingIndices[0]];
    const startOffset = children[0]?.position?.start?.offset ?? 0;
    const endOffset = firstHeadingNode?.position?.start?.offset ?? 0;
    const leadingContent = markdown.slice(startOffset, endOffset).trim();
    if (leadingContent) {
      sections.push({
        id: `import-sec-${order}`,
        title: "Mở đầu",
        markdown: leadingContent + "\n",
        order: order++,
        status: "draft",
      });
    }
  } else if (headingIndices.length === 0) {
    // If no headings of depth 1 or 2 are found, put everything in a single "Mở đầu" section
    const trimmed = markdown.trim();
    if (trimmed) {
      sections.push({
        id: `import-sec-${order}`,
        title: "Mở đầu",
        markdown: trimmed + "\n",
        order: order++,
        status: "draft",
      });
    }
    return sections;
  }

  // 2. Process sections based on headings
  for (let i = 0; i < headingIndices.length; i++) {
    const hIdx = headingIndices[i];
    const headingNode = children[hIdx];
    const title = flattenNodeText(headingNode as { value?: string; children?: unknown[] }).trim() || `Mục ${order + 1}`;

    const startOffset = headingNode.position?.start?.offset ?? 0;
    let endOffset = markdown.length;
    if (i < headingIndices.length - 1) {
      const nextHeadingNode = children[headingIndices[i + 1]];
      endOffset = nextHeadingNode.position?.start?.offset ?? markdown.length;
    }

    const content = markdown.slice(startOffset, endOffset).trim();

    sections.push({
      id: `import-sec-${order}`,
      title,
      markdown: content + "\n",
      order: order++,
      status: "draft",
    });
  }

  return sections;
}
