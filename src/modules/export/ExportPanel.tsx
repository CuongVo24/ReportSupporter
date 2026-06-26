import { useState, useEffect, useRef } from "react";
import type { CheckResult, ReportProjectBundle, ExportJob, ExportTarget } from "@/types";
import { EmptyState, ErrorState } from "@/components/states";
import { Button, Dialog, Toast } from "@/components/ui";

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<ExportTarget | null>(null);

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
    if (errorsCount > 0) {
      setPendingTarget(target);
      setIsConfirmOpen(true);
    } else {
      void runExport(target, bundle);
    }
  };

  const handleConfirmExport = () => {
    if (pendingTarget) {
      void runExport(pendingTarget, bundle);
      setPendingTarget(null);
    }
    setIsConfirmOpen(false);
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

  const getJobStatusElement = (status: string) => {
    switch (status) {
      case "running":
        return (
          <span className="ws-export-status ws-export-status-running" aria-live="polite">
            <svg className="ws-export-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="ws-export-spinner-bg" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
            </svg>
            Đang xử lý...
          </span>
        );
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

  const dialogFooter = (
    <div style={{ display: "flex", gap: "var(--rs-space-2)", justifyContent: "flex-end", width: "100%" }}>
      <Button variant="ghost" onClick={() => { setIsConfirmOpen(false); setPendingTarget(null); }}>
        Hủy
      </Button>
      <Button variant="primary" onClick={handleConfirmExport}>
        Vẫn xuất
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
        <div className="ws-export-targets-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--rs-space-3)" }}>
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

          <Button
            disabled
            variant="secondary"
            leadingIcon={
              <svg className="ws-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
            aria-label="Xuất PowerPoint (PPTX) - Tạm hoãn"
            fullWidth
          >
            Xuất PPTX (Phase 3)
          </Button>
        </div>
        <p style={{ fontSize: "var(--rs-font-size-xs)", color: "var(--rs-color-text-muted)", marginTop: "var(--rs-space-2)", fontStyle: "italic" }}>
          * Tính năng xuất PowerPoint (PPTX) hiện tại đang tạm hoãn (cần bật Phase 3).
        </p>
      </div>

      <div className="ws-export-jobs-container">
        <h4 className="ws-export-section-subtitle">Lịch sử xuất bản</h4>
        {jobs.length === 0 ? (
          <div className="ws-state-block-sm">
            <EmptyState
              title="Chưa có lịch sử xuất bản"
              message="Lịch sử các tệp tin đã xuất bản (HTML, PDF, DOCX) trong phiên này sẽ hiển thị ở đây."
            />
          </div>
        ) : (
          <ul className="ws-export-jobs-list">
            {jobs.map((job) => (
              <li key={job.id} className={`ws-export-job ws-export-job-${job.status}`}>
                <div className="ws-export-job-header">
                  <span className="ws-export-job-target-badge">
                    {getTargetLabel(job.target)}
                  </span>
                  {getJobStatusElement(job.status)}
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

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={isConfirmOpen}
        onOpenChange={(open) => {
          setIsConfirmOpen(open);
          if (!open) setPendingTarget(null);
        }}
        title="Vẫn xuất dù còn lỗi?"
        description={`Báo cáo còn ${errorsCount} lỗi chặn. Nên sửa trước khi nộp.`}
        variant="confirm"
        footer={dialogFooter}
      />

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
