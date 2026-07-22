// Deterministic performance fixtures for the canonical W24-O perf gate.
//
// These build fully-serializable ReportProjectBundle records (matching
// `storedBundleSchema`) plus summaries and snapshots, then seed them straight
// into the app's IndexedDB via `page.evaluate`. Seeding real records — instead
// of driving the UI — keeps the two fixtures byte-stable across runs so heap and
// timing deltas compare against the same input.
//
// small:  a light project (editor-ready fast path).
// large:  40 sections + ~5 MiB of image assets + 10 snapshots — the profiled
//         "cost center" that the fake-worker/reducer gates never exercised.
import type { Page } from "@playwright/test";

const DB_NAME = "reportsupporter";
const BUNDLE_STORE = "project-bundles";
const SUMMARY_STORE = "project-summaries";
const SNAPSHOT_STORE = "snapshots";

// Frozen so timing/heap deltas compare against identical input across runs.
const FIXED_ISO = "2026-01-01T00:00:00.000Z";

const DEFAULT_FORMAT_SETTINGS = {
  presetId: "academic-default",
  includeToc: true,
  includeListOfFigures: false,
  includeListOfTables: false,
  captionNumbering: "per-chapter",
  respectAuthorNumbering: true,
} as const;

const SCHEMA_VERSION = 2;

export type PerformanceSize = "small" | "large";

export type SeededProject = {
  projectId: string;
  bundle: unknown;
  summary: unknown;
  snapshots: unknown[];
};

function paragraph(seed: number): string {
  // Deterministic Vietnamese-ish filler so parse/render work is representative
  // without depending on Math.random.
  return `Phân tích mục ${seed}: dữ liệu, minh chứng và kết quả đo được. `.repeat(6);
}

function buildSections(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `section-${index}`,
    order: index,
    title: `Mục ${index + 1}`,
    markdown: `# Mục ${index + 1}\n\n${paragraph(index)}\n\n## Chi tiết\n\n${paragraph(index + 100)}`,
    status: "draft" as const,
    revision: 1,
  }));
}

// One ~625 KiB base64 blob reused by reference-identity across assets so the
// serialized fixture stays deterministic; 8 assets ≈ 5 MiB of asset payload.
function buildAssets(totalBytes: number) {
  if (totalBytes <= 0) return [];
  const perAsset = 625 * 1024;
  const count = Math.max(1, Math.round(totalBytes / perAsset));
  const base64 = "A".repeat(perAsset);
  return Array.from({ length: count }, (_, index) => ({
    id: `asset-${index}`,
    kind: "image" as const,
    fileName: `figure-${index}.png`,
    mimeType: "image/png",
    data: `data:image/png;base64,${base64}`,
    insertedAt: FIXED_ISO,
  }));
}

export function buildPerformanceProject(size: PerformanceSize): SeededProject {
  const projectId = `perf-${size}`;
  const sectionCount = size === "large" ? 40 : 4;
  const assetBytes = size === "large" ? 5 * 1024 * 1024 : 0;
  const sections = buildSections(sectionCount);
  const assets = buildAssets(assetBytes);

  const bundle = {
    project: {
      id: projectId,
      title: size === "large" ? "Báo cáo lớn (đo hiệu năng)" : "Báo cáo nhỏ (đo hiệu năng)",
      templateId: "software-project",
      metadata: {},
      sections,
      updatedAt: FIXED_ISO,
    },
    assets,
    evidence: [],
    formatSettings: DEFAULT_FORMAT_SETTINGS,
    schemaVersion: SCHEMA_VERSION,
  };

  const summary = {
    id: projectId,
    title: bundle.project.title,
    templateId: bundle.project.templateId,
    sectionCount,
    createdAt: FIXED_ISO,
    updatedAt: FIXED_ISO,
    lastOpenedAt: FIXED_ISO,
  };

  const snapshotCount = size === "large" ? 10 : 0;
  const snapshots = Array.from({ length: snapshotCount }, (_, index) => ({
    id: `${projectId}-snapshot-${index}`,
    projectId,
    takenAt: FIXED_ISO,
    reason: `Snapshot ${index + 1}`,
    bundle,
  }));

  return { projectId, bundle, summary, snapshots };
}

/**
 * Reset the app DB, then seed the fixture directly into IndexedDB.
 * Must be called after a first navigation so the app has created the DB/stores.
 */
export async function seedPerformanceProject(page: Page, fixture: SeededProject): Promise<void> {
  await page.goto("/");
  await page.evaluate(async (dbName) => {
    await new Promise<void>((resolve) => {
      const del = indexedDB.deleteDatabase(dbName);
      del.onsuccess = () => resolve();
      del.onerror = () => resolve();
      del.onblocked = () => resolve();
    });
  }, DB_NAME);
  // Reload so the app recreates the DB at the current version with all stores.
  await page.reload();
  await page.evaluate(async ({ dbName, bundleStore, summaryStore, snapshotStore, seed }) => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const open = indexedDB.open(dbName);
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([bundleStore, summaryStore, snapshotStore], "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(bundleStore).put(seed.bundle, seed.projectId);
      tx.objectStore(summaryStore).put(seed.summary);
      for (const snapshot of seed.snapshots) tx.objectStore(snapshotStore).put(snapshot);
    });
    db.close();
  }, {
    dbName: DB_NAME,
    bundleStore: BUNDLE_STORE,
    summaryStore: SUMMARY_STORE,
    snapshotStore: SNAPSHOT_STORE,
    seed: fixture as unknown as { projectId: string; bundle: unknown; summary: unknown; snapshots: unknown[] },
  });
}
