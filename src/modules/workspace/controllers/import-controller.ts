import type { ImportDraft, ReportProjectBundle } from "@/types";
import { appendSections, replaceSections } from "@/modules/write/markdown-import";

export function applyReviewedImport(bundle: ReportProjectBundle, draft: ImportDraft): ReportProjectBundle {
  const sections = draft.mode === "replace"
    ? replaceSections(bundle, draft.sections).project.sections
    : appendSections(bundle, draft.sections).project.sections;
  return {
    ...bundle,
    assets: [...bundle.assets, ...draft.result.assets.filter((asset) => !bundle.assets.some((item) => item.id === asset.id))],
    evidence: [...bundle.evidence, ...(draft.evidence ?? [])],
    project: { ...bundle.project, sections, updatedAt: new Date().toISOString() },
  };
}
