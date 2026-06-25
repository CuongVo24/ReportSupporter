import type { ExportJob } from "@/types";
import { appendExportHistory, getExportHistory, deleteExportHistory } from "@/lib/idb-client";
import { exportJobSchema } from "./schemas";

/**
 * Records an export job to local history store (IndexedDB).
 * Caps history records to a maximum of 50, pruning older items.
 * Failures in IndexedDB write do not throw to avoid disrupting the export flow.
 */
export async function recordExport(job: ExportJob): Promise<void> {
  try {
    // 1. Append the new job
    await appendExportHistory(job);

    // 2. Read and cap the history
    const rawList = await getExportHistory();
    const validJobs: ExportJob[] = [];
    const invalidIds: string[] = [];

    for (const item of rawList) {
      const parsed = exportJobSchema.safeParse(item);
      if (parsed.success) {
        validJobs.push(parsed.data);
      } else {
        // Track invalid records to prune them
        const id = (item && typeof item === "object" && "id" in item) ? (item as Record<string, unknown>).id : null;
        if (typeof id === "string") {
          invalidIds.push(id);
        }
      }
    }

    // Clean up invalid records
    for (const id of invalidIds) {
      await deleteExportHistory(id);
    }

    // Sort by startedAt ascending (oldest first)
    validJobs.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    // Prune down to 50 items
    if (validJobs.length > 50) {
      const toPruneCount = validJobs.length - 50;
      const toPrune = validJobs.slice(0, toPruneCount);
      for (const item of toPrune) {
        await deleteExportHistory(item.id);
      }
    }
  } catch (err) {
    console.error("Failed to record export history:", err);
  }
}

/**
 * Loads all valid export history items from IndexedDB, sorted from newest to oldest.
 */
export async function loadExportHistory(): Promise<ExportJob[]> {
  try {
    const rawList = await getExportHistory();
    const validJobs: ExportJob[] = [];

    for (const item of rawList) {
      const parsed = exportJobSchema.safeParse(item);
      if (parsed.success) {
        validJobs.push(parsed.data);
      }
    }

    // Sort by startedAt descending (newest first)
    validJobs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return validJobs;
  } catch (err) {
    console.error("Failed to load export history:", err);
    return [];
  }
}
