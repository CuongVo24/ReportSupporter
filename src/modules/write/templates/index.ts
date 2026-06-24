import type { TemplateSchema } from "@/types";
import { softwareProjectTemplate } from "./software-project";

export const ALL_TEMPLATES: TemplateSchema[] = [
  softwareProjectTemplate,
];

export function getTemplate(id: string): TemplateSchema | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}
