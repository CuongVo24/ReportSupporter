import type { CheckResult, SlideOutline, WeakSectionHint } from "@/types";

/**
 * Aggregates checker issues by section and slide to build review hints.
 * Does not rerun checker rules, but summarizes the existing CheckResult.
 */
export function buildWeakSectionHints(
  check: CheckResult,
  outline: SlideOutline[]
): WeakSectionHint[] {
  if (!check || !check.issues || check.issues.length === 0) {
    return [];
  }

  // Group issues by sectionId (fallback to "global" if missing)
  const groupedIssues: Record<string, typeof check.issues> = {};
  for (const issue of check.issues) {
    const key = issue.sectionId || "global";
    if (!groupedIssues[key]) {
      groupedIssues[key] = [];
    }
    groupedIssues[key].push(issue);
  }

  const hints: WeakSectionHint[] = [];

  const severityRank = {
    error: 3,
    warning: 2,
    info: 1,
  };

  for (const [sectionId, issues] of Object.entries(groupedIssues)) {
    // Find slide matching sectionId (for global/unassigned, slideId is undefined)
    const slide = outline.find((s) => s.fromSectionId === sectionId);
    const slideId = slide?.id;

    // Find the heaviest severity
    let heaviestSeverity: "error" | "warning" | "info" = "info";
    let maxRank = 0;
    for (const issue of issues) {
      const rank = severityRank[issue.severity] || 0;
      if (rank > maxRank) {
        maxRank = rank;
        heaviestSeverity = issue.severity;
      }
    }

    // Deduplicate message and suggestion lists
    const uniqueReasons = Array.from(new Set(issues.map((i) => i.message.trim())));
    const uniqueSuggestions = Array.from(new Set(issues.map((i) => i.suggestion.trim())));

    hints.push({
      sectionId,
      slideId,
      severity: heaviestSeverity,
      reason: uniqueReasons.join(" | "),
      suggestion: uniqueSuggestions.join(" | "),
    });
  }

  // Deterministically sort by severity (heavy first) and then by sectionId
  return hints.sort((a, b) => {
    const rankA = severityRank[a.severity] || 0;
    const rankB = severityRank[b.severity] || 0;
    if (rankA !== rankB) {
      return rankB - rankA;
    }
    return a.sectionId.localeCompare(b.sectionId);
  });
}
