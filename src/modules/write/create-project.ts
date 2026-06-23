import { DEFAULT_FORMAT_SETTINGS, SCHEMA_VERSION } from "@/types";
import type {
  ReportProject,
  ReportProjectBundle,
  ReportSection,
  TemplateSchema,
} from "@/types";

type CreateProjectInput = {
  title?: string;
  metadata?: ReportProject["metadata"];
};

/**
 * Map a TemplateSchema into a fresh ReportProjectBundle (1.Write §5.1).
 * Pure & deterministic except the generated UUIDs / timestamp.
 */
export function createProjectFromTemplate(
  template: TemplateSchema,
  input: CreateProjectInput = {},
): ReportProjectBundle {
  const sections: ReportSection[] = template.sections.map((seed) => ({
    id: crypto.randomUUID(),
    order: seed.order,
    title: seed.title,
    markdown: seed.starterMarkdown,
    status: seed.status, // "draft"
  }));

  const project: ReportProject = {
    id: crypto.randomUUID(),
    title: input.title ?? template.name,
    templateId: template.id,
    metadata: input.metadata ?? {},
    sections,
    updatedAt: new Date().toISOString(),
  };

  return {
    project,
    assets: [],
    evidence: [],
    formatSettings: DEFAULT_FORMAT_SETTINGS,
    schemaVersion: SCHEMA_VERSION,
  };
}
