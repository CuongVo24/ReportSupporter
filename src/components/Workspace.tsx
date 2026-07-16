"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { EditorPanel } from "@/components/EditorPanel";
import { PreviewPane } from "@/components/PreviewPane";
import { CommandPalette } from "@/components/CommandPalette";
import { buildWorkspaceCommands } from "@/components/command-registry";
import { SnapshotHistory } from "@/components/SnapshotHistory";
import { ReportHealthBadge } from "@/components/ReportHealthBadge";
import { IssuesPanel } from "@/components/IssuesPanel";
import { Button, Tabs, TabsList, TabsTrigger, TabsContent, Toast, Dialog } from "@/components/ui";
import { ThemeToggle } from "./ThemeToggle";
import { Loader2, CheckCircle2, AlertTriangle, Sparkles, FileUp, Maximize2, Minimize2, Save } from "lucide-react";
import { LoadingSkeleton, EmptyState, EmptyReportHub } from "@/components/states";
import { InvalidDraftRecovery } from "@/components/InvalidDraftRecovery";
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
  UniversalImportDropzone,
  addSection,
  duplicateSection,
  renameSection,
  deleteSection,
  moveSection,
  moveSectionToIndex,
  createImageAsset,
  rewriteMarkdownRefs,
  isMarkdownFile,
  readMarkdownFile,
  importReadme,
  AiSettingsDialog,
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
import { computeReportHealth, runChecker, type ReportHealth } from "@/modules/check";
import { useExport } from "@/modules/export/use-export";
import { checkDraft } from "@/modules/import/check-draft";
import type { CheckResult, ReportProjectBundle, TemplateSchema, EvidenceItem, ReportSection, ImportDraft } from "@/types";

