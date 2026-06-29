import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { findNodes } from "./utils";
import type { Image as MdastImage } from "mdast";

/**
 * Rule: broken-image
 * Errors if an image node has an empty URL, or references a non-existent asset ID (e.g. asset:ghost).
 */
export const brokenImageRule: CheckRule = {
  id: "broken-image",
  severity: "error",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];
    const assetIds = new Set(ctx.bundle.assets.map((a) => a.id));

    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const images = findNodes(ast, "image") as MdastImage[];

      for (const img of images) {
        const url = img.url ? img.url.trim() : "";

        if (!url) {
          issues.push({
            id: "broken-image",
            severity: "error",
            module: "check",
            message: "Ảnh thiếu hoặc sai đường dẫn — chèn lại ảnh.",
            suggestion: "Bổ sung đường dẫn URL ảnh hoặc chèn lại ảnh.",
            sectionId,
          });
          continue;
        }

        // Detect raw relative/local paths not processed as asset/data URIs
        const isRemoteOrEmbedded = /^(https?:|data:|asset:|image:)/i.test(url);
        if (!isRemoteOrEmbedded) {
          issues.push({
            id: "broken-image",
            severity: "error",
            module: "check",
            message: `Ảnh sử dụng đường dẫn cục bộ chưa được nhúng: "${url}".`,
            suggestion: "Vui lòng import lại tài liệu kèm theo thư mục/tệp ảnh để nhúng tự động.",
            sectionId,
          });
          continue;
        }

        // Match asset:<id> or image:<id> formats
        const assetMatch = /^(asset|image):(.+)$/.exec(url);
        if (assetMatch) {
          const id = assetMatch[2].trim();
          if (!assetIds.has(id)) {
            issues.push({
              id: "broken-image",
              severity: "error",
              module: "check",
              message: `Tham chiếu ảnh không tồn tại: "${url}".`,
              suggestion: "Ảnh thiếu hoặc sai đường dẫn — chèn lại ảnh.",
              sectionId,
            });
          }
        }
      }
    }

    return issues;
  },
};
