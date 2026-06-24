"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { EditorPanel } from "@/components/EditorPanel";
import { PreviewPane } from "@/components/PreviewPane";
import {
  createProjectFromTemplate,
  loadBundle,
  saveBundle,
  softwareProjectTemplate,
  generateSkeleton,
  ProjectInitializer,
  useDraftAutosave,
  useImageInsert,
} from "@/modules/write";
import { CheckerPanel, runChecker } from "@/modules/check";
import { ExportPanel } from "@/modules/export";
import type { CheckResult, ReportProjectBundle, TemplateSchema } from "@/types";

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

  const { status, quotaFull } = useDraftAutosave(bundle);
  const { handleImageInserted } = useImageInsert(setBundle);

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
    setCheckResult(runChecker(bundle));
    setHasRun(true);
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
    const generatedSections = generateSkeleton(template, { title, ...metadata });
    const next: ReportProjectBundle = {
      ...bundle,
      project: {
        ...bundle.project,
        title,
        metadata,
        sections: generatedSections,
        updatedAt: new Date().toISOString(),
      },
    };
    setBundle(next);
    setActiveId(generatedSections[0]?.id ?? null);
    setIsInitializing(false);
  }, [bundle]);

  const handleReset = useCallback(() => {
    if (!confirm("Tạo mới báo cáo? Toàn bộ nội dung hiện tại sẽ bị xóa.")) return;
    const fresh = createProjectFromTemplate(softwareProjectTemplate);
    setBundle(fresh);
    setActiveId(fresh.project.sections[0]?.id ?? null);
    setIsInitializing(true);
    setCheckResult(null);
    setHasRun(false);
    void saveBundle(fresh);
  }, []);

  if (!bundle) {
    return <WorkspaceLayout editor={<p className="ws-zone-hint">Đang tải…</p>} preview={null} sidePanel={null} />;
  }

  if (isInitializing) {
    return (
      <ProjectInitializer
        templates={[softwareProjectTemplate]}
        initialTitle={bundle.project.title}
        initialMetadata={bundle.project.metadata}
        onInitialize={handleInitialize}
      />
    );
  }

  if (!activeSection) {
    return <WorkspaceLayout editor={<p className="ws-zone-hint">Đang tải…</p>} preview={null} sidePanel={null} />;
  }

  const sidePanel = (
    <div className="ws-side-inner">
      <label className="ws-side-label" htmlFor="ws-section-select">Sections</label>
      <select
        id="ws-section-select"
        className="ws-section-select"
        value={activeSection.id}
        onChange={(e) => setActiveId(e.target.value)}
      >
        {bundle.project.sections.map((sec) => (
          <option key={sec.id} value={sec.id}>{sec.title}</option>
        ))}
      </select>
      <p className="ws-save-status" aria-live="polite">
        {quotaFull ? "Bộ nhớ trình duyệt đầy — nội dung vẫn giữ trong phiên." : status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
      </p>
      <button
        onClick={handleReset}
        className="ws-reset-btn"
      >
        Tạo mới báo cáo
      </button>
      <CheckerPanel
        result={checkResult ?? emptyCheckResult}
        onRun={handleCheck}
        onJump={handleJump}
        hasRun={hasRun}
      />
      <ExportPanel
        bundle={bundle}
        check={checkResult ?? undefined}
      />
    </div>
  );

  return (
    <WorkspaceLayout
      editor={
        <EditorPanel
          value={activeSection.markdown}
          onChange={handleChange}
          ariaLabel={`Editor: ${activeSection.title}`}
          onImageInserted={handleImageInserted}
        />
      }
      preview={
        <PreviewPane
          markdown={activeSection.markdown}
          assets={bundle.assets}
          formatSettings={bundle.formatSettings}
          sections={bundle.project.sections}
          activeSectionId={activeSection.id}
        />
      }
      sidePanel={sidePanel}
    />
  );
}

