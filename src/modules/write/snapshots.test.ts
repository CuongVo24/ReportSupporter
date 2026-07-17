import { describe, expect, it } from "vitest";
import { DEFAULT_FORMAT_SETTINGS, SCHEMA_VERSION, type ReportProjectBundle } from "@/types";
import {
  createSnapshotRecord,
  pruneSnapshotRecords,
  restoreSnapshot,
  takeSnapshot,
  type ReportSnapshot,
  type SnapshotStore,
} from "./snapshots";

function createBundle(projectId = "project-1"): ReportProjectBundle {
  return {
    project: {
      id: projectId,
      title: "Test report",
      templateId: "software-project",
      metadata: {},
      sections: [
        {
          id: "section-1",
          order: 0,
          title: "Intro",
          markdown: "Hello",
          status: "draft",
          revision: 0,
        },
      ],
      updatedAt: "2026-06-28T00:00:00.000Z",
    },
    assets: [],
    evidence: [],
    formatSettings: DEFAULT_FORMAT_SETTINGS,
    schemaVersion: SCHEMA_VERSION,
  };
}

function createMemoryStore(initial: unknown[] = []): SnapshotStore {
  const records = new Map<string, unknown>();
  for (const record of initial) {
    if (record && typeof record === "object" && typeof (record as { id?: unknown }).id === "string") {
      records.set((record as { id: string }).id, record);
    }
  }

  return {
    async putSnapshot(snapshot) {
      records.set(snapshot.id, snapshot);
    },
    async getSnapshot(id) {
      return records.get(id);
    },
    async getSnapshots(projectId) {
      return [...records.values()].filter(
        (record) => record && typeof record === "object" && (record as { projectId?: unknown }).projectId === projectId,
      );
    },
    async replaceSnapshots(projectId, snapshots) {
      for (const [id, record] of records) {
        if (record && typeof record === "object" && (record as { projectId?: unknown }).projectId === projectId) {
          records.delete(id);
        }
      }
      for (const snapshot of snapshots) {
        records.set(snapshot.id, snapshot);
      }
    },
  };
}

describe("snapshots", () => {
  it("prunes to the newest N snapshots", () => {
    const bundle = createBundle();
    const snapshots: ReportSnapshot[] = [
      createSnapshotRecord(bundle, "old", new Date("2026-06-28T00:00:00.000Z"), "old"),
      createSnapshotRecord(bundle, "new", new Date("2026-06-28T00:02:00.000Z"), "new"),
      createSnapshotRecord(bundle, "middle", new Date("2026-06-28T00:01:00.000Z"), "middle"),
    ];

    expect(pruneSnapshotRecords(snapshots, 2).map((snapshot) => snapshot.id)).toEqual(["new", "middle"]);
  });

  it("restores only snapshots with a valid stored bundle shape", async () => {
    const bundle = createBundle();
    const valid = createSnapshotRecord(bundle, "valid", new Date("2026-06-28T00:00:00.000Z"), "valid");
    const invalid = {
      id: "invalid",
      projectId: bundle.project.id,
      takenAt: "2026-06-28T00:01:00.000Z",
      reason: "invalid",
      bundle: { project: { id: bundle.project.id } },
    };
    const store = createMemoryStore([valid, invalid]);

    await expect(restoreSnapshot("valid", { store })).resolves.toEqual(bundle);
    await expect(restoreSnapshot("invalid", { store })).resolves.toBeNull();
  });

  it("takes a snapshot and prunes the project history", async () => {
    const bundle = createBundle();
    const older = createSnapshotRecord(bundle, "older", new Date("2026-06-28T00:00:00.000Z"), "older");
    const store = createMemoryStore([older]);

    await takeSnapshot(bundle, "newer", {
      store,
      max: 1,
      now: () => new Date("2026-06-28T00:01:00.000Z"),
      createId: () => "newer",
    });

    await expect(store.getSnapshot("older")).resolves.toBeUndefined();
    await expect(store.getSnapshot("newer")).resolves.toMatchObject({ id: "newer", reason: "newer" });
  });
});
