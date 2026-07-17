// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SubmissionPanel } from "./SubmissionPanel";
import type { ReportProjectBundle, CheckResult } from "@/types";
import { runChecker } from "@/modules/check/run-checker";
import { validateExport } from "./validate-export";

vi.mock("@/modules/check/run-checker", () => ({
  runChecker: vi.fn(),
}));

vi.mock("./validate-export", () => ({
  validateExport: vi.fn(),
}));

describe("SubmissionPanel Preflight Integration", () => {
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
        { id: "sec1", order: 0, title: "Mở đầu", markdown: "Nội dung mở đầu", status: "done",
        revision: 0 },
      ],
      updatedAt: "2026-06-24T22:00:00.000Z",
    },
    assets: [],
    evidence: [],
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
    readinessScore: 85,
    ranAt: "2026-06-24T22:00:00.000Z",
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("blocks submission package download and disables 'Vẫn tải xuống' button when P0 errors exist", async () => {
    // Mock runChecker to return a P0 error
    vi.mocked(runChecker).mockReturnValue({
      issues: [
        {
          id: "rule-deploy",
          severity: "error",
          module: "check",
          message: "Thiếu link deploy bắt buộc",
          suggestion: "Thêm link deploy vào Evidence Kit",
          sectionId: "sec1",
        },
      ],
      grouped: {
        error: [{ id: "rule-deploy", severity: "error", module: "check", message: "Thiếu", suggestion: "" }],
        warning: [],
        info: [],
      },
      readinessScore: 50,
      ranAt: "2026-06-24T22:00:00.000Z",
    });

    vi.mocked(validateExport).mockReturnValue({
      ok: true,
      issues: [],
    });

    render(
      <SubmissionPanel
        bundle={mockBundle}
        check={mockCheck}
        exportedBlobs={{ html: new Blob([""], { type: "text/html" }) }}
        jobs={[]}
      />
    );

    // P0 is blocked at the click-to-fix preflight stage, before artifact generation.
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    // Should open the blocked dialog
    expect(screen.getByText("Không thể đóng gói — còn lỗi bắt buộc")).toBeDefined();
    expect(screen.getByText(/Còn 1 lỗi bắt buộc phải sửa/i)).toBeDefined();
    expect(screen.getAllByText(/Thiếu link deploy bắt buộc/i)).toHaveLength(2);
    expect(screen.getByText(/Thêm link deploy vào Evidence Kit/i)).toBeDefined();

    // The "Vẫn tải xuống" button should be present but disabled (blocked by P0)
    const stillDownloadBtn = screen.getByRole("button", { name: /Vẫn tải xuống/i }) as HTMLButtonElement;
    expect(stillDownloadBtn.disabled).toBe(true);
    expect(stillDownloadBtn.getAttribute("aria-disabled")).toBe("true");

    // The cancel button should read "Đóng"
    const closeBtn = screen.getByText("Đóng");
    expect(closeBtn).toBeDefined();
  });

  it("allows submission package download with warning when no P0 errors exist", async () => {
    // Mock runChecker to return zero P0 errors
    vi.mocked(runChecker).mockReturnValue({
      issues: [],
      grouped: { error: [], warning: [], info: [] },
      readinessScore: 90,
      ranAt: "2026-06-24T22:00:00.000Z",
    });

    // Mock validateExport to return a warning
    vi.mocked(validateExport).mockReturnValue({
      ok: true,
      issues: [
        {
          severity: "warning",
          code: "CAPTION_MISSING",
          message: "Thiếu chú thích ảnh",
          sectionId: "sec1",
        },
      ],
    });

    render(
      <SubmissionPanel
        bundle={mockBundle}
        check={mockCheck}
        exportedBlobs={{ html: new Blob([""], { type: "text/html" }) }}
        jobs={[]}
      />
    );

    // Advance through review, artifact generation and final verification.
    for (let index = 0; index < 3; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Tải về bộ nộp bài" }));

    // Should open validation warning dialog
    expect(screen.getByText("Kiểm tra chất lượng báo cáo trước khi nộp")).toBeDefined();
    expect(screen.getByText(/Báo cáo đạt chất lượng cơ bản, chỉ có cảnh báo định dạng nhẹ/i)).toBeDefined();
    expect(screen.getByText(/Thiếu chú thích ảnh/i)).toBeDefined();

    // The "Vẫn tải xuống" button should exist
    const stillDownloadBtn = screen.getByRole("button", { name: /Vẫn tải xuống/i });
    expect(stillDownloadBtn).toBeDefined();
  });
});
