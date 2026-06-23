// Rule `placeholder-text` (3.Check.md §5.2) — W1 text-based subset.
import type { CheckRule, CheckContext, ReportIssue } from "@/types";

const RULE_ID = "placeholder-text";
const SUGGESTION = "Còn nội dung placeholder — xoá/thay trước khi nộp.";

// Case-insensitive markers; \bTODO\b avoids matching words like "todos".
const MARKERS = [/\bTODO\b/i, /\bfix later\b/i, /\blorem ipsum\b/i];

export const placeholderTextRule: CheckRule = {
  id: RULE_ID,
  severity: "warning",
  detect: ["text"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    for (const section of ctx.bundle.project.sections) {
      const lines = section.markdown.split("\n");
      lines.forEach((text, index) => {
        if (MARKERS.some((re) => re.test(text))) {
          issues.push({
            id: RULE_ID,
            severity: "warning",
            module: "check",
            message: "Phát hiện nội dung placeholder còn sót.",
            suggestion: SUGGESTION,
            sectionId: section.id,
            line: index + 1,
          });
        }
      });
    }
    return issues;
  },
};


