import type { TemplateSchema } from "@/types";
import { softwareProjectTemplate } from "./software-project";
import { labReportTemplate } from "./lab-report";
import { internshipReportTemplate } from "./internship-report";

export const ALL_TEMPLATES: TemplateSchema[] = [
  softwareProjectTemplate,
  labReportTemplate,
  internshipReportTemplate,
];

export function getTemplate(id: string): TemplateSchema | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}
