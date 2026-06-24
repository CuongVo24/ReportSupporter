// Single re-export surface for canonical types, schemas, and defaults.

export type {
  ReportSection,
  ReportProject,
  ReportAsset,
  SnippetKind,
  ReportIssue,
  ReportIssueSeverity,
  ReportProjectBundle,
  CheckRule,
  CheckContext,
  CheckResult,
} from "./report";
export type { EvidenceKind, EvidenceItem } from "./evidence";
export type { FormatPreset, FormatSettings, TocNode, CaptionEntry } from "./format";
export type { TemplateSchema, MetadataFieldSpec, TemplateSectionSeed } from "./template";
export type { ExportTarget, ExportStatus, ExportError, ExportResult, ExportJob, PackageManifest, SubmissionPackage } from "./export";
export type { ParsedSection, PipelineResult, FormattedReport } from "./pipeline";


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
