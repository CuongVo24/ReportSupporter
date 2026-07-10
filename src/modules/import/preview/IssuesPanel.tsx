import React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { ReportIssue } from "@/types";

interface IssuesPanelProps {
  issues: ReportIssue[];
  onNavigateToSection: (sectionId: string) => void;
}

export const IssuesPanel: React.FC<IssuesPanelProps> = ({ issues, onNavigateToSection }) => {
  if (issues.length === 0) {
    return (
      <div className="ws-warnings-empty-state">
        <span className="ws-warnings-empty-text">🎉 0 lỗi chất lượng! Báo cáo đạt chuẩn.</span>
      </div>
    );
  }

  // Group issues by severity
  const grouped = issues.reduce<Record<string, ReportIssue[]>>((acc, issue) => {
    const sev = issue.severity || "info";
    if (!acc[sev]) {
      acc[sev] = [];
    }
    acc[sev].push(issue);
    return acc;
  }, {});

  const SEVERITY_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    error: {
      label: "Lỗi bắt buộc",
      icon: <AlertCircle size={14} className="ws-warn-error" />,
      className: "ws-warning-severity-error",
    },
    warning: {
      label: "Cảnh báo chất lượng",
      icon: <AlertTriangle size={14} className="ws-warn-alert" />,
      className: "ws-warning-severity-warning",
    },
    info: {
      label: "Gợi ý cải thiện",
      icon: <Info size={14} className="ws-warn-info" />,
      className: "ws-warning-severity-info",
    },
  };

  return (
    <div className="ws-warnings-panel-container">
      {Object.entries(SEVERITY_CONFIG).map(([sev, config]) => {
        const list = grouped[sev] || [];
        if (list.length === 0) return null;

        return (
          <div key={sev} className="ws-warning-group">
            <div className={`ws-warning-group-header ${config.className}`}>
              {config.icon}
              <span className="ws-warning-group-label">{config.label}</span>
              <span className="ws-warning-group-badge">{list.length}</span>
            </div>

            <ul className="ws-warning-list">
              {list.map((issue, index) => {
                const hasSection = !!issue.sectionId;
                return (
                  <li
                    key={index}
                    className={`ws-warning-item-row ${hasSection ? "ws-warning-navigable" : ""}`}
                    onClick={() => hasSection && issue.sectionId && onNavigateToSection(issue.sectionId)}
                    title={hasSection ? "Nhấp để di chuyển tới phần này" : undefined}
                  >
                    <div className="ws-warning-item-content">
                      <div className="ws-warning-item-message">{issue.message}</div>
                      <div className="ws-warning-item-suggestion" style={{ fontSize: "11px", color: "var(--rs-color-text-muted)", marginTop: "2px" }}>
                        💡 {issue.suggestion}
                      </div>
                    </div>
                    {issue.line && (
                      <span className="ws-warning-item-location">dòng {issue.line}</span>
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
