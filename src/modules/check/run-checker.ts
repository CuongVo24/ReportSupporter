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
    }
  }

  const errorIssues = issues.filter((i) => i.severity === "error");
  const warningIssues = issues.filter((i) => i.severity === "warning");
  const infoIssues = issues.filter((i) => i.severity === "info");

  // Draft score: start at 100, error -15, warning -5, info -1. Clamped at 0.
  const scoreRaw = 100 - (errorIssues.length * 15 + warningIssues.length * 5 + infoIssues.length * 1);
  const readinessScore = Math.max(0, scoreRaw);

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

