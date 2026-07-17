// Draft autosave: throttle (OptimizePerformance §5) + zod-validated load/save.
import { getRawBundle, putRawBundle } from "@/lib/idb-client";
import { SCHEMA_VERSION, storedBundleSchema } from "@/types";
import type { ReportProjectBundle } from "@/types";

/**
 * Coalesce rapid `schedule` calls into a single trailing `save` after `delayMs`
 * of quiet. Pure & injectable (no IndexedDB) so it is unit-testable with fake timers.
 */
export function createThrottledSaver<T>(
  save: (value: T) => void | Promise<void>,
  delayMs = 2000,
): { schedule: (value: T) => void; flush: () => Promise<void> } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;
  let queue: Promise<void> = Promise.resolve();
  let latestOperation: Promise<void> | null = null;

  const run = (): Promise<void> => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending) {
      const { value } = pending;
      pending = null;
      const operation = queue.then(() => save(value));
      queue = operation.catch(() => undefined);
      latestOperation = operation;
      void operation.finally(() => {
        if (latestOperation === operation) latestOperation = null;
      }).catch(() => undefined);
      return operation;
    }
    return latestOperation ?? queue;
  };

  return {
    schedule(value: T) {
      pending = { value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void run().catch(() => undefined);
      }, delayMs);
    },
    async flush() {
      await run();
    },
  };
}

export type LoadBundleResult =
  | { status: "missing" }
  | { status: "loaded"; bundle: ReportProjectBundle }
  | { status: "invalid"; raw: unknown; issues: string[] };

export function migrateBundle(bundle: ReportProjectBundle): ReportProjectBundle {
  return {
    ...bundle,
    schemaVersion: SCHEMA_VERSION,
    project: {
      ...bundle.project,
      sections: bundle.project.sections.map((section) => ({
        ...section,
        revision: Number.isInteger(section.revision) && section.revision >= 0 ? section.revision : 0,
      })),
    },
  };
}

/** Load and validate persisted data without conflating an invalid draft with an absent one. */
export async function loadBundle(): Promise<LoadBundleResult> {
  const raw = await getRawBundle();
  if (raw === undefined) return { status: "missing" };
  const parsed = storedBundleSchema.safeParse(raw);
  if (parsed.success) return { status: "loaded", bundle: migrateBundle(parsed.data) };
  return {
    status: "invalid",
    raw,
    issues: parsed.error.issues.map((issue) => {
      const path = issue.path.map(String).join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    }),
  };
}

/** Persist a bundle to IndexedDB (may throw `QuotaExceededError`). */
export async function saveBundle(bundle: ReportProjectBundle): Promise<void> {
  await putRawBundle(migrateBundle(bundle));
}
