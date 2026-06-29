import type { Root as MdastRoot, Heading as MdastHeading, PhrasingContent } from "mdast";
import { stripAstHeadingPrefix } from "./strip-heading-number";

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

/**
 * Traverses MDAST in-place to inject heading numbers before heading children.
 * Skips empty headings to prevent off-by-one numbering alignment issues.
 */
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
      stripAstHeadingPrefix(heading);
      const text = getFlatText(heading.children).trim();
      if (text !== "") {
        const numHeading = globalNumberedHeadings[state.index++];
        if (numHeading && numHeading.text) {
          // Unshift the text node representing the hierarchy prefix (e.g. "1.1 ")
          heading.children.unshift({
            type: "text",
            value: `${numHeading.number} `,
          });

          // Assign correct HTML element ID for TOC anchor linking
          heading.data = {
            ...heading.data,
            hProperties: {
              ...(heading.data?.hProperties || {}),
              id: numHeading.id,
            },
          };
        }
      }
    }

    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) {
        walk(child);
      }
    }
  }
  walk(ast);
  return ast;
}
