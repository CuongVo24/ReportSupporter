// Rule `placeholder-text` (3.Check.md §5.2) — W1 text-based subset.
// Scans RAW Markdown for leftover placeholders. Regex is allowed here because
// this is a plain-text check (TaskBrief §3 / 3.Check.md §5.2 detect="text").
import type { ReportIssue } from "@/types";

const RULE_ID = "placeholder-text";
const SUGGESTION = "Còn nội dung placeholder — xoá/thay trước khi nộp.";

// Case-insensitive markers; \bTODO\b avoids matching words like "todos".
const MARKERS = [/\bTODO\b/i, /\bfix later\b/i, /\blorem ipsum\b/i];

/** Find placeholder markers in raw Markdown. Returns one issue per matched line. */
function run(markdown: string): ReportIssue[] {
  const issues: ReportIssue[] = [];
  const lines = markdown.split("\n");
  lines.forEach((text, index) => {
    if (MARKERS.some((re) => re.test(text))) {
      issues.push({
        id: RULE_ID,
        severity: "warning",
        module: "check",
        message: "Phát hiện nội dung placeholder còn sót.",
        suggestion: SUGGESTION,
        line: index + 1,
      });
    }
  });
  return issues;
}

export const placeholderTextRule = { id: RULE_ID, severity: "warning", run } as const;
