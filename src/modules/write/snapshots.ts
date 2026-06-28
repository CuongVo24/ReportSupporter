import {
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
  const kept = pruneSnapshotRecords(await listSnapshots(projectId, { store }), max);
  await store.replaceSnapshots(projectId, kept);
  return kept;
}
