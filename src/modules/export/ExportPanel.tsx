import type { CheckResult, ReportProjectBundle, ExportJob, ExportTarget } from "@/types";
import { EmptyState, ErrorState } from "@/components/states";

export function ExportPanel({
  bundle,
  check,
  jobs,
  runExport,
  retry,
}: {
  bundle: ReportProjectBundle;
  check?: CheckResult;
  jobs: ExportJob[];
  runExport: (target: ExportTarget, bundle: ReportProjectBundle) => Promise<void>;
  retry: (jobId: string, overrideBundle?: ReportProjectBundle) => Promise<void>;
}) {

  const errorsCount = check?.grouped?.error?.length ?? 0;

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
        <div className="ws-export-targets-grid">
          <button
            onClick={() => runExport("html", bundle)}
            disabled={jobs.some((j) => j.target === "html" && j.status === "running")}
            className="ws-export-btn ws-export-btn-html"
            aria-label="Xuất bản định dạng HTML"
          >
            <svg className="ws-export-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="ws-export-btn-text">HTML (Web)</span>
          </button>

          <button
            onClick={() => runExport("pdf", bundle)}
            disabled={jobs.some((j) => j.target === "pdf" && j.status === "running")}
            className="ws-export-btn ws-export-btn-pdf"
            aria-label="Xuất bản định dạng PDF"
          >
            <svg className="ws-export-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="ws-export-btn-text">PDF (Bản in)</span>
          </button>

          <button
            onClick={() => runExport("docx", bundle)}
            disabled={jobs.some((j) => j.target === "docx" && j.status === "running")}
            className="ws-export-btn ws-export-btn-docx"
            aria-label="Xuất bản định dạng Word"
          >
            <svg className="ws-export-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="ws-export-btn-text">Word (DOCX)</span>
          </button>
        </div>
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
    </div>
  );
}
