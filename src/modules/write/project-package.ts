import JSZip from "jszip";
import { putSnapshotRecord } from "@/lib/idb-client";
import { sha256Blob } from "@/modules/export/artifact-verification";
import { storedBundleSchema } from "@/types";
import type { ProjectPackageManifest, ReportProjectBundle } from "@/types";
import type { ReportSnapshot } from "./snapshots";
import { listProjectSummaries, saveProjectBundle } from "./project-store";
import { migrateBundle } from "./autosave";

function newId(): string {
  return crypto.randomUUID();
}

async function manifestFile(path: string, blob: Blob) {
  return { path, byteLength: blob.size, sha256: await sha256Blob(blob) };
}

export async function createProjectPackage(
  bundle: ReportProjectBundle,
  snapshots: ReportSnapshot[] = [],
): Promise<{ manifest: ProjectPackageManifest; blob: Blob }> {
  const zip = new JSZip();
  const files: ProjectPackageManifest["files"] = [];
  const bundleBlob = new Blob([JSON.stringify(migrateBundle(bundle))], { type: "application/json" });
  zip.file("bundle.json", await bundleBlob.arrayBuffer());
  files.push(await manifestFile("bundle.json", bundleBlob));
  for (const snapshot of snapshots) {
    const path = `snapshots/${snapshot.id}.json`;
    const blob = new Blob([JSON.stringify(snapshot)], { type: "application/json" });
    zip.file(path, await blob.arrayBuffer());
    files.push(await manifestFile(path, blob));
  }
  const manifest: ProjectPackageManifest = {
    format: "report-supporter-project",
    version: 1,
    projectId: bundle.project.id,
    exportedAt: new Date().toISOString(),
    includesSnapshots: snapshots.length > 0,
    files,
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  return {
    manifest,
    blob: await zip.generateAsync({ type: "blob", mimeType: "application/vnd.reportsupporter.project+zip" }),
  };
}

export async function parseProjectPackage(
  file: Blob,
  existingProjectIds: ReadonlySet<string> = new Set(),
): Promise<{ manifest: ProjectPackageManifest; bundle: ReportProjectBundle; snapshots: ReportSnapshot[] }> {
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (signature.join(",") !== "80,75,3,4") throw new Error(".rsproject không phải ZIP hợp lệ.");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const rawManifest = JSON.parse(await zip.file("manifest.json")?.async("string") || "null") as ProjectPackageManifest | null;
  if (!rawManifest || rawManifest.format !== "report-supporter-project" || rawManifest.version !== 1) {
    throw new Error("Manifest .rsproject không hợp lệ hoặc chưa được hỗ trợ.");
  }
  for (const expected of rawManifest.files) {
    const entry = zip.file(expected.path);
    if (!entry) throw new Error(`Gói dự án thiếu ${expected.path}.`);
    const bytes = await entry.async("uint8array");
    const blob = new Blob([Uint8Array.from(bytes).buffer]);
    if (blob.size !== expected.byteLength || await sha256Blob(blob) !== expected.sha256) {
      throw new Error(`Checksum không khớp cho ${expected.path}.`);
    }
  }
  const rawBundle = JSON.parse(await zip.file("bundle.json")?.async("string") || "null");
  const parsed = storedBundleSchema.safeParse(rawBundle);
  if (!parsed.success) throw new Error("bundle.json không đúng schema dự án.");
  const bundle = migrateBundle(parsed.data);
  const originalProjectId = bundle.project.id;
  if (existingProjectIds.has(originalProjectId)) bundle.project.id = newId();
  bundle.project.updatedAt = new Date().toISOString();
  const snapshots: ReportSnapshot[] = [];
  for (const expected of rawManifest.files.filter((entry) => entry.path.startsWith("snapshots/"))) {
    const raw = JSON.parse(await zip.file(expected.path)?.async("string") || "null") as ReportSnapshot | null;
    if (!raw || typeof raw.id !== "string" || !raw.bundle) continue;
    snapshots.push({
      ...raw,
      id: newId(),
      projectId: bundle.project.id,
      bundle: { ...migrateBundle(raw.bundle), project: { ...raw.bundle.project, id: bundle.project.id } },
    });
  }
  return { manifest: rawManifest, bundle, snapshots };
}

export async function importProjectPackage(file: File): Promise<ReportProjectBundle> {
  if (!file.name.toLocaleLowerCase("en-US").endsWith(".rsproject")) {
    throw new Error("Tệp backup phải dùng phần mở rộng .rsproject.");
  }
  const existingIds = new Set((await listProjectSummaries()).map((summary) => summary.id));
  const parsed = await parseProjectPackage(file, existingIds);
  await saveProjectBundle(parsed.bundle);
  for (const snapshot of parsed.snapshots) await putSnapshotRecord(snapshot);
  return parsed.bundle;
}
