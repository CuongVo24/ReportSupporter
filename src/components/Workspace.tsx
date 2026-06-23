"use client";

// W1 Group D orchestrator: load/bootstrap a draft, edit the active section, render
// raw preview, and autosave to IndexedDB (throttled). Container that wires the
// presentational WorkspaceLayout slots (Coding & Git Standard §4b).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { EditorPanel } from "@/components/EditorPanel";
import { PreviewPane } from "@/components/PreviewPane";
import {
  createProjectFromTemplate,
  createThrottledSaver,
  loadBundle,
  saveBundle,
  softwareProjectTemplate,
} from "@/modules/write";
import type { ReportProjectBundle } from "@/types";

type SaveStatus = "idle" | "saving" | "saved";

export function Workspace() {
  const [bundle, setBundle] = useState<ReportProjectBundle | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [quotaFull, setQuotaFull] = useState(false);

  const saverRef = useRef(
    createThrottledSaver<ReportProjectBundle>(async (next) => {
      try {
        await saveBundle(next);
        setQuotaFull(false);
        setStatus("saved");
      } catch {
        setQuotaFull(true); // keep RAM state; surface a banner (1.Write §6)
      }
    }, 2000),
  );

  // Load existing draft or bootstrap the default template (1.Write §5.1 / §6).
  useEffect(() => {
    let active = true;
    void (async () => {
      const existing = await loadBundle();
      const next = existing ?? createProjectFromTemplate(softwareProjectTemplate);
      if (!active) return;
      setBundle(next);
      setActiveId(next.project.sections[0]?.id ?? null);
      if (!existing) void saveBundle(next).catch(() => setQuotaFull(true));
    })();
    return () => {
      active = false;
    };
  }, []);

  // Flush the pending save before the tab is hidden/closed.
  useEffect(() => {
    const saver = saverRef.current;
    const flush = () => saver.flush();
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, []);

  const activeSection = useMemo(
    () => bundle?.project.sections.find((section) => section.id === activeId) ?? null,
    [bundle, activeId],
  );

  const handleChange = useCallback(
    (markdown: string) => {
      setBundle((prev) => {
        if (!prev || !activeId) return prev;
        const sections = prev.project.sections.map((section) =>
          section.id === activeId ? { ...section, markdown } : section,
        );
        const next: ReportProjectBundle = {
          ...prev,
          project: { ...prev.project, sections, updatedAt: new Date().toISOString() },
        };
        setStatus("saving");
        saverRef.current.schedule(next);
        return next;
      });
    },
    [activeId],
  );

  if (!bundle || !activeSection) {
    return (
      <WorkspaceLayout
        editor={<p className="ws-zone-hint">Đang tải…</p>}
        preview={null}
        sidePanel={null}
      />
    );
  }

  const sidePanel = (
    <div className="ws-side-inner">
      <label className="ws-side-label" htmlFor="ws-section-select">
        Sections
      </label>
      <select
        id="ws-section-select"
        className="ws-section-select"
        value={activeSection.id}
        onChange={(event) => setActiveId(event.target.value)}
      >
        {bundle.project.sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.title}
          </option>
        ))}
      </select>
      <p className="ws-save-status" aria-live="polite">
        {quotaFull
          ? "Bộ nhớ trình duyệt đầy — nội dung vẫn giữ trong phiên."
          : status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved"
              : ""}
      </p>
    </div>
  );

  return (
    <WorkspaceLayout
      editor={
        <EditorPanel
          value={activeSection.markdown}
          onChange={handleChange}
          ariaLabel={`Editor: ${activeSection.title}`}
        />
      }
      preview={<PreviewPane markdown={activeSection.markdown} />}
      sidePanel={sidePanel}
    />
  );
}
