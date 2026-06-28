// IndexedDB wrapper for local draft persistence (TechnicalStack §5, idb).
// Single-current-draft PoC for W1 Group D; multi-project store is a later concern.
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "reportsupporter";
const STORE = "drafts";
const CURRENT_KEY = "current";
const SNAPSHOT_STORE = "snapshots";
const SNAPSHOT_PROJECT_INDEX = "by-project";
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw new Error("IndexedDB is not available on server side");
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
        if (!db.objectStoreNames.contains("export-history")) {
          db.createObjectStore("export-history", { keyPath: "id" });
        }
        const snapshotStore = db.objectStoreNames.contains(SNAPSHOT_STORE)
          ? transaction.objectStore(SNAPSHOT_STORE)
          : db.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
        if (!snapshotStore.indexNames.contains(SNAPSHOT_PROJECT_INDEX)) {
          snapshotStore.createIndex(SNAPSHOT_PROJECT_INDEX, "projectId");
        }
      },
    });
  }
  return dbPromise;
}

/** Read the raw persisted draft. Returns `undefined` if none. Caller validates with zod. */
export async function getRawBundle(): Promise<unknown> {
  const db = await getDb();
  return db.get(STORE, CURRENT_KEY);
}

/** Persist the current draft. May throw `QuotaExceededError` when storage is full. */
export async function putRawBundle(value: unknown): Promise<void> {
  const db = await getDb();
  await db.put(STORE, value, CURRENT_KEY);
}

/** Get all records from export history store. Returns raw array. Caller validates. */
export async function getExportHistory(): Promise<unknown[]> {
  const db = await getDb();
  return db.getAll("export-history");
}

/** Clear all records from export history. */
export async function clearExportHistory(): Promise<void> {
  const db = await getDb();
  await db.clear("export-history");
}

/** Replace all history records in the export-history store inside a single transaction. */
export async function replaceExportHistory(entries: unknown[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("export-history", "readwrite");
  const store = tx.objectStore("export-history");
  await store.clear();
  for (const entry of entries) {
    await store.put(entry);
  }
  await tx.done;
}

/** Persist one snapshot record. Caller validates the record shape. */
export async function putSnapshotRecord(snapshot: unknown): Promise<void> {
  const db = await getDb();
  await db.put(SNAPSHOT_STORE, snapshot);
}

/** Read one raw snapshot record by id. Caller validates the record shape. */
export async function getSnapshotRecord(id: string): Promise<unknown | undefined> {
  const db = await getDb();
  return db.get(SNAPSHOT_STORE, id);
}

/** Read raw snapshot records for one project. Caller validates and sorts. */
export async function getSnapshotRecords(projectId: string): Promise<unknown[]> {
  const db = await getDb();
  return db.getAllFromIndex(SNAPSHOT_STORE, SNAPSHOT_PROJECT_INDEX, projectId);
}

/** Replace a project's snapshot records inside a single transaction. */
export async function replaceSnapshotRecords(projectId: string, snapshots: unknown[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(SNAPSHOT_STORE, "readwrite");
  const store = tx.objectStore(SNAPSHOT_STORE);
  const index = store.index(SNAPSHOT_PROJECT_INDEX);
  const existing = await index.getAll(projectId);
  for (const snapshot of existing as Array<{ id?: unknown }>) {
    if (typeof snapshot.id === "string") {
      await store.delete(snapshot.id);
    }
  }
  for (const snapshot of snapshots) {
    await store.put(snapshot);
  }
  await tx.done;
}
