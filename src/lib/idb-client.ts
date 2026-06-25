// IndexedDB wrapper for local draft persistence (TechnicalStack §5, idb).
// Single-current-draft PoC for W1 Group D; multi-project store is a later concern.
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "reportsupporter";
const STORE = "drafts";
const CURRENT_KEY = "current";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw new Error("IndexedDB is not available on server side");
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
        if (!db.objectStoreNames.contains("export-history")) {
          db.createObjectStore("export-history", { keyPath: "id" });
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

/** Append a record to export history store. */
export async function appendExportHistory(entry: unknown): Promise<void> {
  const db = await getDb();
  await db.put("export-history", entry);
}

/** Get all records from export history store. Returns raw array. Caller validates. */
export async function getExportHistory(): Promise<unknown[]> {
  const db = await getDb();
  return db.getAll("export-history");
}

/** Delete a record from export history store by its ID. */
export async function deleteExportHistory(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("export-history", id);
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
