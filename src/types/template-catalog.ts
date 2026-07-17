import { z } from "zod";
import { formatSettingsSchema, templateSchemaSchema } from "./schemas";
import type { FormatSettings } from "./format";
import type { TemplateSchema } from "./template";

export type TemplateCatalogEntry = {
  id: string;
  version: string;
  faculty: string;
  tags: string[];
  source: "bundled" | "personal";
  template: TemplateSchema;
  cover: { title: string; subtitle?: string };
  formatPreset: FormatSettings;
  rubric: Array<{ criterion: string; weight: number }>;
  checklist: string[];
};

export const templateCatalogEntrySchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  faculty: z.string().min(1),
  tags: z.array(z.string()),
  source: z.enum(["bundled", "personal"]).default("personal"),
  template: templateSchemaSchema,
  cover: z.object({ title: z.string().min(1), subtitle: z.string().optional() }),
  formatPreset: formatSettingsSchema,
  rubric: z.array(z.object({ criterion: z.string().min(1), weight: z.number().min(0).max(1) })),
  checklist: z.array(z.string().min(1)),
});
