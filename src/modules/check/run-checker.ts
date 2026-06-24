import type {
  CheckContext,
  CheckResult,
  FormattedReport,
  ReportIssue,
  ReportProjectBundle,
} from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { RULES_REGISTRY } from "./registry";
import type { Root as MdastRoot } from "mdast";
import { computeReadiness } from "./readiness-score";

/**
 * Runs the check engine over the project bundle.
 * Parses each section once into CheckContext, executes registered AST/text/meta rules,
 * groups the issues, and calculates a readiness score.
 */
export function runChecker(bundle: ReportProjectBundle, formatted?: FormattedReport): CheckResult {
  const sectionAsts: Record<string, MdastRoot> = {};

  // Parse each section's markdown exactly once to satisfy parse-once cache rule
  for (const section of bundle.project.sections) {
    sectionAsts[section.id] = parseMarkdown(section.markdown);
  }

  const ctx: CheckContext = {
    bundle,
    formatted,
    sectionAsts,
    templateId: bundle.project.templateId,
  };

  const issues: ReportIssue[] = [];

  // Execute rules registry
  for (const rule of RULES_REGISTRY) {
    try {
      const ruleIssues = rule.run(ctx);
      issues.push(...ruleIssues);
    } catch (error) {
      console.error(`Rule ${rule.id} failed to run:`, error);
      issues.push({
        id: "checker-rule-error",
        severity: "info",
        module: "check",
        message: `Rule "${rule.id}" lỗi khi chạy.`,
        suggestion: "Đã xảy ra lỗi hệ thống khi chạy quy tắc kiểm tra này. Vui lòng kiểm tra lại cấu trúc Markdown của bạn.",
      });
    }
  }

  const errorIssues = issues.filter((i) => i.severity === "error");
  const warningIssues = issues.filter((i) => i.severity === "warning");
  const infoIssues = issues.filter((i) => i.severity === "info");

  const readinessScore = computeReadiness(issues);

  const ranAt = new Date().toISOString();

  return {
    issues,
    grouped: {
      error: errorIssues,
      warning: warningIssues,
      info: infoIssues,
    },
    readinessScore,
    ranAt,
  };
}

