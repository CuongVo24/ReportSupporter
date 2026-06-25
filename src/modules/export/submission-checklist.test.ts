import { describe, it, expect } from "vitest";
import { buildSubmissionChecklist } from "./submission-checklist";
import type { ReportProjectBundle, CheckResult, ExportTarget } from "@/types";
import type { DocxLayoutCheck } from "./docx-layout-checklist";

describe("buildSubmissionChecklist", () => {
  const mockBundle: ReportProjectBundle = {
    project: {
      id: "test-proj",
      title: "Báo cáo thử nghiệm",
      templateId: "software-project",
      metadata: {
        school: "Đại học Công nghệ",
        members: ["Nguyễn Văn A"],
      },
      sections: [
        { id: "sec1", order: 0, title: "Mở đầu", markdown: "Nội dung mở đầu", status: "done" },
      ],
      updatedAt: "2026-06-24T22:00:00.000Z",
    },
    assets: [],
    evidence: [
      { id: "ev1", kind: "github", title: "Mã nguồn", url: "https://github.com", qrEnabled: true, createdAt: "2026" },
      { id: "ev2", kind: "video", title: "Video", url: "https://youtube.com", qrEnabled: true, createdAt: "2026" },
      { id: "ev3", kind: "deploy", title: "Deploy", url: "https://deploy.com", qrEnabled: true, createdAt: "2026" },
    ],
    formatSettings: {
      presetId: "academic-default",
      includeToc: true,
      includeListOfFigures: true,
      includeListOfTables: true,
      captionNumbering: "continuous",
    },
    schemaVersion: 1,
  };

  const mockCheck: CheckResult = {
    issues: [],
    grouped: {
      error: [],
      warning: [],
      info: [],
    },
    readinessScore: 90,
    ranAt: "2026-06-24T22:00:00.000Z",
  };

  const mockDocxLayout: DocxLayoutCheck[] = [
    { id: "page-setup-size", ok: true, detail: "Kích thước trang là A4." },
    { id: "page-setup-margins", ok: true, detail: "Lề trang hợp lệ." },
  ];

  const mockExportedTargets: ExportTarget[] = ["docx"];

  it("should pass all checks if all criteria are fully met", () => {
    const checklist = buildSubmissionChecklist({
      check: mockCheck,
      docxLayout: mockDocxLayout,
      exportedTargets: mockExportedTargets,
      bundle: mockBundle,
    });

    expect(checklist).toHaveLength(5);
    expect(checklist.every((item) => item.done)).toBe(true);
    expect(checklist.find((item) => item.id === "readiness-score")?.severity).toBeUndefined();
  });

  it("should fail readiness-score check if readiness score is below threshold", () => {
    const lowReadinessCheck = {
      ...mockCheck,
      readinessScore: 75, // Below default 80 threshold
    };

    const checklist = buildSubmissionChecklist({
      check: lowReadinessCheck,
      docxLayout: mockDocxLayout,
      exportedTargets: mockExportedTargets,
      bundle: mockBundle,
    });

    const item = checklist.find((i) => i.id === "readiness-score");
    expect(item?.done).toBe(false);
    expect(item?.severity).toBe("error");
    expect(item?.detail).toContain("75/100");
  });

  it("should fail readiness-score check with custom threshold", () => {
    const checklist = buildSubmissionChecklist({
      check: { ...mockCheck, readinessScore: 85 },
      docxLayout: mockDocxLayout,
      exportedTargets: mockExportedTargets,
      bundle: mockBundle,
      readinessThreshold: 90, // Custom threshold above readinessScore
    });

    const item = checklist.find((i) => i.id === "readiness-score");
    expect(item?.done).toBe(false);
    expect(item?.detail).toContain("yêu cầu tối thiểu 90/100");
  });

  it("should fail no-error-issues check if there is an error-level issue", () => {
    const errorCheck: CheckResult = {
      ...mockCheck,
      issues: [
        {
          id: "rule-1",
          severity: "error",
          module: "check",
          message: "Lỗi kiểm thử",
          suggestion: "Khắc phục lỗi",
        },
      ],
    };

    const checklist = buildSubmissionChecklist({
      check: errorCheck,
      docxLayout: mockDocxLayout,
      exportedTargets: mockExportedTargets,
      bundle: mockBundle,
    });

    const item = checklist.find((i) => i.id === "no-error-issues");
    expect(item?.done).toBe(false);
    expect(item?.severity).toBe("error");
    expect(item?.detail).toContain("1 lỗi nghiêm trọng");
  });

  it("should fail required-evidence check if required evidence kinds are missing", () => {
    const incompleteCheck: CheckResult = {
      ...mockCheck,
      issues: [
        {
          id: "missing-required-evidence",
          severity: "error",
          module: "check",
          message: "Thêm minh chứng bắt buộc trong Evidence Kit (GitHub/demo/deploy/video). Missing kind: video.",
          suggestion: "Vui lòng thêm một minh chứng loại video trong danh sách Evidence Kit.",
        },
      ],
    };

    const checklist = buildSubmissionChecklist({
      check: incompleteCheck,
      docxLayout: mockDocxLayout,
      exportedTargets: mockExportedTargets,
      bundle: mockBundle,
    });

    const item = checklist.find((i) => i.id === "required-evidence");
    expect(item?.done).toBe(false);
    expect(item?.severity).toBe("error");
    expect(item?.detail).toContain("Missing kind: video");
  });

  it("should fail docx-layout check if any layout checks are not ok", () => {
    const failedDocxLayout: DocxLayoutCheck[] = [
      { id: "page-setup-size", ok: true, detail: "Kích thước trang là A4." },
      { id: "page-setup-margins", ok: false, detail: "Lề trang không đúng tỉ lệ." },
    ];

    const checklist = buildSubmissionChecklist({
      check: mockCheck,
      docxLayout: failedDocxLayout,
      exportedTargets: mockExportedTargets,
      bundle: mockBundle,
    });

    const item = checklist.find((i) => i.id === "docx-layout");
    expect(item?.done).toBe(false);
    expect(item?.severity).toBe("error");
    expect(item?.detail).toContain("Lề trang không đúng tỉ lệ");
  });

  it("should fail exported-targets check if exported targets is empty", () => {
    const checklist = buildSubmissionChecklist({
      check: mockCheck,
      docxLayout: mockDocxLayout,
      exportedTargets: [],
      bundle: mockBundle,
    });

    const item = checklist.find((i) => i.id === "exported-targets");
    expect(item?.done).toBe(false);
    expect(item?.severity).toBe("warning");
    expect(item?.detail).toContain("Chưa xuất bản định dạng báo cáo nào");
  });

  it("should be deterministic for identical inputs", () => {
    const checklist1 = buildSubmissionChecklist({
      check: mockCheck,
      docxLayout: mockDocxLayout,
      exportedTargets: mockExportedTargets,
      bundle: mockBundle,
    });

    const checklist2 = buildSubmissionChecklist({
      check: mockCheck,
      docxLayout: mockDocxLayout,
      exportedTargets: mockExportedTargets,
      bundle: mockBundle,
    });

    expect(checklist1).toEqual(checklist2);
  });
});
