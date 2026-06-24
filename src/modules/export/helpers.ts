import type { FormatPreset } from "@/types";
import type { Root as MdastRoot, Heading as MdastHeading, PhrasingContent } from "mdast";

interface UnistNode {
  type: string;
  children?: UnistNode[];
}

export function getFlatText(nodes: PhrasingContent[]): string {
  let text = "";
  for (const node of nodes) {
    if ("value" in node && typeof node.value === "string") {
      text += node.value;
    } else if ("children" in node && Array.isArray(node.children)) {
      text += getFlatText(node.children as PhrasingContent[]);
    }
  }
  return text;
}

export function injectHeadingNumbers(
  ast: MdastRoot,
  globalNumberedHeadings: { number: string; text: string; id: string }[],
  state: { index: number }
): MdastRoot {
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as UnistNode;
    if (n.type === "heading") {
      const heading = n as unknown as MdastHeading;
      const numHeading = globalNumberedHeadings[state.index++];
      if (numHeading?.text) {
        heading.children.unshift({ type: "text", value: `${numHeading.number} ` });
        heading.data = {
          ...heading.data,
          hProperties: { ...(heading.data?.hProperties || {}), id: numHeading.id },
        };
      }
    }
    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) walk(child);
    }
  }
  walk(ast);
  return ast;
}

export const PRESETS: Record<string, FormatPreset> = {
  "academic-default": {
    id: "academic-default",
    page: "A4",
    margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "30mm" },
    fontFamily: "Times New Roman",
    fontSizePt: 13,
    lineHeight: 1.5,
    bodyAlign: "justify",
    chapterStartsNewPage: true,
    captionNumbering: "continuous",
  },
};
