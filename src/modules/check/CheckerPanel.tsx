// Presentational checker panel — groups issues by severity (3.Check.md §4).
// A11y (DesignSystem §7b): severity carries an icon + text label, not colour
// alone; the list is keyboard-reachable.
import type { ReportIssue, ReportIssueSeverity } from "@/types";

type CheckerPanelProps = {
  issues: ReportIssue[];
  onRun: () => void;
  hasRun: boolean;
};

const ORDER: ReportIssueSeverity[] = ["error", "warning", "info"];
const LABEL: Record<ReportIssueSeverity, string> = {
  error: "Lỗi",
  warning: "Cảnh báo",
  info: "Thông tin",
};
const ICON: Record<ReportIssueSeverity, string> = { error: "✕", warning: "!", info: "i" };

export function CheckerPanel({ issues, onRun, hasRun }: CheckerPanelProps) {
  return (
    <div className="ws-checker">
      <button type="button" className="ws-checker-run" onClick={onRun}>
        Check
      </button>
      {hasRun && issues.length === 0 && (
        <p className="ws-checker-empty">Không phát hiện vấn đề.</p>
      )}
      {ORDER.map((severity) => {
        const group = issues.filter((issue) => issue.severity === severity);
        if (group.length === 0) return null;
        return (
          <section key={severity} className="ws-checker-group" aria-label={LABEL[severity]}>
            <h3 className="ws-checker-group-title">
              <span className={`ws-sev ws-sev-${severity}`} aria-hidden="true">
                {ICON[severity]}
              </span>
              {LABEL[severity]} ({group.length})
            </h3>
            <ul className="ws-checker-list">
              {group.map((issue, index) => (
                <li key={`${issue.id}-${issue.sectionId}-${issue.line}-${index}`} className="ws-checker-item">
                  <span className="ws-checker-msg">{issue.message}</span>
                  <span className="ws-checker-hint">{issue.suggestion}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
