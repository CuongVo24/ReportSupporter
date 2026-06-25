import type { ExportJob } from "@/types";
import { getExportHistory, clearExportHistory as clearDbHistory, replaceExportHistory } from "@/lib/idb-client";
import { exportJobSchema } from "./schemas";

/**
 * Clears all local export history records from IndexedDB.
 */
export async function clearExportHistory(): Promise<void> {
  try {
    await clearDbHistory();
  } catch (err) {
    console.error("Failed to clear export history:", err);
  }
}

/**
 * Records an export job to local history store (IndexedDB).
 * Caps history records to a maximum of 50, pruning older items.
 * Failures in IndexedDB write do not throw to avoid disrupting the export flow.
 */
export async function recordExport(job: ExportJob): Promise<void> {
  try {
    // 1. Read history
    const rawList = await getExportHistory();
    const validJobs: ExportJob[] = [];

    // Parse and keep only valid entries
    for (const item of rawList) {
      const parsed = exportJobSchema.safeParse(item);
      if (parsed.success) {
        validJobs.push(parsed.data);
      }
    }

    // Append the new job
    validJobs.push(job);

    // Sort by startedAt ascending (oldest first)
    validJobs.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    // Prune down to 50 items
    const capped = validJobs.slice(-50);

    // 2. Atomic replacement in transaction
    await replaceExportHistory(capped);
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
