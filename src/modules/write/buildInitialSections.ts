import type { TemplateSchema, ReportSection } from "@/types";
import { generateSkeleton } from "./generate-skeleton";
import { importReadme } from "./readme-import";
import { buildMemberResponsibility } from "./sections/member-responsibility";

/**
 * Builds initial sections for a project given a template and metadata,
 * handling special cases like Markdown-to-Report dynamic loading and member responsibility injection.
 */
export function buildInitialSections(
  template: TemplateSchema,
  metadata: Record<string, string | string[]>
): ReportSection[] {
  if (template.id === "readme-report") {
    const readmeContent = (metadata.readmeContent as string) || "";
    const importedSections = importReadme(readmeContent);

    const members = metadata.members;
    const isGroup = Array.isArray(members) && members.length > 1;

    if (importedSections.length > 0 && isGroup) {
      // Prepend a "Thành viên & Phân công" section for Markdown import templates
      const memberMarkdown = buildMemberResponsibility(members as string[]);
      const memberSection: ReportSection = {
        id: crypto.randomUUID(),
        title: "Thành viên & Phân công",
        order: 0,
        status: "draft",
        markdown: memberMarkdown,
      };

      // Shift orders of imported sections by 1 to accommodate the prepended member section
      const shifted = importedSections.map((sec) => ({
        ...sec,
        order: sec.order + 1,
      }));

      return [memberSection, ...shifted];
    }

    return importedSections;
  }

  return generateSkeleton(template, metadata);
}
