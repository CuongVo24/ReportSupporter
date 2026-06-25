// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PresentPanel } from "./PresentPanel";
import type { ReportProjectBundle, CheckResult } from "@/types";
import { requestSuggestion } from "@/modules/write";

afterEach(cleanup);

let mockGatewayState: "disabled" | "unconfigured" | "ready" = "disabled";

// Mock the AI write gateway functions
vi.mock("@/modules/write", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/write")>();
  return {
    ...actual,
    getGatewayState: () => mockGatewayState,
    requestSuggestion: vi.fn(),
  };
});

describe("PresentPanel Component", () => {
  const mockBundle = (markdown: string, members?: string[]): ReportProjectBundle => ({
    project: {
      id: "test-proj-1",
      title: "Test Project",
      templateId: "software-project",
      metadata: {
        school: "Đại học XYZ",
        members: members || ["An", "Bình"],
      },
      sections: [
        { id: "sec-1", order: 0, title: "Mở đầu", markdown, status: "draft" },
      ],
      updatedAt: "2026-06-25T00:00:00.000Z",
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
  });

  it("renders tabs and slide list with correct count", () => {
    mockGatewayState = "disabled";
    const bundle = mockBundle("# Mở đầu\n\nĐoạn văn mở đầu. Câu 2.\n\n## Lý do chọn đề tài\n\nNội dung lý do.\n");
    render(<PresentPanel bundle={bundle} />);

    // Check title
    expect(screen.getByRole("heading", { name: "Thuyết trình" })).toBeDefined();

    // Check tabs
    expect(screen.getByRole("button", { name: /Slides Outline/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Kịch bản nói/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Hỏi đáp phản biện/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Gợi ý sửa lỗi/i })).toBeDefined();

    // Check outline slides list (H1 and H2 slides)
    expect(screen.getByText("1. Mở đầu")).toBeDefined();
    expect(screen.getByText("1.1. Lý do chọn đề tài")).toBeDefined();
  });

  it("renders empty state warning if report has no valid sections or content", () => {
    const bundle = mockBundle(""); // empty markdown
    render(<PresentPanel bundle={bundle} />);

    expect(
      screen.getByText(/Báo cáo chưa có nội dung hoặc chỉ có các chương rỗng/i)
    ).toBeDefined();
  });

  it("renders hints tab resolving slideId to title", () => {
    const bundle = mockBundle("# Mở đầu\n\nĐoạn văn mở đầu. Câu 2.\n");
    const checkResult: CheckResult = {
      issues: [
        {
          id: "required-sections",
          sectionId: "sec-1",
          severity: "error" as const,
          module: "check" as const,
          message: "Thiếu kết luận",
          suggestion: "Bổ sung chương kết luận",
        }
      ],
      grouped: {
        error: [
          {
            id: "required-sections",
            sectionId: "sec-1",
            severity: "error" as const,
            module: "check" as const,
            message: "Thiếu kết luận",
            suggestion: "Bổ sung chương kết luận",
          }
        ],
        warning: [],
        info: [],
      },
      readinessScore: 80,
      ranAt: "2026-06-25T00:00:00.000Z",
    };
    render(<PresentPanel bundle={bundle} checkResult={checkResult} />);

    // Click on the hints tab
    const hintsTab = screen.getByRole("button", { name: /Gợi ý sửa lỗi/i });
    fireEvent.click(hintsTab);

    // Verify it renders the hints list and resolves the slide title
    expect(screen.getByText("Các phần cần hoàn thiện (Weak Sections)")).toBeDefined();
    expect(screen.getByText("1. Mở đầu")).toBeDefined();
    expect(screen.getByText(/Thiếu kết luận/i)).toBeDefined();
    expect(screen.getByText(/Bổ sung chương kết luận/i)).toBeDefined();
  });

  it("renders AI outline button as disabled when state is disabled and shows config note", () => {
    mockGatewayState = "disabled";
    const bundle = mockBundle("# Mở đầu\n\nĐoạn văn mở đầu. Câu 2.\n");
    render(<PresentPanel bundle={bundle} />);

    const aiBtn = screen.getByRole("button", { name: /Tối ưu Outline bằng AI/i });
    expect((aiBtn as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("⚠️ Bật AI trong cấu hình")).toBeDefined();
  });

  it("switches tabs on button click", () => {
    const bundle = mockBundle("# Mở đầu\n\nĐoạn văn mở đầu. Câu 2.\n");
    render(<PresentPanel bundle={bundle} />);

    // Initial tab is outline, slide list should be visible
    expect(screen.getByText("1. Mở đầu")).toBeDefined();

    // Switch to Script tab
    const scriptTab = screen.getByRole("button", { name: /Kịch bản nói/i });
    fireEvent.click(scriptTab);

    // Slide list from Outline tab should not be visible anymore, but Script view title should be
    expect(screen.queryByText("Giới hạn (phút):")).toBeNull();
    expect(screen.getByText("Kịch bản nói (Speaker Script)")).toBeDefined();
  });

  it("calls AI assist when state is ready, shows loading state and displays suggestions", async () => {
    mockGatewayState = "ready";
    vi.mocked(requestSuggestion).mockResolvedValue({
      id: "mock-suggestion-id",
      action: "outline",
      original: "",
      suggestion: JSON.stringify([
        {
          id: "sec-1-slide-0",
          fromSectionId: "sec-1",
          order: 0,
          title: "1. Mở đầu (Tối ưu)",
          bullets: ["Bullet 1", "Bullet 2"],
          evidenceRefs: [],
        }
      ]),
    });

    const bundle = mockBundle("# Mở đầu\n\nĐoạn văn mở đầu. Câu 2.\n");
    render(<PresentPanel bundle={bundle} />);

    const aiBtn = screen.getByRole("button", { name: /Tối ưu Outline bằng AI/i });
    expect((aiBtn as HTMLButtonElement).disabled).toBe(false);

    // Click button
    fireEvent.click(aiBtn);

    // The button should be disabled and show busy/loading state
    expect(aiBtn.getAttribute("aria-busy")).toBe("true");

    // Wait for the suggestion box to appear
    const suggestionTitle = await screen.findByText(/Đề xuất tối ưu Slide Outline từ AI/i);
    expect(suggestionTitle).toBeDefined();

    // Verify optimized slide titles and bullets
    expect(screen.getByText("1. Mở đầu (Tối ưu)")).toBeDefined();
    expect(screen.getByText("Bullet 1")).toBeDefined();
  });
});
