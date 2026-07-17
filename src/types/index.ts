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
  ProjectSummary,
  ProjectRecord,
  RecoveryItemKind,
  RecoveryItem,
  ProjectPackageManifest,
} from "./report";
export type { Root as MdastRoot } from "mdast";
export type { EvidenceKind, EvidenceItem } from "./evidence";
export type { FormatPreset, FormatSettings, TocNode, CaptionEntry } from "./format";
export type { TemplateSchema, MetadataFieldSpec, TemplateSectionSeed } from "./template";
export type { TemplateCatalogEntry } from "./template-catalog";
export { templateCatalogEntrySchema } from "./template-catalog";
export type { ExportTarget, ExportStatus, ExportError, ExportArtifact, ExportArtifactMetadata, ExportResult, ExportJob, PackageManifest, SubmissionPackage, SubmissionChecklistItem } from "./export";
export type { ParsedSection, PipelineResult, FormattedReport, PipelinePreviewPart, PipelinePreviewResult, PipelineRequest, PipelineResponse } from "./pipeline";
export type {
  ImportSourceFormat,
  ImportWarningCode,
  ImportWarning,
  ImportResult,
  ImportConverter,
  ImportDraft,
  OcrProgress,
  ImportFileRef,
  AssetResolutionStatus,
  AssetResolution,
  OcrResult,
  ImportReviewDecisions,
} from "./import";
export type {
  SlideOutline,
  PresentationTimeline,
  Speaker,
  SpeakerScript,
  DefenseQA,
  WeakSectionHint,
  MockDefensePersona,
  DefenseQuestion,
  AnswerVerdict,
  MockDefenseTurn,
  ReadinessScorecard,
  MockDefenseSession,
} from "./present";
export type {
  AiAction,
  AiTaskStatus,
  AiSuggestion,
  AiUsage,
  AiStreamEvent,
  AiRequestContext,
  AiRequestOptions,
  AiConfig,
  GatewayState,
  AiActionGateway,
} from "./ai";
export { aiActionSchema, aiSuggestionSchema, aiConfigSchema } from "./ai";


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

export {
  importSourceFormatSchema,
  importWarningCodeSchema,
  importWarningSchema,
  importResultSchema,
  reportIssueSchema,
  importDraftSchema,
} from "./import";

export {
  slideOutlineSchema,
  presentationTimelineSchema,
  speakerSchema,
  speakerScriptSchema,
  defenseQASchema,
  weakSectionHintSchema,
  mockDefensePersonaSchema,
  defenseQuestionSchema,
  answerVerdictSchema,
  mockDefenseTurnSchema,
  readinessScorecardSchema,
  mockDefenseSessionSchema,
} from "./present";

export { SCHEMA_VERSION, DEFAULT_TEMPLATE_ID, DEFAULT_FORMAT_SETTINGS } from "./defaults";
