import type { CheckResult, ReportProjectBundle, ExportTarget, SubmissionChecklistItem } from "@/types";
import type { DocxLayoutCheck } from "./docx-layout-checklist";

/**
 * Builds the final submission checklist aggregating readiness score, error issues,
 * required evidence kinds, DOCX layout status, and exported targets.
 */
export function buildSubmissionChecklist(input: {
  check: CheckResult;
  docxLayout: DocxLayoutCheck[];
  exportedTargets: ExportTarget[];
  bundle: ReportProjectBundle;
  readinessThreshold?: number;
}): SubmissionChecklistItem[] {
  const { check, docxLayout, exportedTargets, readinessThreshold } = input;
  const threshold = readinessThreshold !== undefined ? readinessThreshold : 80;
  const checklist: SubmissionChecklistItem[] = [];

  // 1. Điểm sẵn sàng nộp bài (readiness-score)
  const isReadinessDone = check.readinessScore >= threshold;
  checklist.push({
    id: "readiness-score",
    label: "Điểm sẵn sàng nộp bài",
    done: isReadinessDone,
    detail: `Điểm sẵn sàng của bạn là ${check.readinessScore}/100 (yêu cầu tối thiểu ${threshold}/100).`,
    severity: isReadinessDone ? undefined : "error",
  });

  // 2. Không còn lỗi nghiêm trọng (no-error-issues)
  const errorIssues = check.issues.filter((issue) => issue.severity === "error");
  const isNoErrorDone = errorIssues.length === 0;
  checklist.push({
    id: "no-error-issues",
    label: "Không còn lỗi nghiêm trọng",
    done: isNoErrorDone,
    detail: isNoErrorDone
      ? "Không phát hiện lỗi nghiêm trọng nào."
      : `Còn ${errorIssues.length} lỗi nghiêm trọng cần khắc phục.`,
    severity: isNoErrorDone ? undefined : "error",
  });

  // 3. Đầy đủ minh chứng bắt buộc (required-evidence)
  const missingEvidence = check.issues.filter((i) => i.id === "missing-required-evidence");
  const isEvidenceDone = missingEvidence.length === 0;
  
  checklist.push({
    id: "required-evidence",
    label: "Đầy đủ minh chứng bắt buộc",
    done: isEvidenceDone,
    detail: isEvidenceDone
      ? "Đầy đủ minh chứng bắt buộc theo yêu cầu của mẫu báo cáo."
      : missingEvidence.map((i) => i.message).join("; "),
    severity: isEvidenceDone ? undefined : "error",
  });

  // 4. Định dạng xuất bản DOCX (docx-layout)
  const failedLayoutChecks = docxLayout.filter((check) => !check.ok);
  const isLayoutDone = failedLayoutChecks.length === 0;
  checklist.push({
    id: "docx-layout",
    label: "Định dạng xuất bản DOCX",
    done: isLayoutDone,
    detail: isLayoutDone
      ? "Định dạng layout DOCX đạt chuẩn xuất bản."
      : `Phát hiện lỗi định dạng DOCX: ${failedLayoutChecks.map((c) => c.detail).join("; ")}`,
    severity: isLayoutDone ? undefined : "error",
  });

  // 5. Đã xuất bản ít nhất một định dạng (exported-targets)
  const isExportedDone = exportedTargets && exportedTargets.length > 0;
  checklist.push({
    id: "exported-targets",
    label: "Đã xuất bản ít nhất một định dạng",
    done: isExportedDone,
    detail: isExportedDone
      ? `Đã xuất bản các định dạng: ${exportedTargets.map((t) => t.toUpperCase()).join(", ")}.`
      : "Chưa xuất bản định dạng báo cáo nào (HTML, PDF, hoặc DOCX).",
    severity: isExportedDone ? undefined : "warning",
  });

  return checklist;
}
