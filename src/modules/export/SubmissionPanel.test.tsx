// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CheckResult, ReportProjectBundle } from "@/types";
import { SubmissionPanel } from "./SubmissionPanel";

vi.mock("./preflight", () => ({
  buildPreflightResult: () => ({ ok: true, hasP0: false, issues: [] }),
}));

describe("SubmissionPanel wizard", () => {
  const bundle: ReportProjectBundle = {
    schemaVersion: 2,
    project: {
      id: "test-proj",
      title: "Báo cáo thử nghiệm",
      templateId: "software-project",
      metadata: { school: "Đại học Công nghệ", members: ["Nguyễn Văn A"] },
      sections: [{ id: "sec1", order: 0, title: "Mở đầu", markdown: "Nội dung", status: "done", revision: 0 }],
      updatedAt: "2026-07-17T00:00:00.000Z",
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
  };

  const check: CheckResult = {
    issues: [],
    grouped: { error: [], warning: [], info: [] },
    readinessScore: 85,
    ranAt: "2026-07-17T00:00:00.000Z",
  };

  afterEach(cleanup);

  it("walks through all four stages and exposes the final package action", () => {
    render(<SubmissionPanel bundle={bundle} check={check} exportedBlobs={{ html: new Blob(["ok"], { type: "text/html" }) }} jobs={[]} />);

    expect(screen.getByRole("list", { name: "Các bước đóng gói" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Checklist kiểm tra báo cáo" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(screen.getByRole("heading", { name: "Artifact trong phiên hiện tại" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(screen.getByRole("heading", { name: "Xác minh và preview cuối" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    expect(screen.getByRole("button", { name: "Tải về bộ nộp bài" })).toBeDefined();
  });

  it("shows explicit warnings for a missing check and missing session artifacts", () => {
    render(<SubmissionPanel bundle={bundle} exportedBlobs={{}} jobs={[]} />);
    expect(screen.getByText("Soát báo cáo để rà lỗi trước khi nộp.")).toBeDefined();

    for (let index = 0; index < 3; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    }

    expect(screen.getByText(/chưa xuất bản trong phiên này/i)).toBeDefined();
  });
});
