// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IssuesPanel } from "./IssuesPanel";
import type { CheckResult, ReportSection } from "@/types";

afterEach(cleanup);

describe("IssuesPanel section titles mapping", () => {
  const mockResult: CheckResult = {
    issues: [
      {
        id: "issue1",
        severity: "warning",
        module: "check",
        message: "First skipping heading level",
        suggestion: "Sửa cấp tiêu đề",
        sectionId: "sec1",
        line: 1,
      },
      {
        id: "issue2",
        severity: "error",
        module: "check",
        message: "Missing video link",
        suggestion: "Bổ sung link video",
        sectionId: "sec2",
        line: 5,
      },
      {
        id: "issue3",
        severity: "info",
        module: "check",
        message: "Typo found",
        suggestion: "Sửa lỗi chính tả",
        sectionId: "sec_deleted",
        line: 10,
      }
    ],
    grouped: { error: [], warning: [], info: [] },
    readinessScore: 70,
    ranAt: "2026-07-13T10:00:00Z"
  };

  const mockSections: ReportSection[] = [
    { id: "sec1", order: 1, title: "Giới thiệu", markdown: "", status: "done",
    revision: 0 },
    { id: "sec2", order: 2, title: "Triển khai", markdown: "", status: "draft",
    revision: 0 }
  ];

  it("displays section title instead of sectionId when sections list is provided", () => {
    render(
      <IssuesPanel
        result={mockResult}
        onRun={() => {}}
        onJump={() => {}}
        hasRun={true}
        sections={mockSections}
      />
    );

    // Should display "Mục: Giới thiệu" and "Mục: Triển khai"
    expect(screen.queryByText("Mục: Giới thiệu")).not.toBeNull();
    expect(screen.queryByText("Mục: Triển khai")).not.toBeNull();

    // Verify aria-label maps to section title
    const viewButtons = screen.getAllByRole("button", { name: /Đi tới phần/ });
    expect(viewButtons[0].getAttribute("aria-label")).toBe('Đi tới phần "Giới thiệu", dòng 1');
    expect(viewButtons[1].getAttribute("aria-label")).toBe('Đi tới phần "Triển khai", dòng 5');
  });

  it("displays 'Mục: Mục đã xoá' when sectionId is not found in sections list", () => {
    render(
      <IssuesPanel
        result={mockResult}
        onRun={() => {}}
        onJump={() => {}}
        hasRun={true}
        sections={mockSections}
      />
    );

    expect(screen.queryByText("Mục: Mục đã xoá")).not.toBeNull();
    const viewButtons = screen.getAllByRole("button", { name: /Đi tới phần/ });
    expect(viewButtons[2].getAttribute("aria-label")).toBe('Đi tới phần "Mục đã xoá", dòng 10');
  });

  it("displays raw sectionId (UUID) when sections prop is not provided for backward compatibility", () => {
    render(
      <IssuesPanel
        result={mockResult}
        onRun={() => {}}
        onJump={() => {}}
        hasRun={true}
      />
    );

    expect(screen.queryByText("Mục: sec1")).not.toBeNull();
    expect(screen.queryByText("Mục: sec2")).not.toBeNull();
    expect(screen.queryByText("Mục: sec_deleted")).not.toBeNull();
  });

  it("renders 'Gắn ảnh...' button for broken-image issues and triggers onAttachImageRequest callback", () => {
    const attachResult: CheckResult = {
      issues: [
        {
          id: "broken-image",
          severity: "error",
          module: "check",
          message: 'Ảnh sử dụng đường dẫn cục bộ chưa được nhúng: "images/fig-1.png".',
          suggestion: "Nhúng ảnh",
          sectionId: "sec1",
          line: 2,
        }
      ],
      grouped: { error: [], warning: [], info: [] },
      readinessScore: 50,
      ranAt: "2026-07-13T10:00:00Z"
    };

    let calledSectionId = "";
    let calledRef = "";
    const handleAttach = (secId: string, ref: string) => {
      calledSectionId = secId;
      calledRef = ref;
    };

    render(
      <IssuesPanel
        result={attachResult}
        onRun={() => {}}
        onJump={() => {}}
        hasRun={true}
        sections={mockSections}
        onAttachImageRequest={handleAttach}
      />
    );

    const attachBtn = screen.getByRole("button", { name: "Gắn ảnh..." });
    expect(attachBtn).not.toBeNull();
    
    attachBtn.click();
    expect(calledSectionId).toBe("sec1");
    expect(calledRef).toBe("images/fig-1.png");
  });
});
