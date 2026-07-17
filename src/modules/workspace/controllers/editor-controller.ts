import type { ReportProjectBundle } from "@/types";

export function updateSectionMarkdown(
  bundle: ReportProjectBundle | null,
  sectionId: string | null,
  markdown: string,
  now = new Date(),
): ReportProjectBundle | null {
  if (!bundle || !sectionId) return bundle;
  const current = bundle.project.sections.find((section) => section.id === sectionId);
  if (!current || current.markdown === markdown) return bundle;
  return {
    ...bundle,
    project: {
      ...bundle.project,
      updatedAt: now.toISOString(),
      sections: bundle.project.sections.map((section) => section.id === sectionId
        ? { ...section, markdown, revision: section.revision + 1 }
        : section),
    },
  };
}
