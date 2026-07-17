// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ExportPanel } from "./ExportPanel";
import type { ReportProjectBundle, CheckResult } from "@/types";
import { runChecker } from "@/modules/check/run-checker";
import { validateExport } from "./validate-export";

vi.mock("@/modules/check/run-checker", () => ({
  runChecker: vi.fn(),
}));

vi.mock("./validate-export", () => ({
  validateExport: vi.fn(),
}));

vi.mock("./export-history", () => ({
  loadExportHistory: vi.fn().mockResolvedValue([]),
  clearExportHistory: vi.fn().mockResolvedValue(undefined),
}));

describe("ExportPanel Preflight Integration", () => {
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

  const runExportMock = vi.fn();
  const retryMock = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("blocks export and disables 'Vẫn xuất bản' button when there are P0 errors", async () => {
    // Mock runChecker to return a P0 error
    vi.mocked(runChecker).mockReturnValue({
      issues: [
        {
          id: "rule-github",
          severity: "error",
          module: "check",
          message: "Thiếu minh chứng link github bắt buộc",
          suggestion: "Thêm github link vào Evidence Kit",
          sectionId: "sec1",
        },
      ],
      grouped: {
        error: [{ id: "rule-github", severity: "error", module: "check", message: "Thiếu", suggestion: "" }],
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
      <ExportPanel
        bundle={mockBundle}
        check={mockCheck}
        jobs={[]}
        runExport={runExportMock}
        retry={retryMock}
        exportedBlobs={{}}
      />
    );

    // Click on HTML export
    const exportBtn = screen.getByRole("button", { name: "Xuất bản định dạng HTML" });
    fireEvent.click(exportBtn);

    // Should open the blocked dialog
    expect(screen.getByText("Không thể xuất bản — còn lỗi bắt buộc")).toBeDefined();
    expect(screen.getByText(/Còn 1 lỗi bắt buộc phải sửa/i)).toBeDefined();
    expect(screen.getByText(/Thiếu minh chứng link github bắt buộc/i)).toBeDefined();
    expect(screen.getByText(/Thêm github link vào Evidence Kit/i)).toBeDefined();

    // The "Vẫn xuất bản" button should be present but disabled (blocked by P0)
    const stillExportBtn = screen.getByRole("button", { name: /Vẫn xuất bản/i }) as HTMLButtonElement;
    expect(stillExportBtn.disabled).toBe(true);
    expect(stillExportBtn.getAttribute("aria-disabled")).toBe("true");

    // The cancel button should read "Đóng"
    const closeBtn = screen.getByText("Đóng");
    expect(closeBtn).toBeDefined();

    // Export was not triggered
    expect(runExportMock).not.toHaveBeenCalled();
  });

  it("allows export with warnings but no P0 errors", async () => {
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
      <ExportPanel
        bundle={mockBundle}
        check={mockCheck}
        jobs={[]}
        runExport={runExportMock}
        retry={retryMock}
        exportedBlobs={{}}
      />
    );

    // Click on HTML export
    const exportBtn = screen.getByRole("button", { name: "Xuất bản định dạng HTML" });
    fireEvent.click(exportBtn);

    // Should open validation warning dialog
    expect(screen.getByText("Kiểm tra chất lượng báo cáo")).toBeDefined();
    expect(screen.getByText(/Báo cáo có một số cảnh báo định dạng nhẹ/i)).toBeDefined();
    expect(screen.getByText(/Thiếu chú thích ảnh/i)).toBeDefined();

    // The "Vẫn xuất bản" button should exist and be clickable
    const stillExportBtn = screen.getByRole("button", { name: /Vẫn xuất bản/i });
    expect(stillExportBtn).toBeDefined();

    // Click "Vẫn xuất bản"
    fireEvent.click(stillExportBtn);

    // runExport was triggered
    expect(runExportMock).toHaveBeenCalledWith("html", mockBundle);
  });

  it("loads and displays persistent export history from IndexedDB", async () => {
    const mockHistory = [
      {
        id: "job-1",
        target: "docx" as const,
        projectId: "test-proj",
        status: "done" as const,
        startedAt: "2026-06-25T10:00:00.000Z",
        finishedAt: "2026-06-25T10:01:00.000Z",
        fileName: "bao-cao-tot-nghiep.docx",
      },
    ];

    const { loadExportHistory } = await import("./export-history");
    vi.mocked(loadExportHistory).mockResolvedValue(mockHistory);

    render(
      <ExportPanel
        bundle={mockBundle}
        check={mockCheck}
        jobs={[]}
        runExport={runExportMock}
        retry={retryMock}
        exportedBlobs={{}}
      />
    );

    // Wait for history to load and render
    const jobItem = await screen.findByText("bao-cao-tot-nghiep.docx");
    expect(jobItem).toBeDefined();
    expect(screen.getByText("Word (DOCX)")).toBeDefined();
    expect(screen.getByText("Hoàn thành")).toBeDefined();
  });
});
