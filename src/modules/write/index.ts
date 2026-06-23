// Public surface for Module 1 — Write.
export { createProjectFromTemplate } from "./create-project";
export { softwareProjectTemplate } from "./templates/software-project";
export { createThrottledSaver, loadBundle, saveBundle } from "./autosave";
export { createEditorState } from "./editor-setup";
export { insertSnippet } from "./insert-snippet";
export { resolveAssetRefs } from "./resolve-assets";
export { MermaidRenderer } from "./MermaidRenderer";
export { generateSkeleton, validateMetadata } from "./generate-skeleton";
export { TemplatePicker } from "./TemplatePicker";
export { MetadataForm } from "./MetadataForm";
export { ProjectInitializer } from "./ProjectInitializer";

