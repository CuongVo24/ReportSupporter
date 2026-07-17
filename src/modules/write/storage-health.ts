export type StorageHealth = {
  usage: number;
  quota: number;
  ratio: number;
  level: "ok" | "warning" | "critical";
  persisted: boolean;
};

export async function getStorageHealth(): Promise<StorageHealth | null> {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;
  const ratio = quota > 0 ? usage / quota : 0;
  return {
    usage,
    quota,
    ratio,
    level: ratio >= 0.9 ? "critical" : ratio >= 0.8 ? "warning" : "ok",
    persisted: await navigator.storage.persisted?.() ?? false,
  };
}

export async function requestPersistentStorage(): Promise<boolean> {
  return navigator.storage?.persist ? navigator.storage.persist() : false;
}
