import {
  deleteSnapshotRecords,
  getSnapshotRecord,
  getSnapshotRecords,
  putSnapshotRecord,
  replaceSnapshotRecords,
} from "@/lib/idb-client";
import { storedBundleSchema } from "@/types";
import type { ReportProjectBundle } from "@/types";

export const MAX_PROJECT_SNAPSHOTS = 10;

export type ReportSnapshot = {
  id: string;
  projectId: string;
  takenAt: string;
  reason: string;
  bundle: ReportProjectBundle;
};

export type SnapshotStore = {
  putSnapshot(snapshot: ReportSnapshot): Promise<void>;
  getSnapshot(id: string): Promise<unknown | undefined | null>;
  getSnapshots(projectId: string): Promise<unknown[]>;
  replaceSnapshots(projectId: string, snapshots: ReportSnapshot[]): Promise<void>;
  // W24-M (S2): delete only surplus records instead of clear+rewrite-kept.
  deleteSnapshots?(ids: string[]): Promise<void>;
};

/** Lightweight snapshot metadata — no bundle payload retained (W24-M S3). */
export type SnapshotMetadata = {
  id: string;
  projectId: string;
  takenAt: string;
  reason: string;
};

type SnapshotOptions = {
  store?: SnapshotStore;
  now?: () => Date;
  createId?: () => string;
  max?: number;
};

const idbSnapshotStore: SnapshotStore = {
  putSnapshot: putSnapshotRecord,
  getSnapshot: getSnapshotRecord,
  getSnapshots: getSnapshotRecords,
  replaceSnapshots: replaceSnapshotRecords,
  deleteSnapshots: deleteSnapshotRecords,
};

function getDefaultStore(store?: SnapshotStore) {
  return store ?? idbSnapshotStore;
}

function createSnapshotId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `snapshot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createSnapshotRecord(
  bundle: ReportProjectBundle,
  reason: string,
  now = new Date(),
  id = createSnapshotId(),
): ReportSnapshot {
  return {
    id,
    projectId: bundle.project.id,
    takenAt: now.toISOString(),
    reason: reason.trim() || "Snapshot",
    bundle,
  };
}

export function parseSnapshotRecord(raw: unknown): ReportSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<ReportSnapshot>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.projectId !== "string" ||
    typeof candidate.takenAt !== "string" ||
    typeof candidate.reason !== "string"
  ) {
    return null;
  }

  const parsedBundle = storedBundleSchema.safeParse(candidate.bundle);
  if (!parsedBundle.success || parsedBundle.data.project.id !== candidate.projectId) {
    return null;
  }

  return {
    id: candidate.id,
    projectId: candidate.projectId,
    takenAt: candidate.takenAt,
    reason: candidate.reason,
    bundle: parsedBundle.data,
  };
}

export function sortSnapshotsNewestFirst(snapshots: ReportSnapshot[]): ReportSnapshot[] {
  return [...snapshots].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export function pruneSnapshotRecords(
  snapshots: ReportSnapshot[],
  max = MAX_PROJECT_SNAPSHOTS,
): ReportSnapshot[] {
  if (max <= 0) return [];
  return sortSnapshotsNewestFirst(snapshots).slice(0, max);
}

export async function takeSnapshot(
  bundle: ReportProjectBundle,
  reason: string,
  options: SnapshotOptions = {},
): Promise<ReportSnapshot> {
  const store = getDefaultStore(options.store);
  const snapshot = createSnapshotRecord(
    bundle,
    reason,
    options.now?.() ?? new Date(),
    options.createId?.() ?? createSnapshotId(),
  );

  await store.putSnapshot(snapshot);
  await pruneSnapshots(bundle.project.id, options.max ?? MAX_PROJECT_SNAPSHOTS, { store });
  return snapshot;
}

export async function listSnapshots(
  projectId: string,
  options: Pick<SnapshotOptions, "store"> = {},
): Promise<ReportSnapshot[]> {
  const rawSnapshots = await getDefaultStore(options.store).getSnapshots(projectId);
  return sortSnapshotsNewestFirst(
    rawSnapshots
      .map(parseSnapshotRecord)
      .filter((snapshot): snapshot is ReportSnapshot => snapshot !== null),
  );
}

/** Read only the metadata needed to render a history list — the bundle payload
 * is NOT Zod-parsed or retained (W24-M S3). Heap scales with the number of
 * snapshots, not with total asset bytes. */
export async function listSnapshotMetadata(
  projectId: string,
  options: Pick<SnapshotOptions, "store"> = {},
): Promise<SnapshotMetadata[]> {
  const rawSnapshots = await getDefaultStore(options.store).getSnapshots(projectId);
  const metadata: SnapshotMetadata[] = [];
  for (const raw of rawSnapshots) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as Partial<ReportSnapshot>;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.projectId !== "string" ||
      typeof candidate.takenAt !== "string"
    ) continue;
    metadata.push({
      id: candidate.id,
      projectId: candidate.projectId,
      takenAt: candidate.takenAt,
      reason: typeof candidate.reason === "string" ? candidate.reason : "Snapshot",
    });
  }
  return metadata.sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export async function restoreSnapshot(
  id: string,
  options: Pick<SnapshotOptions, "store"> = {},
): Promise<ReportProjectBundle | null> {
  const raw = await getDefaultStore(options.store).getSnapshot(id);
  const snapshot = parseSnapshotRecord(raw);
  return snapshot?.bundle ?? null;
}

export async function pruneSnapshots(
  projectId: string,
  max = MAX_PROJECT_SNAPSHOTS,
  options: Pick<SnapshotOptions, "store"> = {},
): Promise<ReportSnapshot[]> {
  const store = getDefaultStore(options.store);
  // W24-M (S2): read metadata (not full bundles) to decide what to prune, then
  // DELETE only the surplus-oldest records. Avoids the previous
  // getAll -> clear -> rewrite-kept, which re-wrote ~9 full 5 MiB bundles on
  // every 11th snapshot. Falls back to replaceSnapshots for stores that predate
  // the incremental deleteSnapshots primitive (e.g. legacy fakes).
  const metadata = await listSnapshotMetadata(projectId, { store });
  const keptIds = new Set(metadata.slice(0, Math.max(0, max)).map((meta) => meta.id));
  const surplusIds = metadata.filter((meta) => !keptIds.has(meta.id)).map((meta) => meta.id);

  if (store.deleteSnapshots) {
    if (surplusIds.length > 0) await store.deleteSnapshots(surplusIds);
  } else {
    const kept = pruneSnapshotRecords(await listSnapshots(projectId, { store }), max);
    await store.replaceSnapshots(projectId, kept);
    return kept;
  }
  return pruneSnapshotRecords(await listSnapshots(projectId, { store }), max);
}