const panelLoading = () => <LoadingSkeleton variant="panel" />;
const ExportPanel = dynamic(
  () => import("@/modules/export/ExportPanel").then((module) => module.ExportPanel),
  { ssr: false, loading: panelLoading },
);
const SubmissionPanel = dynamic(
  () => import("@/modules/export/SubmissionPanel").then((module) => module.SubmissionPanel),
  { ssr: false, loading: panelLoading },
);
const EvidencePanel = dynamic(
  () => import("@/modules/evidence/EvidencePanel").then((module) => module.EvidencePanel),
  { ssr: false, loading: panelLoading },
);
const PresentPanel = dynamic(
  () => import("@/modules/present/PresentPanel").then((module) => module.PresentPanel),
  { ssr: false, loading: panelLoading },
);
const ImportPreviewDialog = dynamic(
  () => import("@/modules/import/ImportPreviewDialog").then((module) => module.ImportPreviewDialog),
  { ssr: false },
);
const AiWholeReportPanel = dynamic(
  () => import("@/modules/write/ai/AiWholeReportPanel").then((module) => module.AiWholeReportPanel),
  { ssr: false, loading: panelLoading },
);

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
  const [invalidDraft, setInvalidDraft] = useState<{ raw: unknown; issues: string[] } | null>(null);
  const [draftLoadError, setDraftLoadError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [pendingAttach, setPendingAttach] = useState<{ sectionId: string; originalRef: string } | null>(null);
  const attachFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toastOpen) {
      const timer = setTimeout(() => setToastVariant("success"), 300);
      return () => clearTimeout(timer);
    }
  }, [toastOpen]);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleAttachImageRequest = useCallback((sectionId: string, originalRef: string) => {
    setPendingAttach({ sectionId, originalRef });
    if (attachFileInputRef.current) {
      attachFileInputRef.current.value = "";
      attachFileInputRef.current.click();
    }
  }, []);

  const handleAttachFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingAttach || !bundle) return;

    const { sectionId, originalRef } = pendingAttach;
    setPendingAttach(null);

    // Limit is 5MB
    const maxBytes = 5 * 1024 * 1024;
    const result = await createImageAsset(file, maxBytes);
    if (!result.ok) {
      setToastMessage(result.error);
      setToastVariant("error");
      setToastOpen(true);
      return;
    }

    const { asset } = result;

    // Rewrite originalRef in section markdown
    const updatedSections = bundle.project.sections.map((sec) => {
      if (sec.id === sectionId) {
        const updatedMarkdown = rewriteMarkdownRefs(sec.markdown, [
          { original: originalRef, assetId: asset.id }
        ]);
        return {
          ...sec,
          markdown: updatedMarkdown,
        };
      }
      return sec;
    });

    const updatedAssets = bundle.assets.some((a) => a.id === asset.id)
      ? bundle.assets
      : [...bundle.assets, asset];

    const nextBundle: ReportProjectBundle = {
      ...bundle,
      assets: updatedAssets,
      project: {
        ...bundle.project,
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
      },
    };

    setBundle(nextBundle);

    if (hasRun) {
      const checkRes = runChecker(nextBundle);
      setCheckResult(checkRes);
    }

    setToastMessage("Nhúng ảnh thành công!");
    setToastVariant("success");
    setToastOpen(true);
  };
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importDrafts, setImportDrafts] = useState<ImportDraft[]>([]);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
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
  const [darkPreview, setDarkPreview] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [isManualSaving, setIsManualSaving] = useState(false);

  const { status, quotaFull, error: autosaveError, retrySave } = useDraftAutosave(bundle);
  const { handleImageInserted } = useImageInsert(setBundle);
  const { jobs, runExport, retry, exportedBlobs } = useExport(bundle ?? undefined);

  useEffect(() => {
    if (status === "saved") {
      setLastSavedTime(new Date().toLocaleTimeString());
    }
  }, [status]);

  const requestSidePanelOpen = useCallback(() => {
    setOpenSidePanelSignal((signal) => signal + 1);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await loadBundle();
        if (!active) return;
        if (result.status === "invalid") {
          setInvalidDraft({ raw: result.raw, issues: result.issues });
          return;
        }

        const existing = result.status === "loaded" ? result.bundle : null;
        const next = existing ?? createProjectFromTemplate(softwareProjectTemplate);
        setBundle(next);
        setActiveId(next.project.sections[0]?.id ?? null);
        setIsInitializing(!existing || (
          next.project.title === softwareProjectTemplate.name &&
          Object.keys(next.project.metadata).length === 0
        ));
        if (!existing) {
          try {
            await saveBundle(next);
          } catch (error: unknown) {
            if (active) {
              setToastVariant("error");
              setToastMessage(error instanceof Error ? error.message : "KhÃ´ng thá»ƒ lÆ°u báº£n tháº£o má»›i.");
              setToastOpen(true);
            }
          }
        }
      } catch (error: unknown) {
        if (active) {
          setDraftLoadError(error instanceof Error ? error.message : "KhÃ´ng thá»ƒ Ä‘á»c báº£n tháº£o tá»« trÃ¬nh duyá»‡t.");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleDiscardInvalidDraft = useCallback(async () => {
    const next = createProjectFromTemplate(softwareProjectTemplate);
    await saveBundle(next);
    setInvalidDraft(null);
    setDraftLoadError("");
    setBundle(next);
    setActiveId(next.project.sections[0]?.id ?? null);
    setIsInitializing(true);
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

  const handleCreateSnapshot = useCallback(async () => {
    if (!bundle) return;
    try {
      await takeSnapshot(bundle, "Bản lưu thủ công");
      void refreshSnapshots(bundle.project.id);
      setToastMessage("Đã tạo một bản lưu an toàn.");
      setToastOpen(true);
    } catch (error) {
      console.warn("Unable to create manual snapshot", error);
      setToastMessage("Không thể tạo bản lưu an toàn.");
      setToastVariant("error");
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
    setIsManualSaving(true);
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
        setToastMessage("Đã lưu bản thảo thành công");
        setToastOpen(true);
        setLastSavedTime(new Date().toLocaleTimeString());
        setIsManualSaving(false);
      })
      .catch(() => {
        setToastMessage("Không thể lưu bản thảo");
        setToastOpen(true);
        setIsManualSaving(false);
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
      setToastMessage("Đã chèn ảnh vào mục đã thả.");
      setToastOpen(true);
      return;
    }

    const markdownFile = files.find((file) => isMarkdownFile(file));
    if (!markdownFile) {
      setToastMessage("Chỉ hỗ trợ thả ảnh hoặc file Markdown vào mục lục.");
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
      ? parsedSections.map((section: ReportSection) => section.markdown).join("\n\n")
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
    setToastMessage("Đã chèn nội dung Markdown vào mục đã thả.");
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
    setImportDrafts([]);
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

  const handleImportMarkdown = useCallback((draft: ImportDraft) => {
    if (!bundle) return;
    const parsedSections = draft.sections;
    
    const replaced = replaceSections(bundle, parsedSections, draft.result.assets, draft.evidence || []);
    const titleVal = draft.result.fileName 
      ? draft.result.fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") 
      : "Báo cáo chưa đặt tên";
    const title = titleVal.charAt(0).toUpperCase() + titleVal.slice(1);
    const next: ReportProjectBundle = {
      ...replaced,
      project: {
        ...replaced.project,
        title,
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

  const handleCommitImport = useCallback(async (draft: ImportDraft) => {
    if (!bundle) return;
    const parsedSections = draft.sections;
    if (parsedSections.length === 0) return;

    let next: ReportProjectBundle;
    if (draft.mode === "replace") {
      await snapshotBefore("Trước khi ghi đè báo cáo bằng tệp tin");
      const replaced = replaceSections(
        bundle,
        parsedSections,
        draft.result.assets,
        draft.evidence
      );
      const titleVal = draft.result.fileName
        ? draft.result.fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")
        : replaced.project.title;
      const title = titleVal.charAt(0).toUpperCase() + titleVal.slice(1);
      next = {
        ...replaced,
        project: {
          ...replaced.project,
          title,
          updatedAt: new Date().toISOString(),
        },
      };
      setBundle(next);
      setActiveId(next.project.sections[0]?.id ?? null);
      setToastMessage("Đã ghi đè nội dung báo cáo thành công.");
    } else {
      next = appendSections(
        bundle,
        parsedSections,
        draft.result.assets,
        draft.evidence
      );
      const oldLength = bundle.project.sections.length;
      const firstNewSection = next.project.sections[oldLength];
      setBundle(next);
      if (firstNewSection) {
        setActiveId(firstNewSection.id);
        setActiveView("editor");
        focusEditorOnNextFrame();
      }
      setToastMessage("Đã chèn thêm các mục báo cáo thành công.");
    }

    setCheckResult(null);
    setHasRun(false);
    void saveBundle(next);
    setToastOpen(true);
  }, [bundle, snapshotBefore]);

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

  if (invalidDraft) {
    return (
      <InvalidDraftRecovery
        raw={invalidDraft.raw}
        issues={invalidDraft.issues}
        onReset={handleDiscardInvalidDraft}
      />
    );
  }

  if (draftLoadError) {
    return (
      <main className="ws-state-container" role="alert" style={{ maxWidth: 680, margin: "64px auto", padding: 32 }}>
        <AlertTriangle size={36} aria-hidden="true" />
        <h1>KhÃ´ng thá»ƒ má»Ÿ báº£n tháº£o</h1>
        <p>{draftLoadError}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>Thá»­ táº£i láº¡i</Button>
      </main>
    );
  }

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
      {quotaFull || status === "error" ? (
        <span className="ws-save-status-error">
          <AlertTriangle size={14} aria-hidden="true" />
          {quotaFull ? "Bộ nhớ đầy" : (autosaveError || "Không thể tự động lưu")}
          <button type="button" className="ws-link-button" onClick={retrySave}>Thử lại</button>
        </span>
      ) : isManualSaving ? (
        <span className="ws-save-status-saving">
          <Loader2 size={14} aria-hidden="true" style={{ animation: "ws-spin 1s linear infinite" }} />
          Đang lưu bản thảo…
        </span>
      ) : status === "saving" ? (
        <span className="ws-save-status-saving">
          <Loader2 size={14} aria-hidden="true" style={{ animation: "ws-spin 1s linear infinite" }} />
          Đang tự động lưu…
        </span>
      ) : lastSavedTime ? (
        <span className="ws-save-status-saved">
          <CheckCircle2 size={14} aria-hidden="true" />
          Đã lưu tự động lúc {lastSavedTime}
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
    <div className="ws-topbar-actions">
      {reportHealth && (
        <ReportHealthBadge
          health={reportHealth}
          onOpenDetails={handleOpenReportHealth}
        />
      )}
      <div className="ws-topbar-icon-group">
        <Button
          variant={focusMode ? "primary" : "ghost"}
          size="sm"
          iconOnly
          leadingIcon={focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          onClick={handleToggleFocusMode}
          aria-pressed={focusMode}
          aria-label="Bật/tắt chế độ Focus"
          title="Bật/tắt Focus (Ctrl+Shift+F)"
        />
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={<Sparkles size={15} />}
          onClick={() => setIsAiSettingsOpen(true)}
          aria-label="Cài đặt Trợ lý AI"
          title="Cài đặt Trợ lý AI"
        />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={<Save size={15} />}
          onClick={() => handleManualSave()}
          aria-label="Lưu bản thảo"
          title="Lưu bản thảo hiện tại (Ctrl+S)"
        />
      </div>
      <Button
        variant="primary"
        size="sm"
        leadingIcon={<FileUp size={15} />}
        onClick={() => runExport("pdf", bundle)}
      >
        Xuất bản để nộp
      </Button>
    </div>
  );


  // The "Soát lỗi" tab badge surfaces the actionable/blocking count rather than
  // the raw total (which can reach the hundreds and reads as alarming). Errors
  // (P0, block publishing) take priority; otherwise warnings; info-only reports
  // show no badge since the full breakdown lives inside the panel.
  const errorCount = checkResult?.grouped.error.length ?? 0;
  const warningCount = checkResult?.grouped.warning.length ?? 0;
  const issuesTabBadge: {
    count: number | undefined;
    variant: "error" | "warning" | "neutral";
    ariaLabel: string | undefined;
  } = errorCount > 0
    ? { count: errorCount, variant: "error", ariaLabel: `${errorCount} lỗi bắt buộc` }
    : warningCount > 0
    ? { count: warningCount, variant: "warning", ariaLabel: `${warningCount} cảnh báo` }
    : { count: undefined, variant: "neutral", ariaLabel: undefined };

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
        onCreateSnapshot={handleCreateSnapshot}
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
                count={issuesTabBadge.count}
                countVariant={issuesTabBadge.variant}
                countAriaLabel={issuesTabBadge.ariaLabel}
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
            <IssuesPanel
              result={checkResult ?? emptyCheckResult}
              onRun={handleCheck}
              onJump={handleJump}
              hasRun={hasRun}
              sections={bundle.project.sections}
              onAttachImageRequest={handleAttachImageRequest}
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
            widen={sideTab === "present"}
          />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  return (
    <>
      <WorkspaceLayout
        rightPanelWidth={sideTab === "present" ? "480px" : undefined}
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
          darkPreview={darkPreview}
          onAttachImageRequest={handleAttachImageRequest}
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
      darkPreview={darkPreview}
      onDarkPreviewToggle={() => setDarkPreview(prev => !prev)}
    />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        commands={commands}
        onOpenChange={handleCommandPaletteOpenChange}
      />
      <Toast open={toastOpen} onOpenChange={setToastOpen} variant={toastVariant} title={toastMessage} />
      <input
        type="file"
        ref={attachFileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleAttachFileChange}
      />
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
            setImportDrafts([]);
          }
        }}
        title="Nhập báo cáo từ file"
        description="Kéo thả hoặc chọn tệp tin tài liệu (Markdown, Word, PDF, Excel, PowerPoint) để chuẩn bị nhập."
        variant="modal"
      >
        <div className="ws-import-dialog-body">
          <UniversalImportDropzone
            imported={importDrafts}
            onImported={(drafts) => {
              if (bundle) {
                const draftsWithIssues = drafts.map((draft) => ({
                  ...draft,
                  issues: checkDraft(draft, bundle),
                }));
                setImportDrafts(draftsWithIssues);
              } else {
                setImportDrafts(drafts);
              }
              setIsImportDialogOpen(false);
              setIsPreviewDialogOpen(true);
            }}
          />
        </div>
      </Dialog>

      <ImportPreviewDialog
        isOpen={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        drafts={importDrafts}
        onCommit={handleCommitImport}
        onCancel={() => {
          setIsPreviewDialogOpen(false);
          setImportDrafts([]);
        }}
      />
      <Dialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={
          (() => {
            const sec = bundle?.project.sections.find((s) => s.id === sectionToDeleteId);
            return !sec || !sec.markdown.trim() ? "Xóa mục trống này?" : "Xóa mục báo cáo này?";
          })()
        }
        description={
          (() => {
            const sec = bundle?.project.sections.find((s) => s.id === sectionToDeleteId);
            return !sec || !sec.markdown.trim()
              ? "Mục báo cáo này hiện rỗng. Bạn có thể khôi phục lại mục này từ Lịch sử phiên bản."
              : "Mục báo cáo này đang chứa nội dung. Bạn có thể khôi phục lại mục này từ Lịch sử phiên bản.";
          })()
        }
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

