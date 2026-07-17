import {
  deleteProjectRecords,
  deleteRecoveryItemRecord,
  getAllSnapshotRecords,
  getProjectSummaryRecord,
  getProjectSummaryRecords,
  getRawProjectBundle,
  getRecoveryItemRecords,
  putProjectRecord,
  putProjectSummaryRecord,
  putRecoveryItemRecord,
} from "@/lib/idb-client";
import { storedBundleSchema } from "@/types";
import type { ProjectSummary, RecoveryItem, ReportProjectBundle } from "@/types";
import { migrateBundle, type LoadBundleResult } from "./autosave";

function createId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseSummary(raw: unknown): ProjectSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<ProjectSummary>;
  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.templateId !== "string" ||
    typeof value.updatedAt !== "string"
  ) return null;
  return {
    id: value.id,
    title: value.title,
    templateId: value.templateId,
    sectionCount: typeof value.sectionCount === "number" ? value.sectionCount : 0,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : value.updatedAt,
    updatedAt: value.updatedAt,
    lastOpenedAt: typeof value.lastOpenedAt === "string" ? value.lastOpenedAt : value.updatedAt,
    deletedAt: typeof value.deletedAt === "string" ? value.deletedAt : undefined,
  };
}

function parseRecoveryItem(raw: unknown): RecoveryItem | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<RecoveryItem>;
  if (
    typeof value.id !== "string" ||
    !["invalid-draft", "orphaned-snapshot", "autosave-error"].includes(String(value.kind)) ||
    typeof value.title !== "string" ||
    typeof value.detail !== "string" ||
    typeof value.createdAt !== "string"
  ) return null;
  return value as RecoveryItem;
}

export function projectSummaryFromBundle(
  bundle: ReportProjectBundle,
  existing?: ProjectSummary | null,
  now = new Date(),
): ProjectSummary {
  const timestamp = now.toISOString();
  return {
    id: bundle.project.id,
    title: bundle.project.title,
    templateId: bundle.project.templateId,
    sectionCount: bundle.project.sections.length,
    createdAt: existing?.createdAt ?? bundle.project.updatedAt ?? timestamp,
    updatedAt: bundle.project.updatedAt,
    lastOpenedAt: existing?.lastOpenedAt ?? timestamp,
    deletedAt: existing?.deletedAt,
  };
}

export async function saveProjectBundle(bundle: ReportProjectBundle): Promise<void> {
  const migrated = migrateBundle(bundle);
  const existing = parseSummary(await getProjectSummaryRecord(bundle.project.id));
  await putProjectRecord(migrated, projectSummaryFromBundle(migrated, existing));
}

export async function loadProjectBundle(projectId: string): Promise<LoadBundleResult> {
  const raw = await getRawProjectBundle(projectId);
  if (raw === undefined) return { status: "missing" };
  const parsed = storedBundleSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => {
      const path = issue.path.map(String).join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    await putRecoveryItemRecord({
      id: `invalid-draft-${projectId}`,
      kind: "invalid-draft",
      projectId,
      title: "Bản thảo dự án không hợp lệ",
      detail: issues.join("; "),
      createdAt: new Date().toISOString(),
      payload: raw,
    } satisfies RecoveryItem);
    return { status: "invalid", raw, issues };
  }
  const bundle = migrateBundle(parsed.data);
  const current = parseSummary(await getProjectSummaryRecord(projectId));
  await putProjectSummaryRecord({
    ...projectSummaryFromBundle(bundle, current),
    lastOpenedAt: new Date().toISOString(),
  });
  return { status: "loaded", bundle };
}

export async function listProjectSummaries(): Promise<ProjectSummary[]> {
  const summaries = (await getProjectSummaryRecords())
    .map(parseSummary)
    .filter((summary): summary is ProjectSummary => summary !== null);
  return summaries.sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt));
}

export async function trashProject(projectId: string): Promise<void> {
  const summary = parseSummary(await getProjectSummaryRecord(projectId));
  if (!summary) return;
  await putProjectSummaryRecord({ ...summary, deletedAt: new Date().toISOString() });
}

export async function restoreProjectFromTrash(projectId: string): Promise<void> {
  const summary = parseSummary(await getProjectSummaryRecord(projectId));
  if (!summary) return;
  const active = { ...summary };
  delete active.deletedAt;
  await putProjectSummaryRecord({ ...active, lastOpenedAt: new Date().toISOString() });
}

export async function permanentlyDeleteProject(projectId: string): Promise<void> {
  await deleteProjectRecords(projectId);
}

export async function duplicateProjectBundle(projectId: string): Promise<ReportProjectBundle | null> {
  const loaded = await loadProjectBundle(projectId);
  if (loaded.status !== "loaded") return null;
  const now = new Date().toISOString();
  const duplicate: ReportProjectBundle = structuredClone(loaded.bundle);
  duplicate.project.id = createId("project");
  duplicate.project.title = `${loaded.bundle.project.title} (bản sao)`;
  duplicate.project.updatedAt = now;
  await saveProjectBundle(duplicate);
  return duplicate;
}

export async function listRecoveryItems(): Promise<RecoveryItem[]> {
  return (await getRecoveryItemRecords())
    .map(parseRecoveryItem)
    .filter((item): item is RecoveryItem => item !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function scanOrphanedSnapshots(): Promise<void> {
  const summaryIds = new Set((await getProjectSummaryRecords())
    .map(parseSummary)
    .filter((summary): summary is ProjectSummary => summary !== null)
    .map((summary) => summary.id));
  const snapshots = await getAllSnapshotRecords();
  const orphanProjectIds = new Set<string>();
  for (const raw of snapshots) {
    if (!raw || typeof raw !== "object") continue;
    const projectId = (raw as { projectId?: unknown }).projectId;
    if (typeof projectId === "string" && !summaryIds.has(projectId)) orphanProjectIds.add(projectId);
  }
  for (const projectId of orphanProjectIds) {
    await putRecoveryItemRecord({
      id: `orphaned-snapshot-${projectId}`,
      kind: "orphaned-snapshot",
      projectId,
      title: "Có snapshot không còn dự án gốc",
      detail: "Snapshot được giữ lại để bạn tải dữ liệu trước khi xác nhận đã xử lý.",
      createdAt: new Date().toISOString(),
    } satisfies RecoveryItem);
  }
}

export async function addRecoveryItem(
  item: Omit<RecoveryItem, "id" | "createdAt"> & Partial<Pick<RecoveryItem, "id" | "createdAt">>,
): Promise<RecoveryItem> {
  const complete: RecoveryItem = {
    ...item,
    id: item.id ?? createId("recovery"),
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
  await putRecoveryItemRecord(complete);
  return complete;
}

export async function dismissRecoveryItem(id: string): Promise<void> {
  await deleteRecoveryItemRecord(id);
}
