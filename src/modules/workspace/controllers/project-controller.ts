import { loadBundle } from "@/modules/write/autosave";
import { loadProjectBundle, saveProjectBundle } from "@/modules/write/project-store";
import type { ReportProjectBundle } from "@/types";

export async function loadWorkspaceProject(projectId?: string) {
  return projectId ? loadProjectBundle(projectId) : loadBundle();
}

export async function saveWorkspaceProject(bundle: ReportProjectBundle): Promise<void> {
  await saveProjectBundle(bundle);
}
