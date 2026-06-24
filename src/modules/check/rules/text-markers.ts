// Rule `placeholder-text` (3.Check.md §5.2) — W1 text-based subset.
import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { findNodes } from "./utils";
import type { Text as MdastText } from "mdast";

const RULE_ID = "placeholder-text";
const SUGGESTION = "Còn nội dung placeholder — xoá/thay trước khi nộp.";

// Case-insensitive markers; \bTODO\b avoids matching words like "todos".
const MARKERS = [/\bTODO\b/i, /\bfix later\b/i, /\blorem ipsum\b/i];

export const placeholderTextRule: CheckRule = {
  id: RULE_ID,
  severity: "warning",
  detect: ["text", "ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const textNodes = findNodes(ast, "text") as MdastText[];

      for (const node of textNodes) {
        if (!node.value) continue;
        const lines = node.value.split("\n");
        const startLine = node.position?.start.line || 1;

        lines.forEach((lineText, idx) => {
          if (MARKERS.some((re) => re.test(lineText))) {
            issues.push({
              id: RULE_ID,
              severity: "warning",
              module: "check",
              message: "Phát hiện nội dung placeholder còn sót.",
              suggestion: SUGGESTION,
              sectionId,
              line: startLine + idx,
            });
          }
        });
      }
    }

    return issues;
  },
};



