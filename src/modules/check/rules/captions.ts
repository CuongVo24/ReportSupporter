import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { findNodes, getFlatText } from "./utils";
import type { Image as MdastImage, Paragraph as MdastParagraph } from "mdast";

/**
 * Rule: missing-captions
 * Warns if images have empty alt text, or tables lack an adjacent descriptive caption paragraph (starting with "Bảng" or "Table").
 */
export const missingCaptionsRule: CheckRule = {
  id: "missing-captions",
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      // 1. Check images (alt text is used as caption in MVP)
      const images = findNodes(ast, "image") as MdastImage[];
      for (const img of images) {
        if (!img.alt || img.alt.trim().length === 0) {
          issues.push({
            id: "missing-captions",
            severity: "warning",
            module: "check",
            message: "Hình ảnh thiếu caption (alt text rỗng).",
            suggestion: "Thêm caption cho hình/bảng để Format đánh số.",
            sectionId,
          });
        }
      }

      // 2. Check tables (must have an adjacent paragraph starting with "Bảng" or "Table")
      const children = ast.children || [];
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.type === "table") {
          let hasTableCaption = false;
          // Check immediately preceding (i-1) or succeeding (i+1) sibling nodes
          const adjacentIndices = [i - 1, i + 1];
          for (const idx of adjacentIndices) {
            if (idx >= 0 && idx < children.length) {
              const adjNode = children[idx];
              if (adjNode.type === "paragraph") {
                const text = getFlatText((adjNode as MdastParagraph).children || []).trim().toLowerCase();
                if (text.startsWith("bảng") || text.startsWith("table")) {
                  hasTableCaption = true;
                  break;
                }
              }
            }
          }

          if (!hasTableCaption) {
            issues.push({
              id: "missing-captions",
              severity: "warning",
              module: "check",
              message: "Bảng biểu thiếu caption liền kề.",
              suggestion: "Thêm caption cho hình/bảng để Format đánh số.",
              sectionId,
            });
          }
        }
      }
    }

    return issues;
  },
};
