// IndexedDB wrapper for local draft persistence (TechnicalStack §5, idb).
// Single-current-draft PoC for W1 Group D; multi-project store is a later concern.
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "reportsupporter";
const STORE = "drafts";
const CURRENT_KEY = "current";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
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
