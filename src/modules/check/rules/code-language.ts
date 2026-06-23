// Rule `code-block-no-lang` (3.Check.md §5.2) — W1 text-based subset.
// Detects fenced code blocks opened without a language token. No mdast in W1
// (TaskBrief §3): we walk fences line-by-line on raw Markdown.
import type { ReportIssue } from "@/types";

const RULE_ID = "code-block-no-lang";
const SUGGESTION = "Thêm ngôn ngữ cho code block (vd ```ts) để highlight & export đúng.";

const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;

/** Flag opening fences whose info string has no language token. */
function run(markdown: string): ReportIssue[] {
  const issues: ReportIssue[] = [];
  const lines = markdown.split("\n");
  let openFence: string | null = null; // the marker that opened the current block

  lines.forEach((text, index) => {
    const match = FENCE.exec(text);
    if (!match) return;
    const marker = match[2];
    const info = match[3].trim();

    if (openFence) {
      // A fence line while open closes the block only if markers are compatible.
      if (marker[0] === openFence[0] && marker.length >= openFence.length) openFence = null;
      return;
    }

    openFence = marker;
    if (info.length === 0) {
      issues.push({
        id: RULE_ID,
        severity: "warning",
        module: "check",
        message: "Code block thiếu khai báo ngôn ngữ.",
        suggestion: SUGGESTION,
        line: index + 1,
      });
    }
  });
  return issues;
}

export const codeLanguageRule = { id: RULE_ID, severity: "warning", run } as const;
