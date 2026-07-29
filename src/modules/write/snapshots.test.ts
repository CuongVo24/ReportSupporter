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
      initializationState: "complete",
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
    async deleteSnapshots(ids) {
      for (const id of ids) records.delete(id);
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

  it("prunes incrementally: deletes only surplus-oldest, does not rewrite kept (W24-M)", async () => {
    const bundle = createBundle();
    const records = new Map<string, unknown>();
    const putIds: string[] = [];
    const deletedIds: string[] = [];
    const store = {
      async putSnapshot(snapshot: ReportSnapshot) { records.set(snapshot.id, snapshot); putIds.push(snapshot.id); },
      async getSnapshot(id: string) { return records.get(id); },
      async getSnapshots() { return [...records.values()]; },
      async replaceSnapshots() { throw new Error("replaceSnapshots must NOT be used on the incremental path"); },
      async deleteSnapshots(ids: string[]) { for (const id of ids) records.delete(id); deletedIds.push(...ids); },
    };
    // Seed 10 existing snapshots (t0..t9), then take an 11th.
    for (let i = 0; i < 10; i += 1) {
      const snapshot = createSnapshotRecord(bundle, `s${i}`, new Date(`2026-06-28T00:0${i}:00.000Z`), `s${i}`);
      records.set(snapshot.id, snapshot);
    }
    await takeSnapshot(bundle, "s10", { store, now: () => new Date("2026-06-28T00:10:00.000Z"), createId: () => "s10", max: 10 });

    // Only the new snapshot was put; only the oldest surplus (s0) was deleted.
    expect(putIds).toEqual(["s10"]);
    expect(deletedIds).toEqual(["s0"]);
    expect(records.has("s0")).toBe(false);
    expect(records.size).toBe(10);
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
