"use client";

import React, { useState, useEffect } from "react";
import { Dialog, Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@/components/ui";
import { PreviewPane } from "@/components/PreviewPane";
import { SectionControls } from "./preview/SectionControls";
import { WarningsPanel } from "./preview/WarningsPanel";
import { IssuesPanel } from "./preview/IssuesPanel";
import { remapMarkdownHeadings } from "./remap-heading";
import { loadOcrConfig, saveOcrConfig } from "./ocr-settings";
import { performDetailedOcrOnCanvas, formatOcrTextToMarkdown, renderPdfPageToCanvas } from "./converters/ocr";
import { ToastProvider, Toast, ToastViewport } from "@/components/ui/Toast";
import type { ImportDraft, OcrResult } from "@/types";
import { ingestAssetsAndEvidence } from "@/modules/write/import-assets";
import { buildMarkdownImportDraft } from "@/modules/write/markdown-import";
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
  const [assetSelectionMaps, setAssetSelectionMaps] = useState<Record<string, Record<string, string>>>({});

  // OCR configs and states
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [ocrStates, setOcrStates] = useState<Record<string, { status: string; progress: number; controller: AbortController }>>({});
  const [ocrResults, setOcrResults] = useState<Record<string, OcrResult>>({});
  
  // Toast state
  const [toast, setToast] = useState<{ isOpen: boolean; title?: string; description?: string; variant?: "success" | "info" | "error" }>({
    isOpen: false,
  });

  // Sync prop drafts to state when dialog opens or drafts list changes
  useEffect(() => {
    if (isOpen) {
      setOcrEnabled(loadOcrConfig().enabled);
    }
  }, [isOpen]);

  // Sync prop drafts to state when dialog opens or drafts list changes
  useEffect(() => {
    if (isOpen && drafts.length > 0) {
      setCurrentDrafts([...drafts]);
      setActiveTab(drafts[0].result.fileName);

      const newExcluded: Record<string, Record<string, boolean>> = {};
      const newDeltas: Record<string, Record<string, number>> = {};
      const newModes: Record<string, "append" | "replace"> = {};
      const newAssetSelections: Record<string, Record<string, string>> = {};

      drafts.forEach((d) => {
        newExcluded[d.result.fileName] = {};
        newDeltas[d.result.fileName] = {};
        newModes[d.result.fileName] = d.mode || "append";
        newAssetSelections[d.result.fileName] = d.reviewDecisions?.assetSelections ?? {};
      });

      setExcludedMaps(newExcluded);
      setDeltaMaps(newDeltas);
      setModes(newModes);
      setAssetSelectionMaps(newAssetSelections);
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
  const activeAssetSelections = assetSelectionMaps[activeFileName] || {};
  const ambiguousAssets = activeDraft.summary?.resolutions?.filter((resolution) => resolution.status === "ambiguous") ?? [];

  // Check if active draft has warnings and issues
  const activeWarnings = activeDraft.result.warnings || [];
  const activeIssues = activeDraft.issues || [];
  
  const errorCount = activeIssues.filter((i) => i.severity === "error").length;
  const warningCount = activeWarnings.length + activeIssues.filter((i) => i.severity === "warning").length;

  const commitButtonLabel = (() => {
    if (errorCount === 0 && warningCount === 0) return "Commit nhanh (1 click)";
    const parts = [];
    if (errorCount > 0) parts.push(`${errorCount} lỗi`);
    if (warningCount > 0) parts.push(`${warningCount} cảnh báo`);
    return `Nhập báo cáo (${parts.join(", ")})`;
  })();

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

  const handleOcrToggle = (checked: boolean) => {
    setOcrEnabled(checked);
    saveOcrConfig({ enabled: checked });
  };

  const updateSectionMarkdown = (sectionId: string, newMarkdown: string, pageNum: number) => {
    setCurrentDrafts((prevDrafts) => {
      return prevDrafts.map((d) => {
        if (d.result.fileName !== activeFileName) return d;
        const updatedSections = d.sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          
          let title = sec.title;
          const headingMatch = newMarkdown.match(/^##\s+([^\n<]+)/m);
          if (headingMatch) {
            title = headingMatch[1].trim();
          }
          return {
            ...sec,
            title,
            markdown: newMarkdown,
          };
        });

        // Filter out scanned-page warnings for this page
        const updatedWarnings = d.result.warnings.filter((w) => {
          if (w.code !== "scanned-page") return true;
          const pageMatch = w.location?.match(/trang\s+(\d+)/i);
          return pageMatch ? parseInt(pageMatch[1], 10) !== pageNum : true;
        });

        return {
          ...d,
          sections: updatedSections,
          result: {
            ...d.result,
            warnings: updatedWarnings,
          },
        };
      });
    });
  };

  const handleRunOcr = async (sectionId: string) => {
    const sec = activeDraft.sections.find((s) => s.id === sectionId);
    if (!sec || !activeDraft.file) return;

    const pageMatch = sec.markdown.match(/Trang (\d+): bản scan/i);
    if (!pageMatch) return;
    const pageNum = parseInt(pageMatch[1], 10);

    const controller = new AbortController();
    setOcrStates((prev) => ({
      ...prev,
      [sectionId]: { status: "Đang dựng trang...", progress: 0, controller },
    }));

    try {
      // 1. Render PDF page to canvas
      const canvas = await renderPdfPageToCanvas(activeDraft.file, pageNum);

      // 2. Run OCR recognize
      const ocrResult = await performDetailedOcrOnCanvas(
        canvas,
        pageNum,
        (p) => {
          setOcrStates((prev) => {
            if (!prev[sectionId]) return prev;
            return {
              ...prev,
              [sectionId]: { ...prev[sectionId], status: p.status, progress: p.progress },
            };
          });
        },
        controller.signal
      );

      // 3. Format and update draft
      const formattedMarkdown = formatOcrTextToMarkdown(ocrResult.text);
      updateSectionMarkdown(sectionId, formattedMarkdown, pageNum);
      setOcrResults((previous) => ({ ...previous, [sectionId]: ocrResult }));

      // Clear OCR state on success
      setOcrStates((prev) => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === "OCR cancelled") {
        // do nothing
      } else {
        setToast({
          isOpen: true,
          variant: "error",
          title: "Lỗi nhận diện OCR",
          description: `Không thể trích xuất văn bản từ trang ${pageNum}: ${error.message || "Lỗi không xác định"}`,
        });
      }
      setOcrStates((prev) => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
    }
  };

  const handleCancelOcr = (sectionId: string) => {
    const ocr = ocrStates[sectionId];
    if (ocr && ocr.controller) {
      ocr.controller.abort();
    }
    setOcrStates((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
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

  const handleCommitActive = async () => {
    const reviewedIngest = await ingestAssetsAndEvidence(
      previewMarkdown,
      activeDraft.availableFiles ?? [],
      { assetSelections: activeAssetSelections },
    );
    const finalDraft = await buildMarkdownImportDraft(
      activeDraft.result.fileName,
      reviewedIngest.markdown,
      [...activeDraft.result.assets, ...reviewedIngest.assets],
      [...(activeDraft.evidence ?? []), ...reviewedIngest.evidence],
      reviewedIngest.summary,
      activeDraft.result.sourceFormat,
    );
    finalDraft.mode = activeMode;
    finalDraft.file = activeDraft.file;
    finalDraft.availableFiles = activeDraft.availableFiles;
    finalDraft.reviewDecisions = {
      headingLevels: activeDeltaMap,
      assetSelections: activeAssetSelections,
      acceptedOcrBlocks: Object.fromEntries(Object.values(ocrResults)
        .flatMap((result) => result.blocks.map((block) => [block.id, true] as const))),
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
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
                <section aria-label="Nội dung nguồn">
                  <h4>Nguồn chuyển đổi</h4>
                  <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{activeDraft.result.markdown}</pre>
                </section>
                <section aria-label="Kết quả sau review">
                  <h4>Kết quả nhập</h4>
                  <PreviewPane
                    projectId={`import-${activeFileName}`}
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
                </section>
              </div>
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

              <div style={{ marginTop: "var(--rs-space-3)", paddingTop: "var(--rs-space-3)", borderTop: "1px solid var(--rs-color-border)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--rs-space-2)", fontSize: "13px", cursor: "pointer", fontWeight: 5, color: "var(--rs-color-text)" }}>
                  <input
                    type="checkbox"
                    checked={ocrEnabled}
                    onChange={(e) => handleOcrToggle(e.target.checked)}
                  />
                  <span>Thử nghiệm nhận diện chữ (OCR) (experimental)</span>
                </label>
              </div>
            </div>

            {/* Sections control list */}
            <div className="ws-section-controls-container">
              <div className="ws-section-panel-title">Cấu trúc các mục đề xuất</div>
              <SectionControls
                sections={activeDraft.sections}
                warnings={activeWarnings}
                excludedMap={activeExcludedMap}
                deltaMap={activeDeltaMap}
                ocrEnabled={ocrEnabled}
                ocrStates={ocrStates}
                onToggleExclude={handleToggleExclude}
                onAdjustHeading={handleAdjustHeading}
                onNavigateToSection={handleNavigateToSection}
                onRunOcr={handleRunOcr}
                onCancelOcr={handleCancelOcr}
              />
              {Object.entries(ocrResults).map(([sectionId, result]) => (
                <p key={sectionId} className="ws-section-guessed-badge">
                  OCR trang {result.page}: {result.confidence.toFixed(1)}% · {result.blocks.length} block
                </p>
              ))}
            </div>

            {ambiguousAssets.length > 0 && (
              <div className="ws-warnings-panel-section">
                <div className="ws-section-panel-title">Chọn tệp cho ảnh trùng tên</div>
                {ambiguousAssets.map((resolution) => (
                  <label key={resolution.reference} style={{ display: "grid", gap: 4, marginBottom: 8 }}>
                    <span>{resolution.reference}</span>
                    <select
                      value={activeAssetSelections[resolution.reference] ?? ""}
                      onChange={(event) => setAssetSelectionMaps((previous) => ({
                        ...previous,
                        [activeFileName]: { ...previous[activeFileName], [resolution.reference]: event.target.value },
                      }))}
                    >
                      <option value="">— Chọn đúng đường dẫn —</option>
                      {resolution.candidateFileIds.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            )}

            {/* Checker Issues panel */}
            <div className="ws-warnings-panel-section" style={{ minHeight: "150px" }}>
              <div className="ws-section-panel-title">
                Lỗi chất lượng báo cáo
                {activeIssues.length > 0 && (
                  <span
                    className="ws-section-guessed-badge"
                    style={{
                      marginLeft: "var(--rs-space-2)",
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      borderColor: "rgba(239, 68, 68, 0.2)",
                      color: "var(--rs-color-severity-error)",
                    }}
                  >
                    {activeIssues.length}
                  </span>
                )}
              </div>
              <IssuesPanel
                issues={activeIssues}
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
          <Button variant="primary" onClick={() => void handleCommitActive()} disabled={ambiguousAssets.some((resolution) => !activeAssetSelections[resolution.reference])}>
            {commitButtonLabel}
          </Button>
        </div>
      </div>
      <ToastProvider>
        {toast.isOpen && (
          <Toast
            open={toast.isOpen}
            onOpenChange={(open) => setToast((prev) => ({ ...prev, isOpen: open }))}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
          />
        )}
        <ToastViewport />
      </ToastProvider>
    </Dialog>
  );
};
export default ImportPreviewDialog;
