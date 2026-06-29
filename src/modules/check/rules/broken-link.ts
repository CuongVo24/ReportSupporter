import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { findNodes } from "./utils";
import type { Link as MdastLink } from "mdast";
import { parseHeadings, type HeadingNode } from "@/modules/format/parse-headings";
import { numberHeadings } from "@/modules/format/number-headings";

/**
 * Rule: broken-link
 * Warns if a markdown link is empty, refers to a non-existent heading anchor (e.g. #ghost),
 * or references a local relative file path that cannot be resolved in a web context.
 */
export const brokenLinkRule: CheckRule = {
  id: "broken-link",
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    // 1. Gather all valid heading anchor IDs in the document
    const allHeadings: HeadingNode[] = [];
    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const secHeadings = parseHeadings(ast).map((h) => ({
        ...h,
        sectionId,
      }));
      allHeadings.push(...secHeadings);
    }
    const numbered = numberHeadings(allHeadings, ctx.bundle.formatSettings);
    const validAnchorIds = new Set(numbered.map((h) => h.id));

    // 2. Scan links in each section
    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const links = findNodes(ast, "link") as MdastLink[];

      for (const link of links) {
        const url = link.url ? link.url.trim() : "";

        if (!url) {
          issues.push({
            id: "broken-link",
            severity: "warning",
            module: "check",
            message: "Đường liên kết trống hoặc thiếu URL.",
            suggestion: "Cung cấp URL cho liên kết hoặc xóa liên kết.",
            sectionId,
            line: link.position?.start?.line,
          });
          continue;
        }

        // Internal anchor check
        if (url.startsWith("#")) {
          const anchorId = url.slice(1);
          if (!validAnchorIds.has(anchorId)) {
            issues.push({
              id: "broken-link",
              severity: "warning",
              module: "check",
              message: `Liên kết nội bộ trỏ tới neo không tồn tại: "${url}".`,
              suggestion: "Kiểm tra lại tên tiêu đề hoặc sửa lại neo liên kết.",
              sectionId,
              line: link.position?.start?.line,
            });
          }
          continue;
        }

        // Remote/supported protocol whitelist
        const isSupportedProtocol = /^(https?:|mailto:|tel:)/i.test(url);
        if (!isSupportedProtocol) {
          issues.push({
            id: "broken-link",
            severity: "warning",
            module: "check",
            message: `Liên kết sử dụng đường dẫn cục bộ chưa hỗ trợ: "${url}".`,
            suggestion: "Hãy chuyển thành liên kết web (http/https) hoặc liên kết nội bộ (#neo).",
            sectionId,
            line: link.position?.start?.line,
          });
        }
      }
    }

    return issues;
  },
};
