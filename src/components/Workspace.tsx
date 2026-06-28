"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { EditorPanel } from "@/components/EditorPanel";
import { PreviewPane } from "@/components/PreviewPane";
import { CommandPalette } from "@/components/CommandPalette";
import { buildWorkspaceCommands } from "@/components/command-registry";
import { SnapshotHistory } from "@/components/SnapshotHistory";
import { ReportHealthBadge } from "@/components/ReportHealthBadge";
import { Button, Tabs, TabsList, TabsTrigger, TabsContent, Toast, Dialog } from "@/components/ui";
import { Loader2, CheckCircle2, AlertTriangle, Sparkles, FileUp, Maximize2, Minimize2 } from "lucide-react";
import { LoadingSkeleton, EmptyState, EmptyReportHub } from "@/components/states";
import {
  createProjectFromTemplate,
  loadBundle,
  saveBundle,
  softwareProjectTemplate,
  ALL_TEMPLATES,
  ProjectInitializer,
  useDraftAutosave,
  useImageInsert,
  buildInitialSections,
  AiAssistBar,
  appendSections,
  replaceSections,
  MarkdownImportDropzone,
  importReadme,
  type MarkdownImportDraft,
  addSection,
  duplicateSection,
  renameSection,
  deleteSection,
  moveSection,
  moveSectionToIndex,
  createImageAsset,
  isMarkdownFile,
  readMarkdownFile,
  AiSettingsDialog,
  AiWholeReportPanel,
  registerAdapter,
  httpAdapter,
  loadAiConfig,
  isAiReady,
  listSnapshots,
  restoreSnapshot,
  takeSnapshot,
  computeWritingStats,
  type ReportSnapshot,
} from "@/modules/write";
import { CheckerPanel, computeReportHealth, runChecker, type ReportHealth } from "@/modules/check";
import { ExportPanel, SubmissionPanel, useExport } from "@/modules/export";
import { EvidencePanel } from "@/modules/evidence";
import { PresentPanel } from "@/modules/present";
import type { CheckResult, ReportProjectBundle, TemplateSchema, EvidenceItem, ReportSection } from "@/types";

const emptyCheckResult: CheckResult = {
  issues: [],
  grouped: { error: [], warning: [], info: [] },
  readinessScore: 100,
  ranAt: "",
};

type SidePanelTab = "check" | "evidence" | "export" | "submission" | "present";

function focusEditorOnNextFrame() {
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(".cm-content")?.focus();
  });
}

function appendMarkdown(existing: string, addition: string) {
  const trimmedAddition = addition.trim();
  if (!trimmedAddition) return existing;
  return `${existing.trimEnd()}${existing.trim() ? "\n\n" : ""}${trimmedAddition}`;
}

