import type { Heading as MdastHeading, List as MdastList, ListItem as MdastListItem } from "mdast";
import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { flattenNodeText } from "@/lib/markdown-pipeline";

/**
 * Rule: references-format
 * Warns if the References section is empty, contains entries that are too short/malformed,
 * or if the numeric ordering of references is incorrect.
 */
export const referencesRule: CheckRule = {
  id: "references-format",
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const children = ast.children || [];
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.type === "heading") {
          const heading = node as MdastHeading;
          const headingText = flattenNodeText(heading).trim().toLowerCase();

          // Match variations of the references section title
          if (
            headingText.includes("tài liệu tham khảo") ||
            headingText.includes("references") ||
            headingText.includes("danh mục tài liệu tham khảo")
          ) {
            // Found the references section heading!
            // Collect all following sibling nodes until the next heading of equal or higher level
            const entries: { text: string; line?: number }[] = [];
            let j = i + 1;
            while (j < children.length) {
              const sibling = children[j];
              if (
                sibling.type === "heading" &&
                (sibling as MdastHeading).depth <= heading.depth
              ) {
                break;
              }

              if (sibling.type === "list") {
                const listItems = (sibling as MdastList).children || [];
                for (const item of listItems) {
                  if (item.type === "listItem") {
                    const listItem = item as MdastListItem;
                    const itemText = flattenNodeText(listItem).trim();
                    if (itemText) {
                      entries.push({
                        text: itemText,
                        line: listItem.position?.start?.line,
                      });
                    }
                  }
                }
              } else if (sibling.type === "paragraph") {
                const paraText = flattenNodeText(sibling).trim();
                if (paraText) {
                  entries.push({
                    text: paraText,
                    line: sibling.position?.start?.line,
                  });
                }
              }

              j++;
            }

            // Check if section contains no entries
            if (entries.length === 0) {
              issues.push({
                id: "references-format",
                severity: "warning",
                module: "check",
                message: "Mục Tài liệu tham khảo trống.",
                suggestion: "Thêm danh sách các tài liệu tham khảo đã sử dụng trong dự án.",
                sectionId,
                line: heading.position?.start?.line,
              });
            } else {
              let lastNum = 0;
              for (const entry of entries) {
                // 1. Check for empty/obviously too short entries
                if (entry.text.length < 10) {
                  issues.push({
                    id: "references-format",
                    severity: "warning",
                    module: "check",
                    message: `Tài liệu tham khảo quá ngắn hoặc thiếu thông tin: "${entry.text}"`,
                    suggestion: "Cung cấp đầy đủ thông tin tác giả, tiêu đề, năm xuất bản và nguồn dẫn.",
                    sectionId,
                    line: entry.line,
                  });
                }

                // 2. Check numeric ordering (prefix like [1], [2] or 1., 2.)
                const match = entry.text.match(/^\[(\d+)\]/) || entry.text.match(/^(\d+)\./);
                if (match) {
                  const num = parseInt(match[1], 10);
                  if (num < lastNum) {
                    issues.push({
                      id: "references-format",
                      severity: "warning",
                      module: "check",
                      message: `Thứ tự tài liệu tham khảo không đúng: [${num}] xuất hiện sau [${lastNum}].`,
                      suggestion: "Sắp xếp lại danh sách tài liệu tham khảo theo đúng thứ tự đánh số.",
                      sectionId,
                      line: entry.line,
                    });
                  }
                  lastNum = num;
                }
              }
            }
          }
        }
      }
    }

    return issues;
  },
};
