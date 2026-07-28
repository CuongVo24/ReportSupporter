import { describe, expect, it } from "vitest";
import { DEFAULT_FORMAT_SETTINGS, type ReportProjectBundle } from "@/types";
import { migrateBundle } from "./autosave";

function createBundle(initializationState?: "pending" | "complete"): ReportProjectBundle {
  return {
    project: {
      id: "project-1",
      title: "Báo cáo Phần mềm",
      templateId: "software-project",
      ...(initializationState ? { initializationState } : {}),
      metadata: {},
      sections: [{ id: "section-1", order: 0, title: "Mở đầu", markdown: "", status: "draft", revision: 0 }],
      updatedAt: "2026-07-28T00:00:00.000Z",
    },
    assets: [],
    evidence: [],
    formatSettings: DEFAULT_FORMAT_SETTINGS,
    schemaVersion: 2,
  };
}

describe("migrateBundle", () => {
  it("marks legacy persisted projects as initialized without inspecting their content", () => {
    const legacy = createBundle();
    const migrated = migrateBundle(legacy);

    expect(migrated.project.initializationState).toBe("complete");
  });

  it("preserves a deliberately pending first-run project", () => {
    const pending = createBundle("pending");
    const migrated = migrateBundle(pending);

    expect(migrated.project.initializationState).toBe("pending");
  });
});
