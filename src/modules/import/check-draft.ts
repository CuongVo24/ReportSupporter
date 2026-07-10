import type { ImportDraft, ReportProjectBundle, ReportIssue } from "@/types";
import { runChecker } from "../check/run-checker";

/**
 * Runs the check engine on an ImportDraft and returns the issues mapped to the draft sections.
 * Builds a temporary virtual project bundle combining the draft with the current project/bundle context.
 *
 * @param draft The import draft.
 * @param currentBundle The active report project bundle in the workspace.
 */
export function checkDraft(draft: ImportDraft, currentBundle: ReportProjectBundle): ReportIssue[] {
  if (!draft || !draft.sections || draft.sections.length === 0) {
    return [];
  }

  // Construct a virtual project using metadata/template from the current workspace report project
  const virtualProject = {
    ...currentBundle.project,
    sections: draft.sections, // Validate the proposed draft sections
  };

  const virtualBundle: ReportProjectBundle = {
    ...currentBundle,
    project: virtualProject,
    assets: [...currentBundle.assets, ...draft.result.assets],
    evidence: [...currentBundle.evidence, ...(draft.evidence || [])],
  };

  // Run the standard check engine over the virtual bundle
  const result = runChecker(virtualBundle);

  // Filter issues to only those that apply to the draft sections and map to module "import"
  const draftSectionIds = new Set(draft.sections.map((s) => s.id));
  const draftIssues = result.issues
    .filter((issue) => !issue.sectionId || draftSectionIds.has(issue.sectionId))
    .map((issue) => ({
      ...issue,
      module: "import" as const, // Map to module: "import"
    }));

  return draftIssues;
}
