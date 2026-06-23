import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { findNodes, getFlatText } from "./utils";
import type { Heading as MdastHeading } from "mdast";

const HARDCODED_HEADING_REGEX = /^(\d+(\.\d+)*[\s\.]|Chương\s+\d+|Chapter\s+\d+)/i;

/**
 * Rule: hardcoded-heading-number
 * Warns if headings start with hardcoded section numbers or chapter labels.
 */
export const hardcodedHeadingNumberRule: CheckRule = {
  id: "hardcoded-heading-number",
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const headings = findNodes(ast, "heading") as MdastHeading[];
      for (const heading of headings) {
        const text = getFlatText(heading.children).trim();
        if (HARDCODED_HEADING_REGEX.test(text)) {
          issues.push({
            id: "hardcoded-heading-number",
            severity: "warning",
            module: "check",
            message: "Heading bắt đầu bằng số chương hard-coded.",
            suggestion: "Xóa số chương khỏi Markdown; Format sẽ tự đánh số để tránh double numbering.",
            sectionId,
          });
        }
      }
    }
    return issues;
  },
};

/**
 * Rule: empty-section
 * Warns if a section has no content (only contains headings or whitespace).
 */
export const emptySectionRule: CheckRule = {
  id: "empty-section",
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    for (const section of ctx.bundle.project.sections) {
      const lines = section.markdown.split("\n");
      // Remove lines that are markdown headers (starting with #)
      const nonHeadingText = lines
        .filter((line) => !line.trim().startsWith("#"))
        .join("\n")
        .trim();

      if (nonHeadingText.length === 0) {
        issues.push({
          id: "empty-section",
          severity: "warning",
          module: "check",
          message: "Section còn trống — viết nội dung hoặc xoá section.",
          suggestion: "Thêm nội dung văn bản, hình ảnh, hoặc bảng biểu cho phần này, hoặc xóa section nếu không dùng.",
          sectionId: section.id,
        });
      }
    }
    return issues;
  },
};
