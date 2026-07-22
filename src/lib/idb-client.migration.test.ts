// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteDB, openDB } from "idb";
import {
  REPORT_SUPPORTER_DB_NAME,
  getRawBundle,
  getRawProjectBundle,
  getProjectSummaryRecords,
  getSnapshotRecords,
  putProjectRecord,
  putRawBundle,
  resetIdbConnectionForTests,
} from "./idb-client";
import { loadProjectBundle } from "@/modules/write/project-store";

const legacyBundle = {
  schemaVersion: 1,
  project: {
    id: "legacy-project",
    title: "Legacy project",
    templateId: "software-project",
    metadata: {},
    sections: [{ id: "s1", order: 0, title: "Mở đầu", markdown: "Cũ", status: "draft" }],
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  assets: [{ id: "a1", kind: "image", fileName: "a.png", mimeType: "image/png", data: "data:image/png;base64,AA==", insertedAt: "2026-01-01T00:00:00.000Z" }],
  evidence: [{ id: "e1", kind: "github", title: "Repo", url: "https://github.com/acme/repo", qrEnabled: true, createdAt: "2026-01-01T00:00:00.000Z" }],
  formatSettings: { presetId: "academic-default", includeToc: true, includeListOfFigures: false, includeListOfTables: false, captionNumbering: "continuous" },
};

beforeEach(async () => {
  await resetIdbConnectionForTests();
  await deleteDB(REPORT_SUPPORTER_DB_NAME);
});

afterEach(async () => {
  await resetIdbConnectionForTests();
  await deleteDB(REPORT_SUPPORTER_DB_NAME);
});

describe("IndexedDB v3 to v4 migration", () => {
  it("copies the current bundle atomically and retains rollback data and snapshots", async () => {
    const db = await openDB(REPORT_SUPPORTER_DB_NAME, 3, {
      upgrade(database) {
        database.createObjectStore("drafts");
        database.createObjectStore("export-history", { keyPath: "id" });
        const snapshots = database.createObjectStore("snapshots", { keyPath: "id" });
        snapshots.createIndex("by-project", "projectId");
      },
    });
    await db.put("drafts", legacyBundle, "current");
    await db.put("snapshots", {
      id: "snapshot-1",
      projectId: "legacy-project",
      takenAt: "2026-01-01T00:00:00.000Z",
      reason: "Before migration",
      bundle: legacyBundle,
    });
    db.close();

    expect(await getRawProjectBundle("legacy-project")).toEqual(legacyBundle);
    expect(await getRawBundle()).toEqual(legacyBundle);
    expect(await getSnapshotRecords("legacy-project")).toHaveLength(1);
    expect(await getProjectSummaryRecords()).toEqual([
      expect.objectContaining({ id: "legacy-project", title: "Legacy project", sectionCount: 1 }),
    ]);

    await resetIdbConnectionForTests();
    expect(await getRawProjectBundle("legacy-project")).toEqual(legacyBundle);
    expect(await getProjectSummaryRecords()).toHaveLength(1);
  });
});

describe("W24-L retire legacy dual-write", () => {
  const summary = {
    id: "legacy-project",
    title: "Legacy project",
    templateId: "software-project",
    sectionCount: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastOpenedAt: "2026-01-01T00:00:00.000Z",
  };

  it("putProjectRecord writes only the canonical stores, not the legacy draft", async () => {
    await putProjectRecord(legacyBundle, summary);
    expect(await getRawProjectBundle("legacy-project")).toEqual(legacyBundle);
    // Legacy draft store is NOT written on the hot path anymore.
    expect(await getRawBundle()).toBeUndefined();
  });

  it("putRawBundle writes the project store once (no legacy amplification)", async () => {
    await putRawBundle(legacyBundle);
    expect(await getRawProjectBundle("legacy-project")).toEqual(legacyBundle);
    expect(await getRawBundle()).toBeUndefined();
  });

  it("imports a legacy-only draft exactly once, then no longer depends on legacy", async () => {
    // Seed a legacy draft with no project-store record (a pre-v4 upgrader).
    const db = await openDB(REPORT_SUPPORTER_DB_NAME, 4, {
      upgrade(database, _oldVersion, _newVersion, transaction) {
        for (const store of ["drafts", "project-bundles", "project-summaries", "settings", "recovery-items", "export-history", "snapshots"]) {
          if (!database.objectStoreNames.contains(store)) {
            if (store === "drafts" || store === "project-bundles" || store === "settings") database.createObjectStore(store);
            else database.createObjectStore(store, { keyPath: "id" });
          }
        }
        transaction.objectStore("drafts").put(legacyBundle, "current");
      },
    });
    db.close();
    await resetIdbConnectionForTests();

    const first = await loadProjectBundle("legacy-project");
    expect(first.status).toBe("loaded");
    // The import copied it into the canonical store.
    expect(await getRawProjectBundle("legacy-project")).toBeDefined();

    // Second load reads only the project store (legacy no longer required).
    const second = await loadProjectBundle("legacy-project");
    expect(second.status).toBe("loaded");
  });
});