export function Workspace() {
  const [bundle, setBundle] = useState<ReportProjectBundle | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importDraft, setImportDraft] = useState<MarkdownImportDraft | null>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [isReplaceConfirmOpen, setIsReplaceConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [sectionToDeleteId, setSectionToDeleteId] = useState<string | null>(null);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [sideTab, setSideTab] = useState<SidePanelTab>("check");
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");
  const [openSidePanelSignal, setOpenSidePanelSignal] = useState(0);
  const [snapshots, setSnapshots] = useState<ReportSnapshot[]>([]);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [snapshotToRestore, setSnapshotToRestore] = useState<ReportSnapshot | null>(null);
  const [reportHealth, setReportHealth] = useState<ReportHealth | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const { status, quotaFull } = useDraftAutosave(bundle);
  const { handleImageInserted } = useImageInsert(setBundle);
  const { jobs, runExport, retry, exportedBlobs } = useExport(bundle ?? undefined);

  const requestSidePanelOpen = useCallback(() => {
    setOpenSidePanelSignal((signal) => signal + 1);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const existing = await loadBundle();
      const next = existing ?? createProjectFromTemplate(softwareProjectTemplate);
      if (!active) return;
      setBundle(next);
      setActiveId(next.project.sections[0]?.id ?? null);
      setIsInitializing(!existing || (
        next.project.title === softwareProjectTemplate.name &&
        Object.keys(next.project.metadata).length === 0
      ));
      if (!existing) void saveBundle(next);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const config = loadAiConfig();
    if (isAiReady(config)) {
      registerAdapter(httpAdapter);
    } else {
      registerAdapter(null);
    }
  }, [isAiSettingsOpen]);

  const refreshSnapshots = useCallback(async (projectId?: string) => {
    if (!projectId) {
      setSnapshots([]);
      return;
    }

    setIsSnapshotLoading(true);
    try {
      setSnapshots(await listSnapshots(projectId));
    } catch (error) {
      console.warn("Unable to load report snapshots", error);
      setSnapshots([]);
    } finally {
      setIsSnapshotLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSnapshots(bundle?.project.id);
  }, [bundle?.project.id, refreshSnapshots]);

  const snapshotBefore = useCallback(async (reason: string) => {
    if (!bundle) return;
    try {
      await takeSnapshot(bundle, reason);
      void refreshSnapshots(bundle.project.id);
    } catch (error) {
      console.warn("Unable to create report snapshot", error);
      setToastMessage("Không thể tạo bản lưu an toàn, thao tác vẫn tiếp tục.");
      setToastOpen(true);
    }
  }, [bundle, refreshSnapshots]);

  const activeSection = useMemo(
    () => bundle?.project.sections.find((sec) => sec.id === activeId) ?? null,
    [bundle, activeId],
  );
  const sectionWritingStats = useMemo(
    () => computeWritingStats(activeSection?.markdown ?? ""),
    [activeSection?.markdown],
  );
  const reportWritingStats = useMemo(
    () => computeWritingStats(bundle?.project.sections ?? []),
    [bundle?.project.sections],
  );

  useEffect(() => {
    if (!bundle) {
      setReportHealth(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setReportHealth(computeReportHealth(bundle, checkResult));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [bundle, checkResult]);

  const handleChange = useCallback((markdown: string) => {
    setBundle((prev) => {
      if (!prev || !activeId) return prev;
      const sections = prev.project.sections.map((sec) =>
        sec.id === activeId ? { ...sec, markdown } : sec,
      );
      return {
        ...prev,
        project: { ...prev.project, sections, updatedAt: new Date().toISOString() },
      };
    });
  }, [activeId]);

  const handleCheck = useCallback(() => {
    if (!bundle) return;
    const result = runChecker(bundle);
    setCheckResult(result);
    setHasRun(true);
    setSideTab("check");
    requestSidePanelOpen();
    setToastMessage(`Đã soát — ${result.issues.length} vấn đề`);
    setToastOpen(true);
  }, [bundle, requestSidePanelOpen]);

  const handleJump = useCallback((sectionId?: string) => {
    if (sectionId) {
      setActiveId(sectionId);
      setActiveView("editor");
      focusEditorOnNextFrame();
    }
  }, []);

  const handleOpenReportHealth = useCallback(() => {
    setSideTab("check");
    requestSidePanelOpen();
    handleJump(reportHealth?.weakestSectionId);
  }, [handleJump, reportHealth?.weakestSectionId, requestSidePanelOpen]);

  const handleManualSave = useCallback((markdown?: string) => {
    if (!bundle) return;
    let next = bundle;

    if (typeof markdown === "string" && activeId) {
      const sections = bundle.project.sections.map((sec) =>
        sec.id === activeId ? { ...sec, markdown } : sec,
      );
      next = {
        ...bundle,
        project: { ...bundle.project, sections, updatedAt: new Date().toISOString() },
      };
      setBundle(next);
    }

    void saveBundle(next)
      .then(() => {
        setToastMessage("Đã lưu nháp");
        setToastOpen(true);
      })
      .catch(() => {
        setToastMessage("Không thể lưu nháp");
        setToastOpen(true);
      });
  }, [activeId, bundle]);

  const handleCreateSection = useCallback(() => {
    if (!bundle) return;
    const currentIndex = bundle.project.sections.findIndex((section) => section.id === activeId);
    const insertAt = currentIndex >= 0 ? currentIndex + 1 : bundle.project.sections.length;
    
    const { sections, newSection } = addSection(bundle.project.sections, insertAt);

    const next = {
      ...bundle,
      project: {
        ...bundle.project,
        sections,
        updatedAt: new Date().toISOString(),
      },
    };

    setBundle(next);
    setActiveId(newSection.id);
    setActiveView("editor");
    focusEditorOnNextFrame();
  }, [activeId, bundle]);

  const handleDuplicateSection = useCallback(() => {
    if (!bundle || !activeSection) return;
    
    const { sections, duplicate } = duplicateSection(bundle.project.sections, activeSection);

    const next = {
      ...bundle,
      project: {
        ...bundle.project,
        sections,
        updatedAt: new Date().toISOString(),
      },
    };

    setBundle(next);
    setActiveId(duplicate.id);
    setActiveView("editor");
    focusEditorOnNextFrame();
  }, [activeSection, bundle]);

  const handleMoveSection = useCallback((direction: "up" | "down", id?: string) => {
    if (!bundle) return;
    const targetId = id || activeId;
    if (!targetId) return;

    const sections = moveSection(bundle.project.sections, targetId, direction);

    setBundle({
      ...bundle,
      project: {
        ...bundle.project,
        sections,
        updatedAt: new Date().toISOString(),
      },
    });
  }, [activeId, bundle]);

  const handleMoveSectionFromMenu = useCallback((id: string, direction: "up" | "down") => {
    handleMoveSection(direction, id);
  }, [handleMoveSection]);

  const handleReorderSection = useCallback((draggedId: string, overId: string) => {
    if (!bundle || draggedId === overId) return;
    const targetIndex = bundle.project.sections.findIndex((section) => section.id === overId);
    if (targetIndex < 0) return;

    const sections = moveSectionToIndex(bundle.project.sections, draggedId, targetIndex);
    const next = {
      ...bundle,
      project: {
        ...bundle.project,
        sections,
        updatedAt: new Date().toISOString(),
      },
    };

    setBundle(next);
    setActiveId(draggedId);
    void saveBundle(next);
  }, [bundle]);

  const handleSectionFilesDrop = useCallback(async (sectionId: string, files: File[]) => {
    if (!bundle) return;

    const imageFile = files.find((file) => file.type.startsWith("image/"));
    if (imageFile) {
      const result = await createImageAsset(imageFile, 5 * 1024 * 1024);
      if (!result.ok) {
        setToastMessage(result.error);
        setToastOpen(true);
        return;
      }

      const sections = bundle.project.sections.map((section) =>
        section.id === sectionId
          ? { ...section, markdown: appendMarkdown(section.markdown, result.ref) }
          : section,
      );
      const next: ReportProjectBundle = {
        ...bundle,
        assets: bundle.assets.some((asset) => asset.id === result.asset.id)
          ? bundle.assets
          : [...bundle.assets, result.asset],
        project: {
          ...bundle.project,
          sections,
          updatedAt: new Date().toISOString(),
        },
      };

      setBundle(next);
      setActiveId(sectionId);
      setActiveView("editor");
      setCheckResult(null);
      setHasRun(false);
      void saveBundle(next);
      setToastMessage("Da chen anh vao muc da tha.");
      setToastOpen(true);
      return;
    }

    const markdownFile = files.find((file) => isMarkdownFile(file));
    if (!markdownFile) {
      setToastMessage("Chi ho tro tha anh hoac file Markdown vao muc luc.");
      setToastOpen(true);
      return;
    }

    const result = await readMarkdownFile(markdownFile);
    if (!result.ok) {
      setToastMessage(result.error);
      setToastOpen(true);
      return;
    }

    const parsedSections = importReadme(result.markdown);
    const markdownToInsert = parsedSections.length > 0
      ? parsedSections.map((section) => section.markdown).join("\n\n")
      : result.markdown;
    const sections = bundle.project.sections.map((section) =>
      section.id === sectionId
        ? { ...section, markdown: appendMarkdown(section.markdown, markdownToInsert) }
        : section,
    );
    const next: ReportProjectBundle = {
      ...bundle,
      project: {
        ...bundle.project,
        sections,
        updatedAt: new Date().toISOString(),
      },
    };

    setBundle(next);
    setActiveId(sectionId);
    setActiveView("editor");
    setCheckResult(null);
    setHasRun(false);
    void saveBundle(next);
    setToastMessage("Da chen noi dung Markdown vao muc da tha.");
    setToastOpen(true);
  }, [bundle]);

  const handleRenameSection = useCallback((id: string, newTitle: string) => {
    if (!bundle) return;
    const sections = renameSection(bundle.project.sections, id, newTitle);

    setBundle({
      ...bundle,
      project: {
        ...bundle.project,
        sections,
        updatedAt: new Date().toISOString(),
      },
    });
  }, [bundle]);

  const executeDeleteSection = useCallback(async (id: string, shouldSnapshot = false) => {
    if (!bundle) return;
    const section = bundle.project.sections.find((s) => s.id === id);
    if (shouldSnapshot && section) {
      await snapshotBefore(`Trước khi xóa mục "${section.title}"`);
    }
    const sections = deleteSection(bundle.project.sections, id);

    let nextActiveId = activeId;
    if (activeId === id) {
      const currentIndex = bundle.project.sections.findIndex((s) => s.id === id);
      const neighbor = bundle.project.sections[currentIndex + 1] || bundle.project.sections[currentIndex - 1];
      nextActiveId = neighbor ? neighbor.id : null;
    }

    const nextBundle = {
      ...bundle,
      project: {
        ...bundle.project,
        sections,
        updatedAt: new Date().toISOString(),
      },
    };

    setBundle(nextBundle);
    setActiveId(nextActiveId);
    void saveBundle(nextBundle);
    setIsDeleteConfirmOpen(false);
    setSectionToDeleteId(null);
  }, [bundle, activeId, snapshotBefore]);

  const handleDeleteSection = useCallback((id: string) => {
    if (!bundle) return;
    const section = bundle.project.sections.find((s) => s.id === id);
    if (!section) return;

    const hasContent = section.markdown.trim() !== "";
    if (hasContent) {
      setSectionToDeleteId(id);
      setIsDeleteConfirmOpen(true);
    } else {
      void executeDeleteSection(id);
    }
  }, [bundle, executeDeleteSection]);

  const handleOpenPreview = useCallback(() => {
    setFocusMode(false);
    setActiveView("preview");
  }, []);

  const handleToggleFocusMode = useCallback(() => {
    setFocusMode((enabled) => {
      const next = !enabled;
      if (next) setActiveView("editor");
      return next;
    });
    focusEditorOnNextFrame();
  }, []);

  const handleOpenExport = useCallback(() => {
    setSideTab("export");
    requestSidePanelOpen();
  }, [requestSidePanelOpen]);

  const handleOpenMarkdownImport = useCallback(() => {
    setImportDraft(null);
    setImportMode("append");
    setIsImportDialogOpen(true);
  }, []);

  const handleOpenCreateReport = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  const handleCommandPaletteOpenChange = useCallback((open: boolean) => {
    setIsCommandPaletteOpen(open);
    if (!open) {
      focusEditorOnNextFrame();
    }
  }, []);

  const handleFocusEditor = useCallback(() => {
    setIsResetConfirmOpen(false);
    setIsCommandPaletteOpen(false);
    setActiveView("editor");
    focusEditorOnNextFrame();
  }, []);

  const handleInitialize = useCallback((
    template: TemplateSchema,
    title: string,
    metadata: Record<string, string | string[]>
  ) => {
    if (!bundle) return;
    const generatedSections = buildInitialSections(template, { title, ...metadata });

    const cleanMetadata = { ...metadata };
    delete cleanMetadata.readmeContent;

    const next: ReportProjectBundle = {
      ...bundle,
      project: {
        ...bundle.project,
        title,
        metadata: cleanMetadata,
        sections: generatedSections,
        updatedAt: new Date().toISOString(),
      },
    };
    setBundle(next);
    setActiveId(generatedSections[0]?.id ?? null);
    setIsInitializing(false);
  }, [bundle]);

  const handleStartBlank = useCallback(() => {
    if (!bundle) return;
    const blankSection: ReportSection = {
      id: crypto.randomUUID(),
      order: 0,
      title: "Nội dung",
      markdown: "",
      status: "draft",
    };

    const next: ReportProjectBundle = {
      ...bundle,
      project: {
        ...bundle.project,
        title: "Báo cáo chưa đặt tên",
        metadata: {},
        sections: [blankSection],
        updatedAt: new Date().toISOString(),
      },
    };
    
    setBundle(next);
    setActiveId(blankSection.id);
    setIsInitializing(false);
  }, [bundle]);

  const handleImportMarkdown = useCallback((draft: MarkdownImportDraft) => {
    if (!bundle) return;
    const parsedSections = importReadme(draft.markdown);
    
    const replaced = replaceSections(bundle, parsedSections);
    const next: ReportProjectBundle = {
      ...replaced,
      project: {
        ...replaced.project,
        title: draft.title || "Báo cáo chưa đặt tên",
      },
    };

    setBundle(next);
    setActiveId(next.project.sections[0]?.id ?? null);
    setIsInitializing(false);
    setCheckResult(null);
    setHasRun(false);
    void saveBundle(next);
  }, [bundle]);

  const handleApplyAiOutline = useCallback((sections: ReportSection[], title: string) => {
    if (!bundle) return;
    const replaced = replaceSections(bundle, sections);
    const next: ReportProjectBundle = {
      ...replaced,
      project: {
        ...replaced.project,
        title: title || "Báo cáo tạo từ AI",
      },
    };

    setBundle(next);
    setActiveId(next.project.sections[0]?.id ?? null);
    setIsInitializing(false);
    setCheckResult(null);
    setHasRun(false);
    void saveBundle(next);
  }, [bundle]);

  const handleReset = useCallback(async () => {
    await snapshotBefore("Trước khi tạo báo cáo mới");
    const fresh = createProjectFromTemplate(softwareProjectTemplate);
    setBundle(fresh);
    setActiveId(fresh.project.sections[0]?.id ?? null);
    setIsInitializing(true);
    setCheckResult(null);
    setHasRun(false);
    void saveBundle(fresh);
    setIsResetConfirmOpen(false);
  }, [snapshotBefore]);

  const handleAppendImport = useCallback(() => {
    if (!bundle || !importDraft) return;
    const parsedSections = importReadme(importDraft.markdown);
    if (parsedSections.length === 0) {
      setIsImportDialogOpen(false);
      setImportDraft(null);
      return;
    }

    const next = appendSections(bundle, parsedSections);
    const oldLength = bundle.project.sections.length;
    const firstNewSection = next.project.sections[oldLength];

    setBundle(next);
    if (firstNewSection) {
      setActiveId(firstNewSection.id);
      setActiveView("editor");
      focusEditorOnNextFrame();
    }
    setCheckResult(null);
    setHasRun(false);
    void saveBundle(next);

    setIsImportDialogOpen(false);
    setImportDraft(null);
    setToastMessage("Đã chèn thêm các mục báo cáo thành công.");
    setToastOpen(true);
  }, [bundle, importDraft]);

  const handleReplaceImport = useCallback(async () => {
    if (!bundle || !importDraft) return;
    const parsedSections = importReadme(importDraft.markdown);
    if (parsedSections.length === 0) {
      setIsReplaceConfirmOpen(false);
      setIsImportDialogOpen(false);
      setImportDraft(null);
      return;
    }

    await snapshotBefore("Trước khi ghi đè báo cáo bằng Markdown");
    const replaced = replaceSections(bundle, parsedSections);
    const next: ReportProjectBundle = {
      ...replaced,
      project: {
        ...replaced.project,
        title: importDraft.title || replaced.project.title,
      },
    };
    setBundle(next);
    setActiveId(next.project.sections[0]?.id ?? null);
    setActiveView("editor");
    setCheckResult(null);
    setHasRun(false);
    void saveBundle(next);

    setIsReplaceConfirmOpen(false);
    setIsImportDialogOpen(false);
    setImportDraft(null);
    setToastMessage("Đã nhập mới báo cáo thành công.");
    setToastOpen(true);
  }, [bundle, importDraft, snapshotBefore]);

  const handleEvidenceChange = useCallback((evidence: EvidenceItem[]) => {
    setBundle((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        evidence,
        project: {
          ...prev.project,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const handleApplyWholeReportAiSection = useCallback(async (sectionId: string, markdown: string) => {
    if (!bundle) return;
    const targetSection = bundle.project.sections.find((section) => section.id === sectionId);
    await snapshotBefore(`Trước khi áp dụng AI cho "${targetSection?.title ?? "mục"}"`);
    const sections = bundle.project.sections.map((section) =>
      section.id === sectionId ? { ...section, markdown } : section,
    );
    const next: ReportProjectBundle = {
      ...bundle,
      project: {
        ...bundle.project,
        sections,
        updatedAt: new Date().toISOString(),
      },
    };

    setBundle(next);
    setActiveId(sectionId);
    setActiveView("editor");
    setCheckResult(null);
    setHasRun(false);
    void saveBundle(next);
    setToastMessage("Đã áp dụng đề xuất AI cho một mục.");
    setToastOpen(true);
  }, [bundle, snapshotBefore]);

  const handleConfirmRestoreSnapshot = useCallback(async () => {
    if (!snapshotToRestore) return;
    const restored = await restoreSnapshot(snapshotToRestore.id);
    if (!restored) {
      setSnapshotToRestore(null);
      setToastMessage("Không thể khôi phục bản lưu này.");
      setToastOpen(true);
      return;
    }

    setBundle(restored);
    setActiveId(restored.project.sections[0]?.id ?? null);
    setActiveView("editor");
    setCheckResult(null);
    setHasRun(false);
    await saveBundle(restored);
    await refreshSnapshots(restored.project.id);
    setSnapshotToRestore(null);
    setToastMessage("Đã khôi phục phiên bản đã chọn.");
    setToastOpen(true);
  }, [refreshSnapshots, snapshotToRestore]);

  const commands = useMemo(() => buildWorkspaceCommands({
    createSection: handleCreateSection,
    duplicateSection: handleDuplicateSection,
    moveSectionUp: () => handleMoveSection("up"),
    moveSectionDown: () => handleMoveSection("down"),
    runCheck: handleCheck,
    openPreview: handleOpenPreview,
    openExport: handleOpenExport,
    saveDraft: () => handleManualSave(),
    openAiSettings: () => setIsAiSettingsOpen(true),
    openMarkdownImport: handleOpenMarkdownImport,
    createReport: handleOpenCreateReport,
    toggleFocusMode: handleToggleFocusMode,
  }), [
    handleCheck,
    handleCreateSection,
    handleDuplicateSection,
    handleManualSave,
    handleMoveSection,
    handleOpenCreateReport,
    handleOpenExport,
    handleOpenMarkdownImport,
    handleOpenPreview,
    handleToggleFocusMode,
  ]);

  useEffect(() => {
    if (!bundle || isInitializing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      const isCodeMirrorContent = Boolean(target?.closest(".cm-content"));
      const isNativeEditable = Boolean(
        target &&
        !isCodeMirrorContent &&
        (
          target.closest("input, textarea, select") ||
          target.isContentEditable
        ),
      );
      if (isNativeEditable) return;

      const isMod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (isMod && !event.shiftKey && !event.altKey && key === "k") {
        event.preventDefault();
        if (!event.repeat) setIsCommandPaletteOpen((open) => !open);
        return;
      }

      if (isCommandPaletteOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        if (focusMode) {
          setFocusMode(false);
          focusEditorOnNextFrame();
          return;
        }
        handleFocusEditor();
        return;
      }

      if (isMod && event.shiftKey && !event.altKey && key === "f") {
        event.preventDefault();
        if (!event.repeat) handleToggleFocusMode();
        return;
      }

      if (isMod && !event.shiftKey && !event.altKey && key === "s") {
        if (isCodeMirrorContent) return;
        event.preventDefault();
        handleManualSave();
        return;
      }

      if (isMod && event.shiftKey && !event.altKey && key === "n") {
        event.preventDefault();
        if (!event.repeat) handleCreateSection();
        return;
      }

      if (isMod && event.shiftKey && !event.altKey && key === "d") {
        event.preventDefault();
        if (!event.repeat) handleDuplicateSection();
        return;
      }

      if (!isMod && event.altKey && !event.shiftKey && event.key === "ArrowUp") {
        event.preventDefault();
        handleMoveSection("up");
        return;
      }

      if (!isMod && event.altKey && !event.shiftKey && event.key === "ArrowDown") {
        event.preventDefault();
        handleMoveSection("down");
        return;
      }

      if (isMod && !event.shiftKey && !event.altKey && event.key === "Enter") {
        event.preventDefault();
        handleCheck();
        return;
      }

      if (isMod && !event.shiftKey && !event.altKey && key === "p") {
        event.preventDefault();
        handleOpenPreview();
        return;
      }

      if (isMod && event.shiftKey && !event.altKey && key === "e") {
        event.preventDefault();
        handleOpenExport();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    bundle,
    focusMode,
    handleCheck,
    handleCreateSection,
    handleDuplicateSection,
    handleFocusEditor,
    handleManualSave,
    handleMoveSection,
    handleOpenExport,
    handleOpenPreview,
    handleToggleFocusMode,
    isCommandPaletteOpen,
    isInitializing,
  ]);

  if (!bundle) {
    return (
      <WorkspaceLayout
        editor={<LoadingSkeleton variant="panel" />}
        preview={<LoadingSkeleton variant="preview" />}
        sidePanel={<LoadingSkeleton variant="panel" />}
        sections={[]}
        activeSectionId=""
        onSectionSelect={() => {}}
        reportTitle="Đang tải..."
        saveStatus={<span className="ws-status-loading-text">Đang tải...</span>}
      />
    );
  }

  if (isInitializing) {
    return (
      <ProjectInitializer
        templates={ALL_TEMPLATES}
        initialTitle={bundle.project.title}
        initialMetadata={bundle.project.metadata}
        onInitialize={handleInitialize}
        onStartBlank={handleStartBlank}
        onImportMarkdown={handleImportMarkdown}
        onApplyAiOutline={handleApplyAiOutline}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
      />
    );
  }

  if (!activeSection) {
    return (
      <WorkspaceLayout
        editor={
          <EmptyReportHub
            onCreateSection={handleCreateSection}
            onImportMarkdown={() => setIsImportDialogOpen(true)}
            onRestart={() => setIsInitializing(true)}
          />
        }
        preview={<EmptyState title="Chưa có nội dung" message="Viết nội dung trong editor để hiển thị bản in thử." />}
        sidePanel={null}
        sections={bundle ? bundle.project.sections : []}
        activeSectionId=""
        onSectionSelect={(id) => setActiveId(id)}
        reportTitle={bundle ? bundle.project.title : "Báo cáo trống"}
        onAddSection={handleCreateSection}
        onRenameSection={handleRenameSection}
        onDeleteSection={handleDeleteSection}
        onMoveSection={handleMoveSectionFromMenu}
      />
    );
  }

  const saveStatus = (
    <p className="ws-save-status" aria-live="polite">
      {quotaFull ? (
        <span className="ws-save-status-error">
          <AlertTriangle size={14} aria-hidden="true" />
          Bộ nhớ đầy
        </span>
      ) : status === "saving" ? (
        <span className="ws-save-status-saving">
          <Loader2 size={14} aria-hidden="true" />
          Đang lưu…
        </span>
      ) : status === "saved" ? (
        <span className="ws-save-status-saved">
          <CheckCircle2 size={14} aria-hidden="true" />
          Đã lưu
        </span>
      ) : (
        ""
      )}
    </p>
  );

  const primaryAction = (
    <div style={{ display: "flex", gap: "var(--rs-space-2)", alignItems: "center" }}>
      {reportHealth && (
        <ReportHealthBadge
          health={reportHealth}
          onOpenDetails={handleOpenReportHealth}
        />
      )}
      <Button
        variant={focusMode ? "primary" : "ghost"}
        size="sm"
        onClick={handleToggleFocusMode}
        aria-pressed={focusMode}
        title="Bật/tắt Focus (Ctrl+Shift+F)"
        style={{ display: "inline-flex", alignItems: "center", gap: "var(--rs-space-1)" }}
      >
        {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />} Focus
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsAiSettingsOpen(true)}
        title="Cài đặt Trợ lý AI"
        style={{ display: "inline-flex", alignItems: "center", gap: "var(--rs-space-1)" }}
      >
        <Sparkles size={14} style={{ color: "var(--rs-color-primary)" }} /> Cài đặt AI
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => runExport("pdf", bundle)}
      >
        Xuất bản để nộp
      </Button>
    </div>
  );

  const hasReportContent = bundle.project.sections.some((section) => section.markdown.trim() !== "");

  const sidePanel = (
    <div className="ws-side-inner">
      <div className="ws-side-panel-header">
        <span className="ws-side-panel-title">Trợ lý báo cáo</span>
        <div className="ws-side-panel-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenMarkdownImport}
            leadingIcon={<FileUp size={14} />}
          >
            Nhập Markdown
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenCreateReport}
          >
            Tạo báo cáo
          </Button>
        </div>
      </div>
      <AiWholeReportPanel
        sections={bundle.project.sections}
        onApplySection={handleApplyWholeReportAiSection}
        onOpenSettings={() => setIsAiSettingsOpen(true)}
      />
      <SnapshotHistory
        snapshots={snapshots}
        isLoading={isSnapshotLoading}
        onRefresh={() => refreshSnapshots(bundle.project.id)}
        onRestore={setSnapshotToRestore}
      />
      <Tabs
        value={sideTab}
        onValueChange={(value) => setSideTab(value as SidePanelTab)}
        className="ws-side-tabs"
      >
        <TabsList className="ws-side-tabs-list">
          <div className="ws-side-tab-group" role="presentation">
            <span className="ws-side-tab-group-label">Kiểm tra</span>
            <div className="ws-side-tab-group-triggers" role="presentation">
              <TabsTrigger
                value="check"
                count={checkResult?.issues?.length}
                countVariant={
                  checkResult && checkResult.issues.some((i) => i.severity === "error")
                    ? "error"
                    : checkResult && checkResult.issues.some((i) => i.severity === "warning")
                    ? "warning"
                    : "neutral"
                }
              >
                Soát lỗi
              </TabsTrigger>
              <TabsTrigger value="evidence">Minh chứng</TabsTrigger>
            </div>
          </div>
          <div className="ws-side-tab-group" role="presentation">
            <span className="ws-side-tab-group-label">Xuất bản</span>
            <div className="ws-side-tab-group-triggers" role="presentation">
              <TabsTrigger value="export">Xuất bản</TabsTrigger>
              <TabsTrigger value="submission">Nộp bài</TabsTrigger>
            </div>
          </div>
          <div className="ws-side-tab-group" role="presentation">
            <span className="ws-side-tab-group-label">Trình bày</span>
            <div className="ws-side-tab-group-triggers" role="presentation">
              <TabsTrigger value="present">Slide</TabsTrigger>
            </div>
          </div>
        </TabsList>
        <div className="ws-side-tabs-content-scroll">
          <TabsContent value="check" className="ws-side-tabs-content">
            <CheckerPanel
              result={checkResult ?? emptyCheckResult}
              onRun={handleCheck}
              onJump={handleJump}
              hasRun={hasRun}
            />
          </TabsContent>
          <TabsContent value="export" className="ws-side-tabs-content">
            <ExportPanel
              bundle={bundle}
              check={checkResult ?? undefined}
              jobs={jobs}
              runExport={runExport}
              retry={retry}
              exportedBlobs={exportedBlobs}
            />
          </TabsContent>
          <TabsContent value="submission" className="ws-side-tabs-content">
            <SubmissionPanel
              bundle={bundle}
              check={checkResult ?? undefined}
              exportedBlobs={exportedBlobs}
              jobs={jobs}
            />
          </TabsContent>
          <TabsContent value="evidence" className="ws-side-tabs-content">
            <EvidencePanel
              evidence={bundle.evidence}
              onChange={handleEvidenceChange}
            />
          </TabsContent>
          <TabsContent value="present" className="ws-side-tabs-content">
          <PresentPanel
            bundle={bundle}
            checkResult={checkResult ?? undefined}
            runExport={runExport}
            jobs={jobs}
            onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  return (
    <>
      <WorkspaceLayout
      editor={
        <div className="ws-editor-stack">
          <AiAssistBar
            section={activeSection}
            onChange={handleChange}
            onOpenSettings={() => setIsAiSettingsOpen(true)}
          />
          <div className="ws-editor-wrapper">
            <EditorPanel
              value={activeSection.markdown}
              onChange={handleChange}
              onSave={handleManualSave}
              ariaLabel={`Editor: ${activeSection.title}`}
              onImageInserted={handleImageInserted}
              sectionStats={sectionWritingStats}
              reportStats={reportWritingStats}
              focusMode={focusMode}
            />
          </div>
        </div>
      }
      preview={
        <PreviewPane
          markdown={activeSection.markdown}
          assets={bundle.assets}
          formatSettings={bundle.formatSettings}
          sections={bundle.project.sections}
          activeSectionId={activeSection.id}
          evidence={bundle.evidence}
        />
      }
      sidePanel={sidePanel}
      sections={bundle.project.sections}
      activeSectionId={activeSection.id}
      onSectionSelect={(id) => setActiveId(id)}
      reportTitle={bundle.project.title}
      saveStatus={saveStatus}
      primaryAction={primaryAction}
      activeView={activeView}
      onActiveViewChange={setActiveView}
      openSidePanelSignal={openSidePanelSignal}
      onAddSection={handleCreateSection}
      onRenameSection={handleRenameSection}
      onDeleteSection={handleDeleteSection}
      onMoveSection={handleMoveSectionFromMenu}
      onReorderSection={handleReorderSection}
      onSectionFilesDrop={handleSectionFilesDrop}
      focusMode={focusMode}
    />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        commands={commands}
        onOpenChange={handleCommandPaletteOpenChange}
      />
      <Toast open={toastOpen} onOpenChange={setToastOpen} variant="success" title={toastMessage} />
      <Dialog
        isOpen={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title="Tạo báo cáo mới?"
        description="Toàn bộ nội dung hiện tại sẽ bị xóa. Hành động không thể hoàn tác."
        variant="confirm"
        footer={
          <div className="ws-dialog-footer-actions">
            <Button variant="ghost" onClick={() => setIsResetConfirmOpen(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Tạo báo cáo
            </Button>
          </div>
        }
      />
      <Dialog
        isOpen={isImportDialogOpen}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) {
            setImportDraft(null);
            setImportMode("append");
          }
        }}
        title="Nhập báo cáo từ file Markdown"
        description="Chọn file Markdown để nhập nội dung vào báo cáo hiện tại."
        variant="modal"
        footer={
          <div className="ws-dialog-footer-actions">
            <Button
              variant="ghost"
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportDraft(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!importDraft}
              onClick={() => {
                if (importMode === "replace") {
                  if (hasReportContent) {
                    setIsReplaceConfirmOpen(true);
                  } else {
                    handleReplaceImport();
                  }
                } else {
                  handleAppendImport();
                }
              }}
            >
              Nhập báo cáo
            </Button>
          </div>
        }
      >
        <div className="ws-import-dialog-body">
          <MarkdownImportDropzone
            imported={importDraft}
            onImported={setImportDraft}
          />
          
          {importDraft && (
            <div className="ws-import-mode">
              <span className="ws-import-mode-label">Chế độ nhập</span>
              <div className="ws-import-mode-options">
                <label className="ws-import-mode-option">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === "append"}
                    onChange={() => setImportMode("append")}
                  />
                  <span>Chèn thêm vào cuối báo cáo hiện tại</span>
                </label>
                <label className="ws-import-mode-option">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                  />
                  <span>Thay thế toàn bộ báo cáo hiện tại</span>
                </label>
              </div>
              
              {importMode === "replace" && hasReportContent && (
                <div className="ws-import-warning" role="alert">
                  <AlertTriangle size={14} aria-hidden="true" />
                  <span>Chú ý: Hành động này sẽ xóa toàn bộ nội dung báo cáo hiện tại!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>
      <Dialog
        isOpen={isReplaceConfirmOpen}
        onOpenChange={setIsReplaceConfirmOpen}
        title="Ghi đè báo cáo hiện tại?"
        description="Toàn bộ nội dung báo cáo hiện tại sẽ bị xóa và thay thế bằng file Markdown mới. Hành động này không thể hoàn tác."
        variant="confirm"
        footer={
          <div className="ws-dialog-footer-actions">
            <Button variant="ghost" onClick={() => setIsReplaceConfirmOpen(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleReplaceImport}>
              Ghi đè và Nhập mới
            </Button>
          </div>
        }
      />
      <Dialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Xóa mục báo cáo này?"
        description="Mục báo cáo hiện tại đang chứa nội dung. Hành động xóa sẽ không thể hoàn tác."
        variant="confirm"
        footer={
          <div className="ws-dialog-footer-actions">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setSectionToDeleteId(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (sectionToDeleteId) {
                  void executeDeleteSection(sectionToDeleteId, true);
                }
              }}
            >
              Xóa mục
            </Button>
          </div>
        }
      />
      <Dialog
        isOpen={snapshotToRestore !== null}
        onOpenChange={(open) => {
          if (!open) setSnapshotToRestore(null);
        }}
        title="Khôi phục phiên bản này?"
        description="Nội dung báo cáo hiện tại sẽ được thay bằng bản lưu đã chọn."
        variant="confirm"
        footer={
          <div className="ws-dialog-footer-actions">
            <Button variant="ghost" onClick={() => setSnapshotToRestore(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={() => void handleConfirmRestoreSnapshot()}>
              Khôi phục
            </Button>
          </div>
        }
      />
      <AiSettingsDialog
        isOpen={isAiSettingsOpen}
        onOpenChange={setIsAiSettingsOpen}
        onConfigSaved={() => {
          setToastMessage("Đã lưu cấu hình Trợ lý AI.");
          setToastOpen(true);
        }}
      />
    </>
  );
}

