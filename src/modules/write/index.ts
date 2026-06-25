// Public surface for Module 1 — Write.
export { createProjectFromTemplate } from "./create-project";
export { softwareProjectTemplate } from "./templates/software-project";
export { readmeReportTemplate } from "./templates/readme-report";
export { ALL_TEMPLATES, getTemplate } from "./templates";
export { importReadme } from "./readme-import";
export { createThrottledSaver, loadBundle, saveBundle } from "./autosave";
export { createEditorState } from "./editor-setup";
export { insertSnippet } from "./insert-snippet";
export { resolveAssetRefs } from "./resolve-assets";
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
// AI layer — Group A (W11)
export { loadAiConfig, saveAiConfig, isAiReady, isAiUnconfigured, isAiDisabled, DEFAULT_AI_CONFIG } from "./ai/ai-config";
export { requestSuggestion, getGatewayState, registerAdapter } from "./ai/ai-gateway";
export type { AiAdapter } from "./ai/ai-gateway";
export { rewriteSection } from "./ai/rewrite-section";
export { SuggestionDiff } from "./ai/SuggestionDiff";
export { improveTone } from "./ai/improve-tone";
export { UserControlBar } from "./ai/UserControlBar";

