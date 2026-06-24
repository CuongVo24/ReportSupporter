import type { Root as MdastRoot, Content as MdastContent, Image as MdastImage, Table as MdastTable, Paragraph as MdastParagraph } from "mdast";
import type { CaptionEntry } from "@/types";
import { flattenNodeText } from "@/lib/markdown-pipeline";

/**
 * Normalizes figure and table captions in the report section ASTs in-place.
 * Prepends/injects numbered caption labels using a pre-computed registry of CaptionEntry[].
 * 
 * @param sections List of sections with their parsed ASTs.
 * @param registry The single pre-computed registry of figure and table captions.
 */
export function normalizeCaptions(
  sections: { id: string; ast: MdastRoot }[],
  registry: CaptionEntry[],
  state?: { figIdx: number; tableIdx: number }
): void {
  const figures = registry.filter((r) => r.kind === "figure");
  const tables = registry.filter((r) => r.kind === "table");

  const activeState = state || { figIdx: 0, tableIdx: 0 };

  for (const sec of sections) {
    const ast = sec.ast;

    const walkAndMutate = (parent: MdastContent | MdastRoot) => {
      if (!parent || !("children" in parent) || !Array.isArray(parent.children)) {
        return;
      }

      const newChildren: MdastContent[] = [];

      for (let i = 0; i < parent.children.length; i++) {
        const node = parent.children[i] as MdastContent;

        if (node.type === "paragraph") {
          const paragraphNode = node as MdastParagraph;
          const imagesInPara: MdastImage[] = [];
          const findImages = (n: MdastContent) => {
            if (n.type === "image") {
              imagesInPara.push(n as MdastImage);
            }
            if ("children" in n && Array.isArray(n.children)) {
              n.children.forEach((child) => findImages(child as MdastContent));
            }
          };
          findImages(paragraphNode);

          newChildren.push(paragraphNode);

          if (imagesInPara.length > 0) {
            for (const img of imagesInPara) {
              const entry = figures[activeState.figIdx++];
              if (entry) {
                // Set stable ID on the image node
                img.data = {
                  ...img.data,
                  hProperties: { ...(img.data?.hProperties || {}), id: entry.id },
                };

                // Inject a figure caption paragraph immediately after the paragraph containing the image
                const captionText = `${entry.label}: ${entry.text}`.trim();
                newChildren.push({
                  type: "paragraph",
                  children: [{ type: "text", value: captionText }],
                  data: {
                    hProperties: { className: "fig-caption", id: entry.id },
                  },
                } as unknown as MdastContent);
              }
            }
          }
        } else if (node.type === "table") {
          const tableNode = node as MdastTable;
          const entry = tables[activeState.tableIdx++];
          newChildren.push(tableNode);

          if (entry) {
            // Set stable ID on the table node
            tableNode.data = {
              ...tableNode.data,
              hProperties: { ...(tableNode.data?.hProperties || {}), id: entry.id },
            };

            // Look for adjacent caption paragraph in parent's children (before or after)
            const adjacentIndices = [i - 1, i + 1];
            for (const idx of adjacentIndices) {
              if (idx >= 0 && idx < parent.children.length) {
                const adj = parent.children[idx] as MdastContent;
                if (adj && adj.type === "paragraph") {
                  const paragraphAdj = adj as MdastParagraph;
                  const text = flattenNodeText(paragraphAdj).trim();
                  if (/^(bảng|table)/i.test(text)) {
                    // Update content in-place with normalized label and text
                    const captionText = `${entry.label}: ${entry.text}`.trim();
                    paragraphAdj.children = [{ type: "text", value: captionText }];
                    paragraphAdj.data = {
                      ...paragraphAdj.data,
                      hProperties: { className: "tbl-caption", id: entry.id },
                    };
                    break;
                  }
                }
              }
            }
          }
        } else {
          newChildren.push(node);
          // Recurse into non-paragraph/non-table blocks
          walkAndMutate(node);
        }
      }

      (parent as { children: MdastContent[] }).children = newChildren;
    };

    walkAndMutate(ast);
  }
}
