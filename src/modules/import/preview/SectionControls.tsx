import React from "react";
import { AlertTriangle, Plus, Minus, Eye, EyeOff, Loader2, Search } from "lucide-react";
import type { ReportSection, ImportWarning } from "@/types";

interface SectionControlsProps {
  sections: ReportSection[];
  warnings: ImportWarning[];
  excludedMap: Record<string, boolean>;
  deltaMap: Record<string, number>;
  ocrEnabled: boolean;
  ocrStates: Record<string, { status: string; progress: number }>;
  onToggleExclude: (id: string) => void;
  onAdjustHeading: (id: string, delta: number) => void;
  onNavigateToSection: (id: string) => void;
  onRunOcr: (id: string) => void;
  onCancelOcr: (id: string) => void;
}

export const SectionControls: React.FC<SectionControlsProps> = ({
  sections,
  warnings,
  excludedMap,
  deltaMap,
  ocrEnabled,
  ocrStates,
  onToggleExclude,
  onAdjustHeading,
  onNavigateToSection,
  onRunOcr,
  onCancelOcr,
}) => {
  // Check if a section title matches a heading-guessed warning
  const hasHeadingWarning = (section: ReportSection): boolean => {
    return warnings.some((w) => {
      if (w.code !== "heading-guessed") return false;
      const match = w.message.match(/"([^"]+)"/);
      return match ? section.title.toLowerCase().includes(match[1].toLowerCase()) : false;
    });
  };

  return (
    <div className="ws-section-controls-list">
      {sections.map((sec) => {
        const isExcluded = !!excludedMap[sec.id];
        const delta = deltaMap[sec.id] || 0;
        const hasWarning = hasHeadingWarning(sec);
        
        // Detect if section contains scanned-page placeholder
        const isScanned = sec.markdown.includes("bản scan — chưa trích được chữ");
        const ocrState = ocrStates[sec.id];

        return (
          <div
            key={sec.id}
            className={`ws-section-control-item-wrapper`}
            style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-2)", borderBottom: "1px solid var(--rs-color-border)", paddingBottom: "var(--rs-space-3)", marginBottom: "var(--rs-space-1)" }}
          >
            <div
              className={`ws-section-control-item ${isExcluded ? "ws-section-excluded" : ""}`}
              style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}
            >
              <div className="ws-section-control-main">
                <button
                  type="button"
                  className="ws-section-exclude-toggle"
                  onClick={() => onToggleExclude(sec.id)}
                  title={isExcluded ? "Nhấp để giữ mục này" : "Nhấp để bỏ mục này"}
                  aria-label={isExcluded ? "Giữ mục" : "Bỏ mục"}
                >
                  {isExcluded ? (
                    <EyeOff size={16} className="ws-icon-muted" />
                  ) : (
                    <Eye size={16} className="ws-icon-primary" />
                  )}
                </button>

                <span
                  className="ws-section-control-title"
                  onClick={() => !isExcluded && onNavigateToSection(sec.id)}
                  style={{ cursor: isExcluded ? "default" : "pointer" }}
                >
                  {sec.title}
                </span>

                {hasWarning && !isExcluded && (
                  <span
                    className="ws-section-guessed-badge"
                    title="Tiêu đề được suy đoán từ Heuristic, vui lòng xác thực lại"
                  >
                    <AlertTriangle size={12} />
                    <span>Gợi ý</span>
                  </span>
                )}
              </div>

              {!isExcluded && (
                <div className="ws-section-heading-actions">
                  <span className="ws-heading-delta-label">
                    H{delta >= 0 ? `+${delta}` : delta}
                  </span>
                  <button
                    type="button"
                    className="ws-heading-action-btn"
                    onClick={() => onAdjustHeading(sec.id, -1)}
                    title="Giảm cấp tiêu đề (H1 -> H2 -> H3...)"
                    aria-label="Giảm cấp tiêu đề"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    className="ws-heading-action-btn"
                    onClick={() => onAdjustHeading(sec.id, 1)}
                    title="Tăng cấp tiêu đề (H3 -> H2 -> H1...)"
                    aria-label="Tăng cấp tiêu đề"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* OCR Experimental section control */}
            {ocrEnabled && isScanned && !isExcluded && (
              <div
                className="ws-ocr-control-block"
                style={{
                  paddingLeft: "calc(16px + var(--rs-space-2))",
                  fontSize: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--rs-space-1)"
                }}
              >
                {!ocrState ? (
                  <button
                    type="button"
                    onClick={() => onRunOcr(sec.id)}
                    className="ws-ocr-run-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--rs-space-1.5)",
                      padding: "var(--rs-space-1) var(--rs-space-2.5)",
                      borderRadius: "4px",
                      border: "1px solid var(--rs-color-border)",
                      backgroundColor: "var(--rs-color-bg)",
                      color: "var(--rs-color-primary)",
                      cursor: "pointer",
                      width: "fit-content",
                      fontWeight: 5
                    }}
                  >
                    <Search size={12} />
                    <span>Thử OCR (experimental)</span>
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--rs-space-1)",
                      width: "100%",
                      backgroundColor: "var(--rs-color-surface-muted)",
                      padding: "var(--rs-space-2)",
                      borderRadius: "4px",
                      border: "1px dashed var(--rs-color-border)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--rs-space-1)" }}>
                        <Loader2 size={12} className="animate-spin" />
                        <span>{ocrState.status}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onCancelOcr(sec.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--rs-color-severity-error)",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "11px"
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                    <div
                      style={{
                        height: "4px",
                        width: "100%",
                        backgroundColor: "var(--rs-color-border)",
                        borderRadius: "2px",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.round(ocrState.progress * 100)}%`,
                          backgroundColor: "var(--rs-color-primary)",
                          transition: "width 0.2s ease"
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--rs-color-text-muted)" }}>
                      Tiến độ: {Math.round(ocrState.progress * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

