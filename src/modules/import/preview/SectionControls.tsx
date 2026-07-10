import React from "react";
import { AlertTriangle, Plus, Minus, Eye, EyeOff } from "lucide-react";
import type { ReportSection, ImportWarning } from "@/types";

interface SectionControlsProps {
  sections: ReportSection[];
  warnings: ImportWarning[];
  excludedMap: Record<string, boolean>;
  deltaMap: Record<string, number>;
  onToggleExclude: (id: string) => void;
  onAdjustHeading: (id: string, delta: number) => void;
  onNavigateToSection: (id: string) => void;
}

export const SectionControls: React.FC<SectionControlsProps> = ({
  sections,
  warnings,
  excludedMap,
  deltaMap,
  onToggleExclude,
  onAdjustHeading,
  onNavigateToSection,
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

        return (
          <div
            key={sec.id}
            className={`ws-section-control-item ${isExcluded ? "ws-section-excluded" : ""}`}
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
        );
      })}
    </div>
  );
};
