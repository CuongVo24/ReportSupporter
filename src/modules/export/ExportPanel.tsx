import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CheckResult, ReportProjectBundle, ExportJob, ExportTarget } from "@/types";
import { EmptyState, ErrorState } from "@/components/states";
import { Button, Dialog, Toast } from "@/components/ui";
import { buildPreflightResult } from "./preflight";
import { loadExportHistory, clearExportHistory } from "./export-history";

export function ExportPanel({
  bundle,
  check,
  jobs,
  runExport,
  retry,
  exportedBlobs,
}: {
  bundle: ReportProjectBundle;
  check?: CheckResult;
  jobs: ExportJob[];
  runExport: (target: ExportTarget, bundle: ReportProjectBundle) => Promise<void>;
  retry: (jobId: string, overrideBundle?: ReportProjectBundle) => Promise<void>;
  exportedBlobs?: Partial<Record<ExportTarget, Blob>>;
}) {
  const [pendingTarget, setPendingTarget] = useState<ExportTarget | null>(null);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [preflightResult, setPreflightResult] = useState<ReturnType<typeof buildPreflightResult> | null>(null);

  // Persistent history states
  const [history, setHistory] = useState<ExportJob[]>([]);

  const refreshHistory = useCallback(async () => {
    const list = await loadExportHistory();
    setHistory(list);
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory, jobs]);

  const handleClearHistory = async () => {
    await clearExportHistory();
    await refreshHistory();
  };

  const combinedJobs = useMemo(() => {
    const map = new Map<string, ExportJob>();
    for (const job of history) {
      map.set(job.id, job);
    }
    for (const job of jobs) {
      map.set(job.id, job);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }, [history, jobs]);

  // Toast states
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("success");
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | undefined>(undefined);

  const errorsCount = check?.grouped?.error?.length ?? 0;

  const prevJobsRef = useRef<ExportJob[]>([]);

  useEffect(() => {
    const prevJobs = prevJobsRef.current;
    for (const job of jobs) {
      const prevJob = prevJobs.find((j) => j.id === job.id);
      const wasRunning = prevJob ? prevJob.status === "running" : false;
      const isNewAndDone = !prevJob && job.status === "done";
      if ((wasRunning || isNewAndDone) && job.status === "done") {
        // Trigger success toast
        const labelMap: Record<ExportTarget, string> = {
          html: "HTML",
          pdf: "PDF",
          docx: "Word (DOCX)",
          pptx: "PowerPoint (PPTX)",
        };
        const target = job.target;
        setToastVariant("success");
        setToastTitle(`Đã xuất ${labelMap[target]}`);
        setToastAction({
          label: "Mở file",
          onClick: () => {
            const blob = exportedBlobs?.[target];
            if (blob) {
              const url = URL.createObjectURL(blob);
              window.open(url, "_blank");
            } else {
              console.warn("Blob not found for target", target);
            }
          },
        });
        setToastOpen(true);
      }
    }
    prevJobsRef.current = jobs;
  }, [jobs, exportedBlobs]);

  const handleExportClick = (target: ExportTarget) => {
    const preflight = buildPreflightResult(bundle);
    if (preflight.issues.length > 0) {
      // Always show the unified preflight dialog when there are any issues
      setPreflightResult(preflight);
      setPendingTarget(target);
      setIsValidationOpen(true);
    } else {
      // No issues at all — direct export
      void runExport(target, bundle);
    }
  };

  const handleConfirmValidationExport = () => {
    // Only allow export when there are no P0 issues (button should be disabled, but defense-in-depth)
    if (preflightResult?.hasP0) return;
    setIsValidationOpen(false);
    setPreflightResult(null);
    if (pendingTarget) {
      const target = pendingTarget;
      setPendingTarget(null);
      void runExport(target, bundle);
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case "html":
        return "HTML (Web)";
      case "pdf":
        return "PDF (Bản in)";
      case "docx":
        return "Word (DOCX)";
      default:
        return target.toUpperCase();
    }
  };

  const getJobStatusElement = (job: ExportJob) => {
    switch (job.status) {
      case "running": {
        let phaseText = "Đang xử lý...";
        if (job.phase === "preparing") phaseText = "Chuẩn bị...";
        if (job.phase === "rendering-assets") phaseText = "Đang tạo ảnh/sơ đồ...";
        if (job.phase === "ready") phaseText = "Đang bố cục trang in...";
        if (job.phase === "printing") phaseText = "Đang in...";

        return (
          <span className="ws-export-status ws-export-status-running" aria-live="polite">
            <svg className="ws-export-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="ws-export-spinner-bg" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
            </svg>
            {phaseText}
          </span>
        );
      }
      case "done":
        return (
          <span className="ws-export-status ws-export-status-done">
            <svg className="ws-export-icon-check" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Hoàn thành
          </span>
        );
      case "error":
        return (
          <span className="ws-export-status ws-export-status-error">
            <svg className="ws-export-icon-cross" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Lỗi
          </span>
        );
      default:
        return <span className="ws-export-status">{status}</span>;
    }
  };

  const validationDialogFooter = (
    <div style={{ display: "flex", gap: "var(--rs-space-2)", justifyContent: "flex-end", width: "100%" }}>
      <Button variant="ghost" onClick={() => { setIsValidationOpen(false); setPreflightResult(null); setPendingTarget(null); }}>
        {preflightResult?.hasP0 ? "Đóng" : "Hủy"}
      </Button>
      <Button
        variant={preflightResult?.ok ? "primary" : "secondary"}
        disabled={preflightResult?.hasP0}
        aria-disabled={preflightResult?.hasP0 || undefined}
        title={preflightResult?.hasP0 ? "Còn lỗi bắt buộc — hãy sửa trước khi xuất bản" : undefined}
        onClick={handleConfirmValidationExport}
      >
        Vẫn xuất bản
      </Button>
    </div>
  );

  return (
    <div className="ws-export-panel">
      <h3 className="ws-export-title">Xuất bản báo cáo</h3>

      {errorsCount > 0 && (
        <div className="ws-export-banner" role="alert">
          <svg className="ws-export-banner-icon" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="ws-export-banner-content">
            <span className="ws-export-banner-text">
              Báo cáo còn {errorsCount} lỗi định dạng/nội dung chưa sửa.
            </span>
            <p className="ws-export-banner-sub">
              Bạn vẫn có thể xuất bản, nhưng nên sửa để có định dạng tốt nhất.
            </p>
          </div>
        </div>
      )}

      <div className="ws-export-targets">
        <div className="ws-export-targets-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--rs-space-3)" }}>
          <Button
            variant="secondary"
            loading={jobs.some((j) => j.target === "html" && j.status === "running")}
            onClick={() => handleExportClick("html")}
            leadingIcon={
              <svg className="ws-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            }
            aria-label="Xuất bản định dạng HTML"
            fullWidth
          >
            Xuất HTML
          </Button>

          <Button
            variant="secondary"
            loading={jobs.some((j) => j.target === "pdf" && j.status === "running")}
            onClick={() => handleExportClick("pdf")}
            leadingIcon={
              <svg className="ws-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            }
            aria-label="Xuất bản định dạng PDF"
            fullWidth
          >
            Xuất PDF
          </Button>

          <Button
            variant="secondary"
            loading={jobs.some((j) => j.target === "docx" && j.status === "running")}
            onClick={() => handleExportClick("docx")}
            leadingIcon={
              <svg className="ws-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            aria-label="Xuất bản định dạng Word"
            fullWidth
          >
            Xuất DOCX
          </Button>
        </div>
      </div>

      <div className="ws-export-jobs-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--rs-space-2)" }}>
          <h4 className="ws-export-section-subtitle" style={{ margin: 0 }}>Lịch sử xuất bản</h4>
          {combinedJobs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              style={{ fontSize: "11px", color: "var(--rs-color-text-muted)", height: "auto", padding: "2px 6px" }}
            >
              Xóa lịch sử
            </Button>
          )}
        </div>
        {combinedJobs.length === 0 ? (
          <div className="ws-state-block-sm">
            <EmptyState
              title="Chưa có lịch sử xuất bản"
              message="Lịch sử các tệp tin đã xuất bản (HTML, PDF, DOCX) sẽ hiển thị ở đây."
            />
          </div>
        ) : (
          <ul className="ws-export-jobs-list">
            {combinedJobs.map((job) => (
              <li key={job.id} className={`ws-export-job ws-export-job-${job.status}`}>
                <div className="ws-export-job-header">
                  <span className="ws-export-job-target-badge">
                    {getTargetLabel(job.target)}
                  </span>
                  {getJobStatusElement(job)}
                </div>
                <div className="ws-export-job-filename" title={job.fileName}>
                  {job.fileName}
                </div>
                {job.status === "error" && job.error && (
                  <div className="ws-export-job-error-block">
                    <ErrorState
                      title={`Lỗi xuất bản (${job.error.stage})`}
                      message={job.error.message}
                      actionLabel={job.error.recoverable ? "Thử lại" : undefined}
                      onAction={job.error.recoverable ? () => retry(job.id) : undefined}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Unified Preflight Dialog (P0 blocking + warnings) */}
      <Dialog
        isOpen={isValidationOpen}
        onOpenChange={(open) => {
          setIsValidationOpen(open);
          if (!open) {
            setPreflightResult(null);
            setPendingTarget(null);
          }
        }}
        title={
          preflightResult?.hasP0
            ? "Không thể xuất bản — còn lỗi bắt buộc"
            : "Kiểm tra chất lượng báo cáo"
        }
        description={
          preflightResult?.hasP0
            ? `Còn ${preflightResult.issues.filter((i) => i.severity === "error").length} lỗi bắt buộc phải sửa trước khi xuất bản.`
            : preflightResult?.ok
              ? "Báo cáo có một số cảnh báo định dạng nhẹ. Bạn vẫn có thể xuất bản."
              : "Phát hiện lỗi nghiêm trọng (ví dụ: ảnh chưa được nhúng). Tệp tin xuất ra (PDF/Word) có thể bị lỗi hình ảnh hoặc hiển thị."
        }
        variant="confirm"
        footer={validationDialogFooter}
      >
        <div className="ws-validation-list">
          {preflightResult?.issues.map((issue, idx) => (
            <div
              key={idx}
              className={`ws-validation-item ws-validation-item-${issue.severity}`}
            >
              <span className="ws-validation-icon">
                {issue.severity === "error" ? "🚫" : "⚠️"}
              </span>
              <div className="ws-validation-msg">
                {issue.sectionId && (
                  <span className="ws-validation-section">
                    [{bundle.project.sections.find((s) => s.id === issue.sectionId)?.title || issue.sectionId}]:
                  </span>
                )}
                {issue.message}
                {issue.guidance && (
                  <span className="ws-validation-guidance"> — {issue.guidance}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Dialog>

      {/* Export Toast Notification */}
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant={toastVariant}
        title={toastTitle}
        action={toastAction}
      />
    </div>
  );
}
