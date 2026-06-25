// Checker panel — displays readiness badge, groups issues by severity, and offers jump-to-issue.
// A11y: severity carries an icon + text label, not color alone; keyboard-reachable jump triggers.
import type { CheckResult, ReportIssueSeverity } from "@/types";
import { ReadinessBadge } from "./ReadinessBadge";
import { EmptyState, SuccessState } from "@/components/states";

type CheckerPanelProps = {
  result: CheckResult;
  onRun: () => void;
  onJump: (sectionId?: string, line?: number) => void;
  hasRun: boolean;
};

const ORDER: ReportIssueSeverity[] = ["error", "warning", "info"];
const LABEL: Record<ReportIssueSeverity, string> = {
  error: "Lỗi",
  warning: "Cảnh báo",
  info: "Thông tin",
};
const ICON: Record<ReportIssueSeverity, string> = { error: "✕", warning: "!", info: "i" };

export function CheckerPanel({ result, onRun, onJump, hasRun }: CheckerPanelProps) {
  const issues = result.issues || [];

  return (
    <div className="ws-checker">
      <div className="ws-checker-header">
        <button type="button" className="ws-checker-run" onClick={onRun}>
          {hasRun ? "Kiểm tra lại" : "Kiểm tra"}
        </button>
      </div>

      {!hasRun && (
        <div style={{ marginTop: "var(--rs-space-4)" }}>
          <EmptyState
            title="Chưa chạy kiểm tra"
            message="Chạy kiểm tra để rà soát lỗi định dạng và tính nhất quán của báo cáo."
            actionLabel="Bắt đầu kiểm tra"
            onAction={onRun}
          />
        </div>
      )}

      {hasRun && (
        <>
          <ReadinessBadge score={result.readinessScore} />
          {issues.length === 0 && (
            <div style={{ marginTop: "var(--rs-space-4)" }}>
              <SuccessState
                title="Báo cáo hoàn hảo!"
                message="Không phát hiện bất kỳ lỗi định dạng hay lỗi cấu trúc nào."
              />
            </div>
          )}
        </>
      )}

      {hasRun && ORDER.map((severity) => {
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
                  <div className="ws-checker-item-body">
                    <span className="ws-checker-msg">{issue.message}</span>
                    <span className="ws-checker-hint">{issue.suggestion}</span>
                    {issue.line !== undefined && (
                      <span className="ws-checker-line">Dòng {issue.line}</span>
                    )}
                  </div>
                  {issue.sectionId && (
                    <button
                      type="button"
                      className="ws-checker-jump"
                      onClick={() => onJump(issue.sectionId, issue.line)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onJump(issue.sectionId, issue.line);
                        }
                      }}
                      aria-label={`Đi tới phần ${issue.sectionId}${issue.line !== undefined ? `, dòng ${issue.line}` : ""}`}
                    >
                      Xem
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
