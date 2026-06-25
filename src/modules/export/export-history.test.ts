import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordExport, loadExportHistory } from "./export-history";
import type { ExportJob } from "@/types";
import * as idbClient from "@/lib/idb-client";

vi.mock("@/lib/idb-client", () => {
  let store: unknown[] = [];
  return {
    appendExportHistory: vi.fn(async (entry: unknown) => {
      const ent = entry as { id: string };
      const idx = store.findIndex(item => (item as { id: string }).id === ent.id);
      if (idx !== -1) {
        store[idx] = ent;
      } else {
        store.push(ent);
      }
    }),
    getExportHistory: vi.fn(async () => {
      return [...store];
    }),
    deleteExportHistory: vi.fn(async (id: string) => {
      store = store.filter(item => (item as { id: string }).id !== id);
    }),
    clearExportHistory: vi.fn(async () => {
      store = [];
    }),
    __setStore: (newStore: unknown[]) => {
      store = newStore;
    },
  };
});

describe("export-history", () => {
  const baseJob: ExportJob = {
    id: "job-1",
    target: "html",
    projectId: "proj-1",
    status: "done",
    startedAt: "2026-06-24T12:00:00.000Z",
    finishedAt: "2026-06-24T12:00:01.000Z",
    fileName: "report.html",
  };

  beforeEach(() => {
    (idbClient as unknown as { __setStore: (newStore: unknown[]) => void }).__setStore([]);
  });

  it("should record a valid export job successfully", async () => {
    await recordExport(baseJob);
    const history = await loadExportHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(baseJob);
  });

  it("should filter out invalid records when loading history", async () => {
    (idbClient as unknown as { __setStore: (newStore: unknown[]) => void }).__setStore([
      baseJob,
      { id: "invalid-job", target: "bad-target", status: "done" },
      { id: "another-invalid" },
    ]);

    const history = await loadExportHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(baseJob);
  });

  it("should sort loaded history from newest to oldest based on startedAt", async () => {
    const jobOlder: ExportJob = { ...baseJob, id: "job-old", startedAt: "2026-06-24T10:00:00.000Z" };
    const jobNewer: ExportJob = { ...baseJob, id: "job-new", startedAt: "2026-06-24T14:00:00.000Z" };
    const jobMiddle: ExportJob = { ...baseJob, id: "job-mid", startedAt: "2026-06-24T12:00:00.000Z" };

    await recordExport(jobMiddle);
    await recordExport(jobOlder);
    await recordExport(jobNewer);

    const history = await loadExportHistory();
    expect(history).toHaveLength(3);
    expect(history[0].id).toBe("job-new");
    expect(history[1].id).toBe("job-mid");
    expect(history[2].id).toBe("job-old");
  });

  it("should cap history at 50 records and prune older items", async () => {
    const jobs: ExportJob[] = [];
    for (let i = 1; i <= 60; i++) {
      jobs.push({
        ...baseJob,
        id: `job-${i}`,
        startedAt: new Date(2026, 5, 24, 12, i, 0).toISOString(),
      });
    }

    for (const job of jobs) {
      await recordExport(job);
    }

    const history = await loadExportHistory();
    expect(history).toHaveLength(50);
    expect(history[0].id).toBe("job-60");
    expect(history[49].id).toBe("job-11");
  });

  it("should clean up invalid/corrupt records from storage on recordExport", async () => {
    (idbClient as unknown as { __setStore: (newStore: unknown[]) => void }).__setStore([
      { id: "invalid-1", target: "garbage" },
      { text: "no-id-but-this" },
    ]);

    await recordExport(baseJob);

    const raw = await idbClient.getExportHistory();
    expect(raw).toHaveLength(2);
    expect(raw.find((item) => (item as { id?: string }).id === "invalid-1")).toBeUndefined();
    expect(raw.find((item) => (item as { id?: string }).id === "job-1")).toBeDefined();
  });

  it("should clear all records from history", async () => {
    const { clearExportHistory } = await import("./export-history");
    await recordExport(baseJob);
    let history = await loadExportHistory();
    expect(history).toHaveLength(1);

    await clearExportHistory();
    history = await loadExportHistory();
    expect(history).toHaveLength(0);
  });
});
