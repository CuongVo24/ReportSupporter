"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectSummary, RecoveryItem } from "@/types";
import { createProjectFromTemplate } from "@/modules/write/create-project";
import { softwareProjectTemplate } from "@/modules/write/templates/software-project";
import {
  dismissRecoveryItem,
  duplicateProjectBundle,
  listProjectSummaries,
  listRecoveryItems,
  loadProjectBundle,
  permanentlyDeleteProject,
  restoreProjectFromTrash,
  saveProjectBundle,
  scanOrphanedSnapshots,
  trashProject,
} from "@/modules/write/project-store";
import { listSnapshots } from "@/modules/write/snapshots";
import { createProjectPackage, importProjectPackage } from "@/modules/write/project-package";
import { getStorageHealth, requestPersistentStorage, type StorageHealth } from "@/modules/write/storage-health";
import { getSettingRecord, putSettingRecord } from "@/lib/idb-client";
import { isFeatureEnabled } from "@/lib/feature-flags";
import styles from "./ProjectLibrary.module.css";

type LibraryTab = "projects" | "recent" | "trash" | "recovery";

export function ProjectLibrary() {
  const router = useRouter();
  const importRef = useRef<HTMLInputElement>(null);
  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [recoveryItems, setRecoveryItems] = useState<RecoveryItem[]>([]);
  const [tab, setTab] = useState<LibraryTab>("projects");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [backupReminder, setBackupReminder] = useState(false);

  const refresh = useCallback(async () => {
    try {
      await scanOrphanedSnapshots();
      const [projects, recovery] = await Promise.all([listProjectSummaries(), listRecoveryItems()]);
      setSummaries(projects);
      setRecoveryItems(recovery);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể đọc thư viện dự án.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    void getStorageHealth().then(setStorageHealth);
    void getSettingRecord("last-project-backup-at").then((value) => {
      const timestamp = typeof value === "string" ? Date.parse(value) : 0;
      setBackupReminder(!timestamp || Date.now() - timestamp >= 7 * 24 * 60 * 60 * 1_000);
    });
  }, []);

  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    let projects = summaries.filter((summary) => tab === "trash" ? Boolean(summary.deletedAt) : !summary.deletedAt);
    if (tab === "recent") projects = projects.slice(0, 6);
    if (normalized) {
      projects = projects.filter((summary) =>
        `${summary.title} ${summary.templateId}`.toLocaleLowerCase("vi").includes(normalized));
    }
    return projects;
  }, [query, summaries, tab]);

  const createProject = async () => {
    setBusy(true);
    try {
      const bundle = createProjectFromTemplate(softwareProjectTemplate);
      await saveProjectBundle(bundle);
      router.push(`/workspace/${encodeURIComponent(bundle.project.id)}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Không thể tạo dự án.");
      setBusy(false);
    }
  };

  const duplicate = async (projectId: string) => {
    setBusy(true);
    try {
      const bundle = await duplicateProjectBundle(projectId);
      if (bundle) await refresh();
      else setError("Không thể đọc dự án để nhân bản.");
    } finally {
      setBusy(false);
    }
  };

  const permanentDelete = async (summary: ProjectSummary) => {
    if (!window.confirm(`Xóa vĩnh viễn “${summary.title}”? Hành động này không thể hoàn tác.`)) return;
    await permanentlyDeleteProject(summary.id);
    await refresh();
  };

  const backupProject = async (summary: ProjectSummary) => {
    const loaded = await loadProjectBundle(summary.id);
    if (loaded.status !== "loaded") throw new Error("Không thể đọc dự án để backup.");
    const pkg = await createProjectPackage(loaded.bundle, await listSnapshots(summary.id));
    const url = URL.createObjectURL(pkg.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${summary.title.replace(/[^a-zA-Z0-9_-]+/gu, "-") || "project"}.rsproject`;
    anchor.click();
    URL.revokeObjectURL(url);
    await putSettingRecord("last-project-backup-at", new Date().toISOString());
    setBackupReminder(false);
    await requestPersistentStorage();
    setStorageHealth(await getStorageHealth());
  };

  const downloadRecovery = (item: RecoveryItem) => {
    const blob = new Blob([JSON.stringify(item.payload ?? item, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recovery-${item.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Thư viện dự án</h1>
          <p>Dữ liệu nằm trong trình duyệt này; không cần tài khoản hay đồng bộ đám mây.</p>
        </div>
        <div className={styles.cardActions}>
          <button className={styles.secondary} onClick={() => importRef.current?.click()}>Nhập .rsproject</button>
          {isFeatureEnabled("templateCatalog") && <button className={styles.secondary} onClick={() => router.push("/templates")}>Catalog mẫu</button>}
          <button className={styles.primary} onClick={() => void createProject()} disabled={busy}>+ Dự án mới</button>
        </div>
      </header>

      <section className={styles.content} aria-label="Thư viện dự án">
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist" aria-label="Chế độ thư viện">
            {(["projects", "recent", "trash", "recovery"] as const).map((value) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
              >
                {value === "projects" ? "Tất cả" : value === "recent" ? "Gần đây" : value === "trash" ? "Thùng rác" : `Khôi phục (${recoveryItems.length})`}
              </button>
            ))}
          </div>
          {tab !== "recovery" && (
            <input className={styles.search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên hoặc mẫu…" aria-label="Tìm dự án" />
          )}
        </div>

        {error && <p role="alert">{error}</p>}
        {storageHealth && storageHealth.level !== "ok" && (
          <p role="alert">Bộ nhớ trình duyệt đã dùng {(storageHealth.ratio * 100).toFixed(0)}% ({storageHealth.level === "critical" ? "mức 90%" : "mức 80%"}). Hãy xuất backup và dọn dữ liệu không cần thiết.</p>
        )}
        {backupReminder && <p role="status">Đã đến lịch nhắc backup hàng tuần. Hãy bấm “Backup” trên một dự án; ứng dụng sẽ không tự tải tệp.</p>}

        {tab === "recovery" ? (
          recoveryItems.length ? <div className={styles.recoveryList}>
            {recoveryItems.map((item) => (
              <article className={styles.recoveryCard} key={item.id}>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
                <p className={styles.meta}>{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                <div className={styles.recoveryActions}>
                  <button className={styles.secondary} onClick={() => downloadRecovery(item)}>Tải dữ liệu</button>
                  <button className={styles.secondary} onClick={async () => { await dismissRecoveryItem(item.id); await refresh(); }}>Đã xử lý</button>
                </div>
              </article>
            ))}
          </div> : <p className={styles.empty}>Không có dữ liệu cần khôi phục.</p>
        ) : visibleProjects.length ? (
          <div className={styles.grid}>
            {visibleProjects.map((summary) => (
              <article className={styles.card} key={summary.id}>
                <button className={styles.open} onClick={() => router.push(`/workspace/${encodeURIComponent(summary.id)}`)} disabled={Boolean(summary.deletedAt)}>
                  <h2>{summary.title}</h2>
                  <p className={styles.meta}>{summary.sectionCount} mục · cập nhật {new Date(summary.updatedAt).toLocaleString("vi-VN")}</p>
                </button>
                <div className={styles.cardActions}>
                  {summary.deletedAt ? <>
                    <button className={styles.secondary} onClick={async () => { await restoreProjectFromTrash(summary.id); await refresh(); }}>Khôi phục</button>
                    <button className={styles.danger} onClick={() => void permanentDelete(summary)}>Xóa vĩnh viễn</button>
                  </> : <>
                    <button className={styles.secondary} onClick={() => void duplicate(summary.id)} disabled={busy}>Nhân bản</button>
                    <button className={styles.secondary} onClick={() => void backupProject(summary).catch((backupError) => setError(backupError instanceof Error ? backupError.message : "Backup thất bại."))}>Backup</button>
                    <button className={styles.danger} onClick={async () => { await trashProject(summary.id); await refresh(); }}>Đưa vào Thùng rác</button>
                  </>}
                </div>
              </article>
            ))}
          </div>
        ) : <p className={styles.empty}>{tab === "trash" ? "Thùng rác đang trống; dự án sẽ không tự bị xóa." : "Chưa có dự án phù hợp."}</p>}
      </section>
      <input ref={importRef} hidden type="file" accept=".rsproject,application/zip" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          const bundle = await importProjectPackage(file);
          await refresh();
          router.push(`/workspace/${encodeURIComponent(bundle.project.id)}`);
        } catch (importError) {
          setError(importError instanceof Error ? importError.message : "Không thể nhập backup.");
        }
        event.target.value = "";
      }} />
    </main>
  );
}
