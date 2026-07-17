import { openDB, type IDBPDatabase } from "idb";

export const REPORT_SUPPORTER_DB_NAME = "reportsupporter";
export const REPORT_SUPPORTER_DB_VERSION = 4;

const LEGACY_DRAFT_STORE = "drafts";
const LEGACY_CURRENT_KEY = "current";
const PROJECT_BUNDLE_STORE = "project-bundles";
const PROJECT_SUMMARY_STORE = "project-summaries";
const SETTINGS_STORE = "settings";
const RECOVERY_STORE = "recovery-items";
const EXPORT_HISTORY_STORE = "export-history";
const SNAPSHOT_STORE = "snapshots";
const SNAPSHOT_PROJECT_INDEX = "by-project";

let dbPromise: Promise<IDBPDatabase> | null = null;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function summaryFromBundle(value: unknown): Record<string, unknown> | null {
  const bundle = asRecord(value);
  const project = asRecord(bundle?.project);
  if (!project) return null;
  const id = typeof project.id === "string" ? project.id : null;
  if (!id) return null;
  const updatedAt = typeof project.updatedAt === "string" ? project.updatedAt : new Date().toISOString();
  return {
    id,
    title: typeof project.title === "string" ? project.title : "Dự án chưa đặt tên",
    templateId: typeof project.templateId === "string" ? project.templateId : "software-project",
    sectionCount: Array.isArray(project.sections) ? project.sections.length : 0,
    createdAt: updatedAt,
    updatedAt,
    lastOpenedAt: updatedAt,
  };
}

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw new Error("IndexedDB is not available on server side");
  }
  if (!dbPromise) {
    dbPromise = openDB(REPORT_SUPPORTER_DB_NAME, REPORT_SUPPORTER_DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains(LEGACY_DRAFT_STORE)) db.createObjectStore(LEGACY_DRAFT_STORE);
        if (!db.objectStoreNames.contains(EXPORT_HISTORY_STORE)) {
          db.createObjectStore(EXPORT_HISTORY_STORE, { keyPath: "id" });
        }
        const snapshotStore = db.objectStoreNames.contains(SNAPSHOT_STORE)
          ? transaction.objectStore(SNAPSHOT_STORE)
          : db.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
        if (!snapshotStore.indexNames.contains(SNAPSHOT_PROJECT_INDEX)) {
          snapshotStore.createIndex(SNAPSHOT_PROJECT_INDEX, "projectId");
        }
        if (!db.objectStoreNames.contains(PROJECT_BUNDLE_STORE)) db.createObjectStore(PROJECT_BUNDLE_STORE);
        if (!db.objectStoreNames.contains(PROJECT_SUMMARY_STORE)) {
          db.createObjectStore(PROJECT_SUMMARY_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) db.createObjectStore(SETTINGS_STORE);
        if (!db.objectStoreNames.contains(RECOVERY_STORE)) {
          const recovery = db.createObjectStore(RECOVERY_STORE, { keyPath: "id" });
          recovery.createIndex("by-project", "projectId");
        }

        // v3 -> v4 is one upgrade transaction. The legacy record is deliberately
        // retained for one release so a rollback can still open the current draft.
        if (oldVersion < 4) {
          const legacy = await transaction.objectStore(LEGACY_DRAFT_STORE).get(LEGACY_CURRENT_KEY);
          const summary = summaryFromBundle(legacy);
          if (summary) {
            const projectId = summary.id as string;
            await transaction.objectStore(PROJECT_BUNDLE_STORE).put(legacy, projectId);
            await transaction.objectStore(PROJECT_SUMMARY_STORE).put(summary);
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function resetIdbConnectionForTests(): Promise<void> {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
}

export async function getRawBundle(): Promise<unknown> {
  const db = await getDb();
  return db.get(LEGACY_DRAFT_STORE, LEGACY_CURRENT_KEY);
}

export async function putRawBundle(value: unknown): Promise<void> {
  const db = await getDb();
  const summary = summaryFromBundle(value);
  const stores = summary
    ? [LEGACY_DRAFT_STORE, PROJECT_BUNDLE_STORE, PROJECT_SUMMARY_STORE]
    : [LEGACY_DRAFT_STORE];
  const tx = db.transaction(stores, "readwrite");
  await tx.objectStore(LEGACY_DRAFT_STORE).put(value, LEGACY_CURRENT_KEY);
  if (summary) {
    const projectId = summary.id as string;
    const existing = await tx.objectStore(PROJECT_SUMMARY_STORE).get(projectId) as Record<string, unknown> | undefined;
    await tx.objectStore(PROJECT_BUNDLE_STORE).put(value, projectId);
    await tx.objectStore(PROJECT_SUMMARY_STORE).put({
      ...existing,
      ...summary,
      createdAt: existing?.createdAt ?? summary.createdAt,
      lastOpenedAt: existing?.lastOpenedAt ?? summary.lastOpenedAt,
      deletedAt: existing?.deletedAt,
    });
  }
  await tx.done;
}

export async function getRawProjectBundle(projectId: string): Promise<unknown | undefined> {
  return (await getDb()).get(PROJECT_BUNDLE_STORE, projectId);
}

export async function putProjectRecord(bundle: unknown, summary: unknown): Promise<void> {
  const bundleSummary = summaryFromBundle(bundle);
  if (!bundleSummary) throw new Error("Project bundle is missing a valid project id.");
  const projectId = bundleSummary.id as string;
  const db = await getDb();
  const tx = db.transaction(
    [PROJECT_BUNDLE_STORE, PROJECT_SUMMARY_STORE, LEGACY_DRAFT_STORE],
    "readwrite",
  );
  await tx.objectStore(PROJECT_BUNDLE_STORE).put(bundle, projectId);
  await tx.objectStore(PROJECT_SUMMARY_STORE).put(summary);
  await tx.objectStore(LEGACY_DRAFT_STORE).put(bundle, LEGACY_CURRENT_KEY);
  await tx.done;
}

export async function getProjectSummaryRecords(): Promise<unknown[]> {
  return (await getDb()).getAll(PROJECT_SUMMARY_STORE);
}

export async function getProjectSummaryRecord(projectId: string): Promise<unknown | undefined> {
  return (await getDb()).get(PROJECT_SUMMARY_STORE, projectId);
}

export async function putProjectSummaryRecord(summary: unknown): Promise<void> {
  await (await getDb()).put(PROJECT_SUMMARY_STORE, summary);
}

export async function deleteProjectRecords(projectId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    [PROJECT_BUNDLE_STORE, PROJECT_SUMMARY_STORE, SNAPSHOT_STORE, RECOVERY_STORE],
    "readwrite",
  );
  await tx.objectStore(PROJECT_BUNDLE_STORE).delete(projectId);
  await tx.objectStore(PROJECT_SUMMARY_STORE).delete(projectId);
  const snapshots = await tx.objectStore(SNAPSHOT_STORE).index(SNAPSHOT_PROJECT_INDEX).getAll(projectId);
  for (const snapshot of snapshots as Array<{ id?: unknown }>) {
    if (typeof snapshot.id === "string") await tx.objectStore(SNAPSHOT_STORE).delete(snapshot.id);
  }
  const recoveryItems = await tx.objectStore(RECOVERY_STORE).index("by-project").getAll(projectId);
  for (const item of recoveryItems as Array<{ id?: unknown }>) {
    if (typeof item.id === "string") await tx.objectStore(RECOVERY_STORE).delete(item.id);
  }
  await tx.done;
}

export async function getRecoveryItemRecords(): Promise<unknown[]> {
  return (await getDb()).getAll(RECOVERY_STORE);
}

export async function putRecoveryItemRecord(item: unknown): Promise<void> {
  await (await getDb()).put(RECOVERY_STORE, item);
}

export async function deleteRecoveryItemRecord(id: string): Promise<void> {
  await (await getDb()).delete(RECOVERY_STORE, id);
}

export async function getSettingRecord(key: string): Promise<unknown | undefined> {
  return (await getDb()).get(SETTINGS_STORE, key);
}

export async function putSettingRecord(key: string, value: unknown): Promise<void> {
  await (await getDb()).put(SETTINGS_STORE, value, key);
}

export async function getExportHistory(): Promise<unknown[]> {
  return (await getDb()).getAll(EXPORT_HISTORY_STORE);
}

export async function clearExportHistory(): Promise<void> {
  await (await getDb()).clear(EXPORT_HISTORY_STORE);
}

export async function replaceExportHistory(entries: unknown[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(EXPORT_HISTORY_STORE, "readwrite");
  const store = tx.objectStore(EXPORT_HISTORY_STORE);
  await store.clear();
  for (const entry of entries) await store.put(entry);
  await tx.done;
}

export async function putSnapshotRecord(snapshot: unknown): Promise<void> {
  await (await getDb()).put(SNAPSHOT_STORE, snapshot);
}

export async function getSnapshotRecord(id: string): Promise<unknown | undefined> {
  return (await getDb()).get(SNAPSHOT_STORE, id);
}

export async function getSnapshotRecords(projectId: string): Promise<unknown[]> {
  return (await getDb()).getAllFromIndex(SNAPSHOT_STORE, SNAPSHOT_PROJECT_INDEX, projectId);
}

export async function getAllSnapshotRecords(): Promise<unknown[]> {
  return (await getDb()).getAll(SNAPSHOT_STORE);
}

export async function replaceSnapshotRecords(projectId: string, snapshots: unknown[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(SNAPSHOT_STORE, "readwrite");
  const store = tx.objectStore(SNAPSHOT_STORE);
  const existing = await store.index(SNAPSHOT_PROJECT_INDEX).getAll(projectId);
  for (const snapshot of existing as Array<{ id?: unknown }>) {
    if (typeof snapshot.id === "string") await store.delete(snapshot.id);
  }
  for (const snapshot of snapshots) await store.put(snapshot);
  await tx.done;
}
