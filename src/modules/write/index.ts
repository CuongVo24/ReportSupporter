// Public surface for Module 1 — Write.
export { createProjectFromTemplate } from "./create-project";
export { softwareProjectTemplate } from "./templates/software-project";
export { readmeReportTemplate } from "./templates/readme-report";
export { ALL_TEMPLATES, getTemplate } from "./templates";
export { importReadme } from "./readme-import";
export { UniversalImportDropzone } from "./UniversalImportDropzone";
export {
  buildMarkdownImportDraft,
  inferMarkdownTitle,
  isMarkdownFile,
  isMarkdownFileName,
  readMarkdownFile,
  titleFromMarkdownFileName,
  appendSections,
  replaceSections,
} from "./markdown-import";
export type { MarkdownFileReadResult } from "./markdown-import";
export { createThrottledSaver, loadBundle, saveBundle } from "./autosave";
export {
  addRecoveryItem,
  dismissRecoveryItem,
  duplicateProjectBundle,
  listProjectSummaries,
  listRecoveryItems,
  loadProjectBundle,
  permanentlyDeleteProject,
  projectSummaryFromBundle,
  restoreProjectFromTrash,
  saveProjectBundle,
  scanOrphanedSnapshots,
  trashProject,
} from "./project-store";
export { computeWritingStats } from "./writing-stats";
export type { WritingStats } from "./writing-stats";
export {
  MAX_PROJECT_SNAPSHOTS,
  createSnapshotRecord,
  listSnapshots,
  listSnapshotMetadata,
  parseSnapshotRecord,
  pruneSnapshotRecords,
  pruneSnapshots,
  restoreSnapshot,
  takeSnapshot,
} from "./snapshots";
export type { ReportSnapshot, SnapshotMetadata, SnapshotStore } from "./snapshots";
export { createEditorState, syncAnnotation, ariaLabelCompartment } from "./editor-setup";
export {
  buildImageMarkdownDraft,
  buildLinkMarkdownDraft,
  buildWrappedMarkdownDraft,
  createMarkdownShortcutKeymap,
} from "./editor-shortcuts";
export type { MarkdownReplacementDraft } from "./editor-shortcuts";
export { insertSnippet } from "./insert-snippet";
export { resolveAssetRefs, isUnembeddedImage, transformUnembeddedImages } from "./resolve-assets";
export { rewriteMarkdownRefs } from "./import-assets";
export { MermaidRenderer } from "./MermaidRenderer";
export { generateSkeleton, validateMetadata } from "./generate-skeleton";
export { TemplatePicker } from "./TemplatePicker";
export { MetadataForm } from "./MetadataForm";
export { ProjectInitializer } from "./ProjectInitializer";
export { useDraftAutosave } from "./use-draft-autosave";
export { createImageAsset, useImageInsert } from "./use-image-insert";
export { buildMemberResponsibility } from "./sections/member-responsibility";
export { buildProjectTimeline } from "./sections/project-timeline";
export { buildInitialSections } from "./buildInitialSections";
export {
  addSection,
  duplicateSection,
  renameSection,
  deleteSection,
  moveSection,
  moveSectionToIndex,
  renumberSections,
} from "./section-ops";
// AI layer — Group A (W11)
export { loadAiConfig, saveAiConfig, isAiReady, isAiUnconfigured, isAiDisabled, DEFAULT_AI_CONFIG } from "./ai/ai-config";
export { requestSuggestion, getGatewayState, registerAdapter } from "./ai/ai-gateway";
export type { AiAdapter } from "./ai/ai-gateway";
export { rewriteSection } from "./ai/rewrite-section";
export { SuggestionDiff } from "./ai/SuggestionDiff";
export { improveTone } from "./ai/improve-tone";
export { translateSection } from "./ai/translate-section";
export { improveTerminology } from "./ai/improve-terminology";
export { suggestWholeReportSections } from "./ai/whole-report-ai";
export type { SectionAiSuggestion, WholeReportAiAction } from "./ai/whole-report-ai";
export { UserControlBar } from "./ai/UserControlBar";
export { AiSettingsDialog } from "./ai/AiSettingsPanel";
export { AiAssistBar } from "./ai/AiAssistBar";
export { AiWholeReportPanel } from "./ai/AiWholeReportPanel";
export { httpAdapter } from "./ai/adapters/http-adapter";
export { generateOutline } from "./ai/generate-outline";
