"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { EditorPanel } from "@/components/EditorPanel";
import { PreviewPane } from "@/components/PreviewPane";
import { Button, Tabs, TabsList, TabsTrigger, TabsContent, Toast, Dialog } from "@/components/ui";
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
} from "@/modules/write";
import { CheckerPanel, runChecker } from "@/modules/check";
import { ExportPanel, SubmissionPanel, useExport } from "@/modules/export";
import { EvidencePanel } from "@/modules/evidence";
import { PresentPanel } from "@/modules/present";
import type { CheckResult, ReportProjectBundle, TemplateSchema, EvidenceItem } from "@/types";

const emptyCheckResult: CheckResult = {
  issues: [],
  grouped: { error: [], warning: [], info: [] },
  readinessScore: 100,
  ranAt: "",
};

export function Workspace() {
  const [bundle, setBundle] = useState<ReportProjectBundle | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const { status, quotaFull } = useDraftAutosave(bundle);
  const { handleImageInserted } = useImageInsert(setBundle);
  const { jobs, runExport, retry, exportedBlobs } = useExport(bundle ?? undefined);

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
    setToastMessage(`Đã soát — ${result.issues.length} vấn đề`);
    setToastOpen(true);
  }, [bundle]);

  const handleJump = useCallback((sectionId?: string) => {
    if (sectionId) {
      setActiveId(sectionId);
    }
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
        <span className="ws-save-status-error">Bộ nhớ đầy</span>
      ) : status === "saving" ? (
        <span className="ws-save-status-saving">Đang lưu…</span>
      ) : status === "saved" ? (
        <span className="ws-save-status-saved">Đã lưu</span>
      ) : (
        ""
      )}
    </p>
  );

  const primaryAction = (
    <Button
      variant="primary"
      size="sm"
      onClick={() => runExport("pdf", bundle)}
    >
      Xuất bản nộp
    </Button>
  );

  const sidePanel = (
    <div className="ws-side-inner">
      <div className="ws-side-panel-header">
        <span className="ws-side-panel-title">Trợ lý báo cáo</span>
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="ws-reset-btn"
        >
          Tạo report
        </button>
      </div>
      <Tabs defaultValue="check" className="ws-side-tabs">
        <TabsList className="ws-side-tabs-list">
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
            Người soát
          </TabsTrigger>
          <TabsTrigger value="export">Xuất bản</TabsTrigger>
          <TabsTrigger value="submission">Nộp bài</TabsTrigger>
          <TabsTrigger value="evidence">Minh chứng</TabsTrigger>
          <TabsTrigger value="present">Slide</TabsTrigger>
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
        <div className="ws-editor-container">
          <AiAssistBar
            section={activeSection}
            onChange={handleChange}
          />
          <div className="ws-editor-wrapper">
            <EditorPanel
              value={activeSection.markdown}
              onChange={handleChange}
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
    />
      <Toast open={toastOpen} onOpenChange={setToastOpen} variant="success" title={toastMessage} />
      <Dialog
        isOpen={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title="Tạo report mới?"
        description="Toàn bộ nội dung hiện tại sẽ bị xóa. Hành động không thể hoàn tác."
        variant="confirm"
        footer={
          <div className="ws-dialog-footer-actions">
            <Button variant="ghost" onClick={() => setIsResetConfirmOpen(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Tạo report
            </Button>
          </div>
        }
      />
    </>
  );
}

