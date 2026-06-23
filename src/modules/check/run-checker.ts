// W1 checker runner — main-thread, synchronous, OFFLINE (3.Check.md HARD RULE).
// Text-based subset only; the canonical AST engine (CheckRule/CheckContext) is W3.
import type { ReportIssue, ReportProjectBundle } from "@/types";
import { placeholderTextRule } from "./rules/text-markers";
import { codeLanguageRule } from "./rules/code-language";

const RULES = [placeholderTextRule, codeLanguageRule];

/**
 * Run every text rule over each section's raw Markdown and collect issues.
 * Pure: no I/O, no network. The runner tags each issue with its `sectionId`.
 */
export function runChecker(bundle: ReportProjectBundle): ReportIssue[] {
  const issues: ReportIssue[] = [];
  for (const section of bundle.project.sections) {
    for (const rule of RULES) {
      for (const issue of rule.run(section.markdown)) {
        issues.push({ ...issue, sectionId: section.id });
      }
    }
  }
  return issues;
}
