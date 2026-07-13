import { useState, useCallback, useEffect } from "react";
import type { CheckResult, ReportProjectBundle, ExportTarget, ExportJob } from "@/types";
import { buildSubmissionChecklist } from "./submission-checklist";
import { buildSubmissionZip } from "./build-submission-zip";
import { generateReadme } from "./generate-readme";
import { buildEvidenceAppendix } from "@/modules/evidence";
import { verifyDocxLayout } from "./docx-layout-checklist";
import { clearExportHistory, loadExportHistory } from "./export-history";
import { Button, Dialog } from "@/components/ui";
import { validateExport, type ExportIssue } from "./validate-export";
import { runChecker } from "@/modules/check/run-checker";

export interface PreflightIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  sectionId?: string;
  guidance?: string;
}

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
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [preflightResult, setPreflightResult] = useState<{
    ok: boolean;
    hasP0: boolean;
    issues: PreflightIssue[];
  } | null>(null);

  // --- Preflight: merge validateExport + runChecker into a unified result ---
  const buildPreflightResult = (b: ReportProjectBundle) => {
    const valResult = validateExport(b);
    const checkResult = runChecker(b);
    const p0Issues = checkResult.issues.filter((i) => i.severity === "error");

    // Map checker P0 issues into PreflightIssue format
    const checkerPreflightIssues: PreflightIssue[] = p0Issues.map((ci) => ({
      severity: "error" as const,
      code: "CHECKER_P0" as const,
      message: ci.message,
      sectionId: ci.sectionId,
      guidance: ci.suggestion,
    }));

    // Map validateExport issues (keep as-is)
    const valPreflightIssues: PreflightIssue[] = valResult.issues.map((vi) => ({
      ...vi,
      guidance: undefined,
    }));

    // P0 errors first, then warnings
    const allIssues = [...checkerPreflightIssues, ...valPreflightIssues];
    const hasP0 = checkerPreflightIssues.length > 0;

    return {
      ok: !hasP0 && valResult.ok,
      hasP0,
      issues: allIssues,
    };
  };

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

  const executeDownloadPackage = async () => {
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

  const handleDownloadPackage = async () => {
    const preflight = buildPreflightResult(bundle);
    if (preflight.issues.length > 0) {
      setPreflightResult(preflight);
      setIsValidationOpen(true);
    } else {
      await executeDownloadPackage();
    }
  };

  const handleConfirmValidationDownload = async () => {
    if (preflightResult?.hasP0) return;
    setIsValidationOpen(false);
    setPreflightResult(null);
    await executeDownloadPackage();
  };

  return (
    <div className="ws-submission-panel">
      <h3 className="ws-submission-title">Đóng gói nộp bài</h3>

      <div className="ws-submission-checklist-container">
        <h4 className="ws-submission-checklist-title">Checklist kiểm tra báo cáo</h4>
        {check === undefined ? (
          <div className="ws-submission-checklist-warning">
            Soát báo cáo để rà lỗi trước khi nộp.
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
        <div className="ws-submission-blobs-warning" style={{ marginTop: "var(--rs-space-3)", marginBottom: "var(--rs-space-2)" }}>
          Bộ nộp sẽ <strong>không</strong> kèm file báo cáo (report.html/pdf/docx) vì bạn chưa xuất bản trong phiên này — hãy xuất bản lại trước khi đóng gói.
        </div>
      )}

      <Button
        onClick={handleDownloadPackage}
        loading={packaging}
        variant="primary"
        fullWidth
        className="ws-submission-btn"
        aria-label="Tải về bộ nộp bài"
        style={{ marginTop: "var(--rs-space-4)", marginBottom: "var(--rs-space-4)" }}
      >
        Tải về evidence.zip
      </Button>

      {history.length > 0 && (
        <div className="ws-submission-history-container">
          <div className="ws-submission-history-header">
            <h4 className="ws-submission-checklist-title">Lịch sử xuất bản cục bộ</h4>
            <Button
              onClick={handleClearHistory}
              variant="ghost"
              size="sm"
              className="ws-submission-clear-btn"
              aria-label="Xóa lịch sử xuất bản"
            >
              Xóa lịch sử
            </Button>
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
      {/* Unified Preflight Dialog (P0 blocking + warnings) */}
      <Dialog
        isOpen={isValidationOpen}
        onOpenChange={(open) => {
          setIsValidationOpen(open);
          if (!open) {
            setPreflightResult(null);
          }
        }}
        title={
          preflightResult?.hasP0
            ? "Không thể đóng gói — còn lỗi bắt buộc"
            : "Kiểm tra chất lượng báo cáo trước khi nộp"
        }
        description={
          preflightResult?.hasP0
            ? `Còn ${preflightResult.issues.filter((i) => i.severity === "error").length} lỗi bắt buộc phải sửa trước khi tải gói nộp bài.`
            : preflightResult?.ok
              ? "Báo cáo đạt chất lượng cơ bản, chỉ có cảnh báo định dạng nhẹ. Bạn có thể tiếp tục đóng gói."
              : "Cảnh báo lỗi nghiêm trọng (ảnh chưa nhúng). Tệp tin trong bộ nộp bài có thể bị lỗi hình ảnh hoặc hiển thị."
        }
        variant="confirm"
        footer={
          <div style={{ display: "flex", gap: "var(--rs-space-2)", justifyContent: "flex-end", width: "100%" }}>
            <Button variant="ghost" onClick={() => { setIsValidationOpen(false); setPreflightResult(null); }}>
              {preflightResult?.hasP0 ? "Đóng" : "Hủy"}
            </Button>
            {!preflightResult?.hasP0 && (
              <Button
                variant={preflightResult?.ok ? "primary" : "secondary"}
                onClick={handleConfirmValidationDownload}
              >
                Vẫn tải xuống
              </Button>
            )}
          </div>
        }
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
    </div>
  );
}
