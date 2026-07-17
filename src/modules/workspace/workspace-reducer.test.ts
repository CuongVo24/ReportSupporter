import { describe, expect, it } from "vitest";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";
import { initialWorkspaceState, workspaceReducer } from "./workspace-reducer";
import { updateSectionMarkdown } from "./controllers/editor-controller";

describe("workspace reducer and editor controller", () => {
  it("loads a project and selects its first section", () => {
    const bundle = createProjectFromTemplate(softwareProjectTemplate);
    const state = workspaceReducer(initialWorkspaceState, { type: "project-loaded", bundle });
    expect(state.bundle).toBe(bundle);
    expect(state.activeSectionId).toBe(bundle.project.sections[0]?.id);
  });

  it("increments only the edited section revision", () => {
    const bundle = createProjectFromTemplate(softwareProjectTemplate);
    const section = bundle.project.sections[0];
    const next = updateSectionMarkdown(bundle, section.id, "Nội dung mới", new Date("2026-07-17T00:00:00Z"));
    expect(next?.project.sections[0].revision).toBe(section.revision + 1);
    expect(next?.project.updatedAt).toBe("2026-07-17T00:00:00.000Z");
  });
});
