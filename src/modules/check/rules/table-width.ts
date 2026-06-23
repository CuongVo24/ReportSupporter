import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { findNodes } from "./utils";
import type { Table as MdastTable } from "mdast";

/**
 * Rule: table-too-wide
 * Warns (as info severity) if a GFM table has more than 6 columns, as it might overflow A4 print width.
 */
export const tableTooWideRule: CheckRule = {
  id: "table-too-wide",
  severity: "info",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const tables = findNodes(ast, "table") as MdastTable[];

      for (const table of tables) {
        const firstRow = table.children[0];
        if (firstRow) {
          const colCount = firstRow.children.length;
          if (colCount > 6) {
            issues.push({
              id: "table-too-wide",
              severity: "info",
              module: "check",
              message: `Bảng có nhiều cột (${colCount} cột) có thể tràn trang A4.`,
              suggestion: "Bảng nhiều cột có thể tràn trang — cân nhắc tách bảng hoặc xoay landscape.",
              sectionId,
            });
          }
        }
      }
    }

    return issues;
  },
};
