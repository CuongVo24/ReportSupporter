import type { FormatPreset } from "@/types";
import type { PhrasingContent } from "mdast";


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
