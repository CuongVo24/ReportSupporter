import { getSettingRecord, putSettingRecord } from "@/lib/idb-client";
import { ALL_TEMPLATES } from "@/modules/write/templates";
import { DEFAULT_FORMAT_SETTINGS, templateCatalogEntrySchema } from "@/types";
import type { TemplateCatalogEntry } from "@/types";

const PERSONAL_TEMPLATES_KEY = "personal-template-catalog";

export const BUNDLED_TEMPLATE_CATALOG: TemplateCatalogEntry[] = ALL_TEMPLATES.map((template) => ({
  id: `bundled:${template.id}`,
  version: "1.0.0",
  faculty: "Dùng chung",
  tags: ["offline", "báo cáo", template.id],
  source: "bundled",
  template,
  cover: { title: template.name, subtitle: template.description },
  formatPreset: DEFAULT_FORMAT_SETTINGS,
  rubric: [],
  checklist: template.sections.map((section) => `Hoàn thiện mục ${section.title}`),
}));

export async function listPersonalTemplates(): Promise<TemplateCatalogEntry[]> {
  const raw = await getSettingRecord(PERSONAL_TEMPLATES_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => templateCatalogEntrySchema.safeParse(entry))
    .filter((result) => result.success)
    .map((result) => ({ ...result.data, source: "personal" as const }));
}

export async function savePersonalTemplates(entries: TemplateCatalogEntry[]): Promise<void> {
  await putSettingRecord(PERSONAL_TEMPLATES_KEY, entries.map((entry) => ({ ...entry, source: "personal" })));
}

export async function importPersonalTemplate(file: File): Promise<TemplateCatalogEntry> {
  if (!file.name.toLocaleLowerCase("en-US").endsWith(".rstemplate.json")) {
    throw new Error("Template phải dùng phần mở rộng .rstemplate.json.");
  }
  const parsed = templateCatalogEntrySchema.parse(JSON.parse(await file.text()));
  const entry: TemplateCatalogEntry = { ...parsed, source: "personal" };
  const current = await listPersonalTemplates();
  await savePersonalTemplates([...current.filter((item) => item.id !== entry.id), entry]);
  return entry;
}

export function exportPersonalTemplate(entry: TemplateCatalogEntry): Blob {
  return new Blob([JSON.stringify({ ...entry, source: "personal" }, null, 2)], {
    type: "application/json;charset=utf-8",
  });
}
