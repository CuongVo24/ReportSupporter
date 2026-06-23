// Single re-export surface for canonical types, schemas, and defaults.

export type {
  ReportSection,
  ReportProject,
  ReportAsset,
  SnippetKind,
  ReportIssue,
  ReportIssueSeverity,
  ReportProjectBundle,
} from "./report";
export type { EvidenceKind, EvidenceItem } from "./evidence";
export type { FormatPreset, FormatSettings } from "./format";
export type { TemplateSchema, MetadataFieldSpec, TemplateSectionSeed } from "./template";
export type { ExportTarget, ExportStatus, ExportError, ExportResult, ExportJob } from "./export";
export type { ParsedSection, PipelineResult } from "./pipeline";

export {
  reportSectionSchema,
  reportProjectSchema,
  reportAssetSchema,
  evidenceKindSchema,
  evidenceItemSchema,
  formatSettingsSchema,
  metadataFieldSpecSchema,
  templateSectionSeedSchema,
  templateSchemaSchema,
  storedBundleSchema,
} from "./schemas";

export { SCHEMA_VERSION, DEFAULT_TEMPLATE_ID, DEFAULT_FORMAT_SETTINGS } from "./defaults";
