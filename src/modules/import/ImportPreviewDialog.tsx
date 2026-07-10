"use client";

import React, { useState, useEffect } from "react";
import { Dialog, Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@/components/ui";
import { PreviewPane } from "@/components/PreviewPane";
import { SectionControls } from "./preview/SectionControls";
import { WarningsPanel } from "./preview/WarningsPanel";
import { remapMarkdownHeadings } from "./remap-heading";
import type { ImportDraft, ReportSection } from "@/types";
import "./ImportPreviewDialog.css";

interface ImportPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: ImportDraft[];
  onCommit: (draft: ImportDraft) => void;
  onCancel: () => void;
}

export const ImportPreviewDialog: React.FC<ImportPreviewDialogProps> = ({
  isOpen,
  onOpenChange,
  drafts,
  onCommit,
  onCancel,
}) => {
  const [currentDrafts, setCurrentDrafts] = useState<ImportDraft[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");

  // Maps: file/draft fileName -> section id -> excluded status
  const [excludedMaps, setExcludedMaps] = useState<Record<string, Record<string, boolean>>>({});
  // Maps: file/draft fileName -> section id -> depth delta (heading level change)
  const [deltaMaps, setDeltaMaps] = useState<Record<string, Record<string, number>>>({});
  // Maps: file/draft fileName -> import mode ("append" | "replace")
  const [modes, setModes] = useState<Record<string, "append" | "replace">>({});

  // Sync prop drafts to state when dialog opens or drafts list changes
  useEffect(() => {
    if (isOpen && drafts.length > 0) {
      setCurrentDrafts([...drafts]);
      setActiveTab(drafts[0].result.fileName);

      const newExcluded: Record<string, Record<string, boolean>> = {};
      const newDeltas: Record<string, Record<string, number>> = {};
      const newModes: Record<string, "append" | "replace"> = {};

      drafts.forEach((d) => {
        newExcluded[d.result.fileName] = {};
        newDeltas[d.result.fileName] = {};
        newModes[d.result.fileName] = d.mode || "append";
      });

      setExcludedMaps(newExcluded);
      setDeltaMaps(newDeltas);
      setModes(newModes);
    }
  }, [isOpen, drafts]);

  if (currentDrafts.length === 0) {
    return null;
  }

  const activeDraft = currentDrafts.find((d) => d.result.fileName === activeTab) || currentDrafts[0];
  const activeFileName = activeDraft.result.fileName;
  const activeExcludedMap = excludedMaps[activeFileName] || {};
  const activeDeltaMap = deltaMaps[activeFileName] || {};
  const activeMode = modes[activeFileName] || "append";

  // Check if active draft has warnings
  const activeWarnings = activeDraft.result.warnings || [];
  const activeIssues = activeDraft.issues || [];
  const warningCount = activeWarnings.length + activeIssues.length;

  // Compute final Markdown for preview based on active exclusions and heading deltas
  const keptSections = activeDraft.sections.filter((sec) => !activeExcludedMap[sec.id]);
  const previewMarkdown = keptSections
    .map((sec) => {
      const delta = activeDeltaMap[sec.id] || 0;
      return remapMarkdownHeadings(sec.markdown, delta);
    })
    .join("\n\n");

  const handleToggleExclude = (sectionId: string) => {
    setExcludedMaps((prev) => ({
      ...prev,
      [activeFileName]: {
        ...prev[activeFileName],
        [sectionId]: !prev[activeFileName]?.[sectionId],
      },
    }));
  };

  const handleAdjustHeading = (sectionId: string, dir: number) => {
    setDeltaMaps((prev) => {
      const current = prev[activeFileName]?.[sectionId] || 0;
      const nextDelta = current + dir;
      return {
        ...prev,
        [activeFileName]: {
          ...prev[activeFileName],
          [sectionId]: nextDelta,
        },
      };
    });
  };

  const handleModeChange = (mode: "append" | "replace") => {
    setModes((prev) => ({
      ...prev,
      [activeFileName]: mode,
    }));
  };

  // Scroll preview window to the matched section heading title
  const handleNavigateToSection = (sectionId: string) => {
    const section = activeDraft.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const headings = document.querySelectorAll(
      ".ws-preview-page h1, .ws-preview-page h2, .ws-preview-page h3, .ws-preview-page h4, .ws-preview-page h5, .ws-preview-page h6"
    );
    const targetTitle = section.title.toLowerCase().trim();

    for (let i = 0; i < headings.length; i++) {
      const el = headings[i] as HTMLElement;
      if (el.textContent?.toLowerCase().trim().includes(targetTitle)) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Highlight indicator
        el.style.backgroundColor = "rgba(245, 158, 11, 0.2)";
        setTimeout(() => {
          el.style.backgroundColor = "";
        }, 1500);
        break;
      }
    }
  };

  const handleCommitActive = () => {
    // Construct final draft with modified sections list and mode
    const finalSections: ReportSection[] = keptSections.map((sec) => ({
      ...sec,
      markdown: remapMarkdownHeadings(sec.markdown, activeDeltaMap[sec.id] || 0),
    }));

    const finalDraft: ImportDraft = {
      ...activeDraft,
      sections: finalSections,
      mode: activeMode,
    };

    onCommit(finalDraft);

    // Remove committed draft from current list
    const remaining = currentDrafts.filter((d) => d.result.fileName !== activeFileName);
    setCurrentDrafts(remaining);

    if (remaining.length > 0) {
      setActiveTab(remaining[0].result.fileName);
    } else {
      onOpenChange(false);
    }
  };

  const handleSkipActive = () => {
    const remaining = currentDrafts.filter((d) => d.result.fileName !== activeFileName);
    setCurrentDrafts(remaining);

    if (remaining.length > 0) {
      setActiveTab(remaining[0].result.fileName);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Xem trước nội dung nhập"
      variant="modal"
      preventDismissOnOutsideClick
    >
      <div className="ws-dialog-content-preview-modal-inner" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {currentDrafts.length > 1 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} variant="underline">
            <TabsList>
              {currentDrafts.map((d) => {
                const count = (d.result.warnings?.length || 0) + (d.issues?.length || 0);
                return (
                  <TabsTrigger
                    key={d.result.fileName}
                    value={d.result.fileName}
                    count={count > 0 ? count : undefined}
                    countVariant="warning"
                  >
                    {d.result.fileName}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {currentDrafts.map((d) => (
              <TabsContent key={d.result.fileName} value={d.result.fileName} style={{ flex: 1, overflow: "hidden" }} />
            ))}
          </Tabs>
        ) : null}

        <div className="ws-import-preview-layout" style={{ marginTop: currentDrafts.length > 1 ? "var(--rs-space-3)" : 0 }}>
          {/* Left Side: Markdown preview pipeline */}
          <div className="ws-import-preview-left">
            <div className="ws-import-preview-scroll">
              <PreviewPane
                markdown={previewMarkdown}
                assets={activeDraft.result.assets}
                evidence={activeDraft.evidence}
                formatSettings={{
                  presetId: "academic-default",
                  includeToc: false,
                  includeListOfFigures: false,
                  includeListOfTables: false,
                  captionNumbering: "continuous",
                }}
              />
            </div>
          </div>

          {/* Right Side: Options & Metadata panel */}
          <div className="ws-import-preview-right">
            {/* Mode selection */}
            <div className="ws-import-mode-section">
              <h4 className="ws-import-mode-title">Chế độ nhập vào báo cáo</h4>
              <div className="ws-import-mode-radios">
                <label className="ws-import-mode-label-row">
                  <input
                    type="radio"
                    name={`import-mode-${activeFileName}`}
                    value="append"
                    checked={activeMode === "append"}
                    onChange={() => handleModeChange("append")}
                  />
                  <span>Chèn thêm vào cuối báo cáo hiện tại</span>
                </label>
                <label className="ws-import-mode-label-row">
                  <input
                    type="radio"
                    name={`import-mode-${activeFileName}`}
                    value="replace"
                    checked={activeMode === "replace"}
                    onChange={() => handleModeChange("replace")}
                  />
                  <span>Thay thế toàn bộ báo cáo hiện tại</span>
                </label>
              </div>

              {activeMode === "replace" && (
                <div className="ws-import-mode-alert" role="alert">
                  <span>Chú ý: Hành động này sẽ xóa toàn bộ nội dung báo cáo hiện tại!</span>
                </div>
              )}
            </div>

            {/* Sections control list */}
            <div className="ws-section-controls-container">
              <div className="ws-section-panel-title">Cấu trúc các mục đề xuất</div>
              <SectionControls
                sections={activeDraft.sections}
                warnings={activeWarnings}
                excludedMap={activeExcludedMap}
                deltaMap={activeDeltaMap}
                onToggleExclude={handleToggleExclude}
                onAdjustHeading={handleAdjustHeading}
                onNavigateToSection={handleNavigateToSection}
              />
            </div>

            {/* Warnings detail panel */}
            <div className="ws-warnings-panel-section">
              <div className="ws-section-panel-title">
                Cảnh báo chuyển đổi
                {warningCount > 0 && (
                  <span className="ws-section-guessed-badge" style={{ marginLeft: "var(--rs-space-2)" }}>
                    {warningCount}
                  </span>
                )}
              </div>
              <WarningsPanel
                warnings={activeWarnings}
                sections={activeDraft.sections}
                onNavigateToSection={handleNavigateToSection}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="ws-dialog-footer" style={{ marginTop: "var(--rs-space-4)", display: "flex", justifyContent: "flex-end", gap: "var(--rs-space-3)" }}>
          <Button variant="ghost" onClick={onCancel}>
            Hủy toàn bộ
          </Button>
          {currentDrafts.length > 1 && (
            <Button variant="ghost" onClick={handleSkipActive}>
              Bỏ qua tệp này
            </Button>
          )}
          <Button variant="primary" onClick={handleCommitActive}>
            {warningCount === 0 ? "Commit nhanh (1 click)" : "Nhập báo cáo"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
export default ImportPreviewDialog;
