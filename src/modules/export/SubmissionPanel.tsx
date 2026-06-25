import { useState, useCallback, useEffect } from "react";
import type { CheckResult, ReportProjectBundle, ExportTarget, ExportJob } from "@/types";
import { buildSubmissionChecklist } from "./submission-checklist";
import { buildSubmissionZip } from "./build-submission-zip";
import { generateReadme } from "./generate-readme";
import { buildEvidenceAppendix } from "@/modules/evidence";
import { verifyDocxLayout } from "./docx-layout-checklist";
import { clearExportHistory, loadExportHistory } from "./export-history";

/**
 * Panel to manage final submission packaging, checklist validation, and local export history.
 */
export function SubmissionPanel({
  bundle,
  check,
  exportedBlobs,
  jobs,
}: {
  bundle: ReportProjectBundle;
  check?: CheckResult;
  exportedBlobs: Partial<Record<ExportTarget, Blob>>;
  jobs: ExportJob[];
}) {
  const [history, setHistory] = useState<ExportJob[]>([]);
  const [packaging, setPackaging] = useState(false);

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

  const emptyCheck: CheckResult = {
    issues: [],
    grouped: { error: [], warning: [], info: [] },
    readinessScore: 0,
    ranAt: new Date().toISOString(),
  };

  const checkResult = check || emptyCheck;
  const docxLayout = verifyDocxLayout(bundle);

  const exportedTargets = Array.from(
    new Set(
      history
        .filter((j) => j.status === "done")
        .map((j) => j.target)
    )
  );

  const checklistItems = buildSubmissionChecklist({
    check: checkResult,
    docxLayout,
    exportedTargets,
    bundle,
  });

  const hasSessionBlobs = Object.keys(exportedBlobs).length > 0;

  const handleDownloadPackage = async () => {
    try {
      setPackaging(true);
      const readmeMarkdown = generateReadme(bundle);
      const evidenceAppendixMarkdown = buildEvidenceAppendix(bundle.evidence || []);

      const pkg = await buildSubmissionZip({
        bundle,
        exports: exportedBlobs,
        readmeMarkdown,
        evidenceAppendixMarkdown,
      });

      const safeTitle = bundle.project?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "report";
      const fileName = `${safeTitle}-evidence.zip`;

      const url = URL.createObjectURL(pkg.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to build submission package:", err);
    } finally {
      setPackaging(false);
    }
  };

  return (
    <div className="ws-submission-panel">
      <h3 className="ws-submission-title">Đóng gói nộp bài</h3>

      <div className="ws-submission-checklist-container">
        <h4 className="ws-submission-checklist-title">Checklist kiểm tra báo cáo</h4>
        {check === undefined ? (
          <div className="ws-submission-checklist-warning">
            Hãy chạy Kiểm tra (Checker) trước khi đối chiếu checklist.
          </div>
        ) : (
          <ul className="ws-submission-checklist">
            {checklistItems.map((item) => (
              <li
                key={item.id}
                className={`ws-submission-checklist-item ${
                  item.done
                    ? "ws-submission-checklist-item-done"
                    : item.severity === "error"
                    ? "ws-submission-checklist-item-fail"
                    : "ws-submission-checklist-item-warn"
                }`}
              >
                {item.done ? (
                  <svg className="ws-submission-checklist-icon" aria-hidden="true" style={{ color: "var(--rs-color-success)" }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="ws-submission-checklist-icon" aria-hidden="true" style={{ color: item.severity === "error" ? "var(--rs-color-severity-error)" : "var(--rs-color-severity-warning)" }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="ws-submission-checklist-content">
                  <span className="ws-visually-hidden">
                    {item.done ? "Đạt" : item.severity === "error" ? "Chưa đạt — lỗi" : "Chưa đạt — cảnh báo"}
                  </span>
                  <span className="ws-submission-checklist-label">{item.label}</span>
                  <span className="ws-submission-checklist-detail">{item.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!hasSessionBlobs && (
        <div className="ws-submission-blobs-warning">
          Bộ nộp sẽ <strong>không</strong> kèm file báo cáo (report.html/pdf/docx) vì bạn chưa export trong phiên này — hãy export lại trước khi đóng gói.
        </div>
      )}

      <button
        onClick={handleDownloadPackage}
        disabled={packaging}
        className="ws-submission-btn"
        aria-label="Tải về bộ nộp bài"
      >
        {packaging ? "Đang đóng gói..." : "Tải về evidence.zip"}
      </button>

      {history.length > 0 && (
        <div className="ws-submission-history-container">
          <div className="ws-submission-history-header">
            <h4 className="ws-submission-checklist-title">Lịch sử xuất bản cục bộ</h4>
            <button
              onClick={handleClearHistory}
              className="ws-submission-clear-btn"
              aria-label="Xóa lịch sử xuất bản"
            >
              Xóa lịch sử
            </button>
          </div>
          <ul className="ws-export-jobs-list">
            {history.slice(0, 5).map((job) => (
              <li key={job.id} className={`ws-export-job ws-export-job-${job.status}`}>
                <div className="ws-export-job-header">
                  <span className="ws-export-job-target-badge">
                    {job.target.toUpperCase()}
                  </span>
                  <span className="ws-export-job-filename" style={{ margin: 0, fontSize: "var(--rs-font-size-xs)" }}>
                    {new Date(job.startedAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="ws-export-job-filename" title={job.fileName}>
                  {job.fileName} ({job.status === "done" ? "Thành công" : "Lỗi"})
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
