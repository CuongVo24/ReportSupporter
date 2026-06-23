// Zod schemas at the I/O boundary (IndexedDB / template JSON / forms).
// Mirror the canonical types 1:1 — see Design/Modules/1.Write.md §3.4.
import { z } from "zod";

export const reportSectionSchema = z.object({
  id: z.string(),
  order: z.number().int().nonnegative(),
  title: z.string(),
  markdown: z.string(),
  status: z.enum(["draft", "review", "done"]),
});

export const reportProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  templateId: z.string(),
  metadata: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  sections: z.array(reportSectionSchema),
  updatedAt: z.string(),
});

export const reportAssetSchema = z.object({
  id: z.string(),
  kind: z.literal("image"),
  fileName: z.string(),
  mimeType: z.string(),
  data: z.string(),
  insertedAt: z.string(),
});

export const evidenceKindSchema = z.enum([
  "video",
  "github",
  "deploy",
  "drive",
  "figma",
  "account",
  "api-docs",
  "slide",
  "other",
]);

export const evidenceItemSchema = z.object({
  id: z.string(),
  kind: evidenceKindSchema,
  title: z.string(),
  url: z.string().optional(),
  note: z.string().optional(),
  qrEnabled: z.boolean(),
  createdAt: z.string(),
});

export const formatSettingsSchema = z.object({
  presetId: z.string(),
  includeToc: z.boolean(),
  includeListOfFigures: z.boolean(),
  includeListOfTables: z.boolean(),
  captionNumbering: z.enum(["continuous", "per-chapter"]),
});

export const metadataFieldSpecSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["text", "textList"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
});

export const templateSectionSeedSchema = z.object({
  title: z.string(),
  order: z.number().int().nonnegative(),
  starterMarkdown: z.string(),
  status: z.literal("draft"),
});

export const templateSchemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  metadataFields: z.array(metadataFieldSpecSchema),
  sections: z.array(templateSectionSeedSchema),
  requiredSections: z.array(z.string()),
  requiredEvidenceKinds: z.array(evidenceKindSchema),
  requiresToc: z.boolean(),
});

// Full ReportProjectBundle persisted to IndexedDB — covers project + assets + evidence
// + formatSettings + schemaVersion (Locked Decision: do not drop fields on read).
export const storedBundleSchema = z.object({
  project: reportProjectSchema,
  assets: z.array(reportAssetSchema),
  evidence: z.array(evidenceItemSchema),
  formatSettings: formatSettingsSchema,
  schemaVersion: z.number().int(),
});
