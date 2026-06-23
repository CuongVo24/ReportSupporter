// Draft autosave: throttle (OptimizePerformance §5) + zod-validated load/save.
import { getRawBundle, putRawBundle } from "@/lib/idb-client";
import { storedBundleSchema } from "@/types";
import type { ReportProjectBundle } from "@/types";

/**
 * Coalesce rapid `schedule` calls into a single trailing `save` after `delayMs`
 * of quiet. Pure & injectable (no IndexedDB) so it is unit-testable with fake timers.
 */
export function createThrottledSaver<T>(
  save: (value: T) => void | Promise<void>,
  delayMs = 2000,
): { schedule: (value: T) => void; flush: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;

  const run = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending) {
      const { value } = pending;
      pending = null;
      void save(value);
    }
  };

  return {
    schedule(value: T) {
      pending = { value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, delayMs);
    },
    flush() {
      run();
    },
  };
}

/** Load + validate the persisted bundle. Returns `null` if absent or shape-invalid. */
export async function loadBundle(): Promise<ReportProjectBundle | null> {
  const raw = await getRawBundle();
  if (raw === undefined) return null;
  const parsed = storedBundleSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Persist a bundle to IndexedDB (may throw `QuotaExceededError`). */
export async function saveBundle(bundle: ReportProjectBundle): Promise<void> {
  await putRawBundle(bundle);
}
