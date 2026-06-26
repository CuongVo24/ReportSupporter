// Checker panel — displays readiness badge, groups issues by severity, and offers jump-to-issue.
// A11y: severity carries an icon + text label, not color alone; keyboard-reachable jump triggers.
import type { CheckResult, ReportIssueSeverity } from "@/types";
import { ReadinessBadge } from "./ReadinessBadge";
import { EmptyState, SuccessState } from "@/components/states";
import { Button, Badge } from "@/components/ui";

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
  info: "Gợi ý",
};

export function CheckerPanel({ result, onRun, onJump, hasRun }: CheckerPanelProps) {
  const issues = result.issues || [];

  return (
    <div className="ws-checker">
      <div className="ws-checker-header">
        <Button
          variant="primary"
          onClick={onRun}
          className="ws-checker-run"
          style={{ width: "100%" }}
        >
          Soát báo cáo
        </Button>
      </div>

      {!hasRun && (
        <div className="ws-state-block">
          <EmptyState
            title="Báo cáo chưa được soát lỗi"
            message="Thực hiện kiểm tra báo cáo để phát hiện và rà soát các lỗi trước khi nộp bài."
            actionLabel="Soát báo cáo"
            onAction={onRun}
          />
        </div>
      )}

      {hasRun && (
        <>
          <ReadinessBadge score={result.readinessScore} />
          {issues.length === 0 && (
            <div className="ws-state-block">
              <SuccessState
                title="Không có lỗi"
                message="Báo cáo đạt các tiêu chí soát hiện tại."
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
            <h3 className="ws-checker-group-title" style={{ display: "flex", alignItems: "center", gap: "var(--rs-space-2)", margin: "var(--rs-space-3) 0" }}>
              <Badge group="severity" value={severity} label={`${LABEL[severity]} (${group.length})`} />
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
                    <Button
                      variant="ghost"
                      size="sm"
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
                    </Button>
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
