import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { findNodes } from "./utils";
import type { Heading as MdastHeading } from "mdast";

/**
 * Rule: skipped-heading-level
 * Warns if heading levels are skipped when traversing sequentially (e.g. h1 -> h3).
 */
export const skippedHeadingLevelRule: CheckRule = {
  id: "skipped-heading-level",
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];
    let prevDepth = 0;

    // Sort sections by document order to walk headings sequentially
    const sortedSections = [...ctx.bundle.project.sections].sort((a, b) => a.order - b.order);

    for (const section of sortedSections) {
      const ast = ctx.sectionAsts[section.id];
      if (!ast) {
        continue;
      }

      const headings = findNodes(ast, "heading") as MdastHeading[];
      for (const heading of headings) {
        const d = heading.depth;
        if (prevDepth > 0 && d > prevDepth + 1) {
          issues.push({
            id: "skipped-heading-level",
            severity: "warning",
            module: "check",
            message: `Heading nhảy cấp từ h${prevDepth} sang h${d}.`,
            suggestion: "Heading nhảy cấp — chèn cấp trung gian hoặc hạ cấp heading.",
            sectionId: section.id,
          });
        }
        prevDepth = d;
      }
    }
    return issues;
  },
};
