"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { EditorPanel } from "@/components/EditorPanel";
import { PreviewPane } from "@/components/PreviewPane";
import { Button, Tabs, TabsList, TabsTrigger, TabsContent, Toast, Dialog } from "@/components/ui";
import { Loader2, CheckCircle2, AlertTriangle, Sparkles, FileUp } from "lucide-react";
import { LoadingSkeleton, EmptyState } from "@/components/states";
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
  AiSettingsDialog,
  AiWholeReportPanel,
  registerAdapter,
  httpAdapter,
  loadAiConfig,
  isAiReady,
} from "@/modules/write";
import { CheckerPanel, runChecker } from "@/modules/check";
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
  const [sideTab, setSideTab] = useState<SidePanelTab>("check");
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");
  const [openSidePanelSignal, setOpenSidePanelSignal] = useState(0);

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

  const activeSection = useMemo(
    () => bundle?.project.sections.find((sec) => sec.id === activeId) ?? null,
    [bundle, activeId],
  );

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

  const executeDeleteSection = useCallback((id: string) => {
    if (!bundle) return;
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
  }, [bundle, activeId]);

  const handleDeleteSection = useCallback((id: string) => {
    if (!bundle) return;
    const section = bundle.project.sections.find((s) => s.id === id);
    if (!section) return;

    const hasContent = section.markdown.trim() !== "";
    if (hasContent) {
      setSectionToDeleteId(id);
      setIsDeleteConfirmOpen(true);
    } else {
      executeDeleteSection(id);
    }
  }, [bundle, executeDeleteSection]);

  const handleOpenPreview = useCallback(() => {
    setActiveView("preview");
  }, []);

  const handleOpenExport = useCallback(() => {
    setSideTab("export");
    requestSidePanelOpen();
  }, [requestSidePanelOpen]);

  const handleFocusEditor = useCallback(() => {
    setIsResetConfirmOpen(false);
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

  const handleReset = useCallback(() => {
    const fresh = createProjectFromTemplate(softwareProjectTemplate);
    setBundle(fresh);
    setActiveId(fresh.project.sections[0]?.id ?? null);
    setIsInitializing(true);
    setCheckResult(null);
    setHasRun(false);
    void saveBundle(fresh);
    setIsResetConfirmOpen(false);
  }, []);

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

  const handleReplaceImport = useCallback(() => {
    if (!bundle || !importDraft) return;
    const parsedSections = importReadme(importDraft.markdown);
    if (parsedSections.length === 0) {
      setIsReplaceConfirmOpen(false);
      setIsImportDialogOpen(false);
      setImportDraft(null);
      return;
    }

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
  }, [bundle, importDraft]);

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

  const handleApplyWholeReportAiSection = useCallback((sectionId: string, markdown: string) => {
    if (!bundle) return;
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
  }, [bundle]);

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

      if (event.key === "Escape") {
        event.preventDefault();
        handleFocusEditor();
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
    handleCheck,
    handleCreateSection,
    handleDuplicateSection,
    handleFocusEditor,
    handleManualSave,
    handleMoveSection,
    handleOpenExport,
    handleOpenPreview,
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
        editor={<EmptyState title="Báo cáo trống" message="Thêm mục đầu tiên để bắt đầu." />}
        preview={<EmptyState title="Chưa có nội dung" message="Viết nội dung trong editor để hiển thị bản in thử." />}
        sidePanel={null}
        sections={[]}
        activeSectionId=""
        onSectionSelect={() => {}}
        reportTitle="Báo cáo trống"
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
            onClick={() => {
              setImportDraft(null);
              setImportMode("append");
              setIsImportDialogOpen(true);
            }}
            leadingIcon={<FileUp size={14} />}
          >
            Nhập Markdown
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
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
            <PresentPanel bundle={bundle} checkResult={checkResult ?? undefined} />
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
                  executeDeleteSection(sectionToDeleteId);
                }
              }}
            >
              Xóa mục
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

