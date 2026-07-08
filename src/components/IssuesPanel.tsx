import { useState, useMemo } from "react";
import type { CheckResult, ReportIssueSeverity } from "@/types";
import { ReadinessBadge } from "@/modules/check/ReadinessBadge";
import { EmptyState, SuccessState } from "@/components/states";
import { Button } from "@/components/ui";
import { AlertCircle, AlertTriangle, Info, Search, ArrowRight } from "lucide-react";

type IssuesPanelProps = {
  result: CheckResult;
  onRun: () => void;
  onJump: (sectionId?: string, line?: number) => void;
  hasRun: boolean;
};

export function IssuesPanel({ result, onRun, onJump, hasRun }: IssuesPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | ReportIssueSeverity>("all");

  const issues = useMemo(() => result.issues || [], [result.issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (issue.suggestion?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === "all" || issue.severity === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [issues, searchTerm, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: issues.length,
      error: issues.filter((i) => i.severity === "error").length,
      warning: issues.filter((i) => i.severity === "warning").length,
      info: issues.filter((i) => i.severity === "info").length,
    };
  }, [issues]);

  // Dev-only badge: surfaces the count of broken image assets (the terminal 404s)
  // directly in the UI instead of only in the dev server console (#VII).
  const brokenAssetCount = useMemo(
    () => issues.filter((i) => i.id === "broken-image").length,
    [issues]
  );
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="ws-checker" style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-4)", height: "100%" }}>
      <div className="ws-checker-header" style={{ paddingBottom: "var(--rs-space-2)", borderBottom: "1px solid var(--rs-color-border)" }}>
        <Button
          variant="primary"
          onClick={onRun}
          className="ws-checker-run"
          style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--rs-space-2)" }}
        >
          Soát báo cáo
        </Button>
      </div>

      {!hasRun && (
        <div className="ws-state-block" style={{ flexGrow: 1 }}>
          <EmptyState
            title="Báo cáo chưa được soát lỗi"
            message="Thực hiện kiểm tra báo cáo để phát hiện và rà soát các lỗi trước khi nộp bài."
            actionLabel="Soát báo cáo"
            onAction={onRun}
          />
        </div>
      )}

      {hasRun && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-3)" }}>
          <ReadinessBadge score={result.readinessScore} />

          {isDev && (
            <div
              title="Chỉ hiển thị ở môi trường phát triển — số ảnh hỏng (tương ứng lỗi 404 trong terminal)."
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--rs-space-2)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                border: "1px dashed var(--rs-color-border)",
                background: brokenAssetCount > 0 ? "var(--rs-color-bg-danger-weak)" : "var(--rs-color-bg-muted)",
                color: brokenAssetCount > 0 ? "var(--rs-color-text-danger)" : "var(--rs-color-text-secondary)",
              }}
            >
              <AlertCircle size={12} aria-hidden="true" />
              <span>Broken assets: {brokenAssetCount}</span>
              <span style={{ fontSize: "10px", opacity: 0.7 }}>(dev)</span>
            </div>
          )}

          {/* Quick Filters */}
          <div style={{ display: "flex", gap: "var(--rs-space-1)", overflowX: "auto", paddingBottom: "var(--rs-space-2)" }}>
            <button
              onClick={() => setActiveFilter("all")}
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 500,
                border: "none",
                background: activeFilter === "all" ? "var(--rs-color-bg-brand)" : "var(--rs-color-bg-muted)",
                color: activeFilter === "all" ? "var(--rs-color-text-brand-on)" : "var(--rs-color-text)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Tất cả ({counts.all})
            </button>
            <button
              onClick={() => setActiveFilter("error")}
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 500,
                border: "none",
                background: activeFilter === "error" ? "var(--rs-color-bg-danger-weak)" : "var(--rs-color-bg-muted)",
                color: activeFilter === "error" ? "var(--rs-color-text-danger)" : "var(--rs-color-text)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <AlertCircle size={12} /> Lỗi P0 ({counts.error})
            </button>
            <button
              onClick={() => setActiveFilter("warning")}
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 500,
                border: "none",
                background: activeFilter === "warning" ? "var(--rs-color-bg-warning-weak)" : "var(--rs-color-bg-muted)",
                color: activeFilter === "warning" ? "var(--rs-color-text-warning)" : "var(--rs-color-text)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <AlertTriangle size={12} /> Cảnh báo ({counts.warning})
            </button>
            <button
              onClick={() => setActiveFilter("info")}
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 500,
                border: "none",
                background: activeFilter === "info" ? "var(--rs-color-bg-info-weak)" : "var(--rs-color-bg-muted)",
                color: activeFilter === "info" ? "var(--rs-color-text-info)" : "var(--rs-color-text)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Info size={12} /> Gợi ý ({counts.info})
            </button>
          </div>

          {/* Search bar */}
          {issues.length > 0 && (
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Tìm kiếm vấn đề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 12px 6px 32px",
                  borderRadius: "6px",
                  border: "1px solid var(--rs-color-border)",
                  fontSize: "13px",
                  background: "var(--rs-color-bg)",
                  color: "var(--rs-color-text)",
                }}
              />
              <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--rs-color-text-secondary)" }} />
            </div>
          )}

          {/* List of issues */}
          {issues.length === 0 ? (
            <div className="ws-state-block">
              <SuccessState
                title="Tuyệt vời! Không có lỗi"
                message="Báo cáo của bạn đạt tất cả các tiêu chuẩn kiểm tra hiện tại."
              />
            </div>
          ) : filteredIssues.length === 0 ? (
            <div style={{ padding: "var(--rs-space-6) 0", textAlign: "center", color: "var(--rs-color-text-secondary)" }}>
              Không tìm thấy vấn đề phù hợp với bộ lọc.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--rs-space-3)" }}>
              {filteredIssues.map((issue, index) => {
                const isError = issue.severity === "error";
                const isWarning = issue.severity === "warning";
                
                let borderColor = "var(--rs-color-border)";
                let icon = <Info size={16} className="text-info" />;
                if (isError) {
                  borderColor = "var(--rs-color-border-danger)";
                  icon = <AlertCircle size={16} style={{ color: "var(--rs-color-text-danger)" }} />;
                } else if (isWarning) {
                  borderColor = "var(--rs-color-border-warning)";
                  icon = <AlertTriangle size={16} style={{ color: "var(--rs-color-text-warning)" }} />;
                }

                return (
                  <div
                    key={`${issue.id}-${issue.sectionId}-${issue.line}-${index}`}
                    style={{
                      borderLeft: `4px solid ${borderColor}`,
                      padding: "var(--rs-space-3)",
                      background: "var(--rs-color-bg-card)",
                      borderRadius: "0 6px 6px 0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--rs-space-1)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--rs-space-2)" }}>
                      <div style={{ display: "flex", gap: "var(--rs-space-2)", alignItems: "flex-start" }}>
                        <span style={{ marginTop: "2px" }}>{icon}</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--rs-color-text-primary)" }}>
                            {issue.message}
                          </span>
                          {issue.suggestion && (
                            <span style={{ fontSize: "12px", color: "var(--rs-color-text-secondary)", marginTop: "2px" }}>
                              {issue.suggestion}
                            </span>
                          )}
                          <div style={{ display: "flex", gap: "var(--rs-space-2)", marginTop: "var(--rs-space-2)", flexWrap: "wrap" }}>
                            {issue.sectionId && (
                              <span style={{ fontSize: "10px", padding: "2px 6px", background: "var(--rs-color-bg-muted)", borderRadius: "4px", color: "var(--rs-color-text-secondary)" }}>
                                Mục: {issue.sectionId}
                              </span>
                            )}
                            {issue.line !== undefined && (
                              <span style={{ fontSize: "10px", padding: "2px 6px", background: "var(--rs-color-bg-muted)", borderRadius: "4px", color: "var(--rs-color-text-secondary)" }}>
                                Dòng: {issue.line}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {issue.sectionId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onJump(issue.sectionId, issue.line)}
                          style={{
                            padding: "4px 8px",
                            height: "auto",
                            fontSize: "11px",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                            color: "var(--rs-color-text-brand)",
                          }}
                          aria-label={`Đi tới phần ${issue.sectionId}${issue.line !== undefined ? `, dòng ${issue.line}` : ""}`}
                        >
                          Xem <ArrowRight size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
