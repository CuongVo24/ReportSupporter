// Public surface for Module 1 — Write.
export { createProjectFromTemplate } from "./create-project";
export { softwareProjectTemplate } from "./templates/software-project";
export { createThrottledSaver, loadBundle, saveBundle } from "./autosave";
export { createEditorState } from "./editor-setup";
export { insertSnippet } from "./insert-snippet";
