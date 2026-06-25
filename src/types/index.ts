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
export type { ExportTarget, ExportStatus, ExportError, ExportResult, ExportJob, PackageManifest, SubmissionPackage, SubmissionChecklistItem } from "./export";
export type { ParsedSection, PipelineResult, FormattedReport } from "./pipeline";
export type { SlideOutline, PresentationTimeline } from "./present";


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

export { slideOutlineSchema, presentationTimelineSchema } from "./present";

export { SCHEMA_VERSION, DEFAULT_TEMPLATE_ID, DEFAULT_FORMAT_SETTINGS } from "./defaults";

