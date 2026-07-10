import React from "react";
import { AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";
import type { ImportWarning, ReportSection } from "@/types";

interface WarningsPanelProps {
  warnings: ImportWarning[];
  sections: ReportSection[];
  onNavigateToSection: (id: string) => void;
}

const WARNING_LABELS: Record<string, { label: string; icon: React.ReactNode; severity: "error" | "warning" | "info" }> = {
  "unsupported-element": {
    label: "Phần tử không hỗ trợ",
    icon: <HelpCircle size={14} className="ws-warn-info" />,
    severity: "info",
  },
  "scanned-page": {
    label: "Trang quét (Scanned)",
    icon: <AlertTriangle size={14} className="ws-warn-alert" />,
    severity: "warning",
  },
  "table-flattened": {
    label: "Bảng bị làm phẳng",
    icon: <AlertTriangle size={14} className="ws-warn-alert" />,
    severity: "warning",
  },
  "sheet-truncated": {
    label: "Cắt bớt dữ liệu",
    icon: <AlertCircle size={14} className="ws-warn-error" />,
    severity: "error",
  },
  "image-skipped": {
    label: "Bỏ qua hình ảnh",
    icon: <HelpCircle size={14} className="ws-warn-info" />,
    severity: "info",
  },
  "heading-guessed": {
    label: "Heuristic Heading",
    icon: <AlertTriangle size={14} className="ws-warn-alert" />,
    severity: "warning",
  },
  "file-too-large": {
    label: "Tệp quá lớn",
    icon: <AlertCircle size={14} className="ws-warn-error" />,
    severity: "error",
  },
};

export const WarningsPanel: React.FC<WarningsPanelProps> = ({
  warnings,
  sections,
  onNavigateToSection,
}) => {
  if (warnings.length === 0) {
    return (
      <div className="ws-warnings-empty-state">
        <span className="ws-warnings-empty-text">🎉 Draft sạch! 0 cảnh báo.</span>
      </div>
    );
  }

  // Group warnings by code
  const groups = warnings.reduce<Record<string, ImportWarning[]>>((acc, w) => {
    if (!acc[w.code]) {
      acc[w.code] = [];
    }
    acc[w.code].push(w);
    return acc;
  }, {});

  // Find section ID matching a warning
  const getTargetSectionId = (w: ImportWarning): string | undefined => {
    if (w.code === "heading-guessed") {
      const match = w.message.match(/"([^"]+)"/);
      if (match) {
        const titleQuery = match[1].toLowerCase();
        const sec = sections.find((s) => s.title.toLowerCase().includes(titleQuery));
        if (sec) return sec.id;
      }
    }
    if (w.location) {
      const locQuery = w.location.toLowerCase();
      const sec = sections.find((s) => s.markdown.toLowerCase().includes(locQuery));
      if (sec) return sec.id;
    }
    return undefined;
  };

  return (
    <div className="ws-warnings-panel-container">
      {Object.entries(groups).map(([code, list]) => {
        const config = WARNING_LABELS[code] || {
          label: code,
          icon: <AlertTriangle size={14} />,
          severity: "warning",
        };

        return (
          <div key={code} className="ws-warning-group">
            <div className={`ws-warning-group-header ws-warning-severity-${config.severity}`}>
              {config.icon}
              <span className="ws-warning-group-label">{config.label}</span>
              <span className="ws-warning-group-badge">{list.length}</span>
            </div>

            <ul className="ws-warning-list">
              {list.map((w, index) => {
                const sectionId = getTargetSectionId(w);
                return (
                  <li
                    key={index}
                    className={`ws-warning-item-row ${sectionId ? "ws-warning-navigable" : ""}`}
                    onClick={() => sectionId && onNavigateToSection(sectionId)}
                    title={sectionId ? "Nhấp để di chuyển tới phần này" : undefined}
                  >
                    <div className="ws-warning-item-message">{w.message}</div>
                    {w.location && (
                      <span className="ws-warning-item-location">{w.location}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};
