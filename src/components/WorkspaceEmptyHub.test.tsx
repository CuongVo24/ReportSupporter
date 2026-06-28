// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, cleanup, screen, fireEvent, act } from "@testing-library/react";
import { Workspace } from "./Workspace";
import type { ReportSection } from "@/types";

let mockBundleSections: ReportSection[] = [];

// Mock ResizeObserver & matchMedia
beforeEach(() => {
  mockBundleSections = [];
  if (typeof window !== "undefined") {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    if (!window.ResizeObserver) {
      window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
  }
});

// Mock modules
vi.mock("@/modules/write", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/write")>();
  return {
    ...actual,
    loadBundle: vi.fn().mockImplementation(() => Promise.resolve({
      project: {
        id: "test-proj",
        title: "Báo cáo thử nghiệm",
        templateId: "software-project",
        metadata: {},
        sections: mockBundleSections,
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
    })),
    saveBundle: vi.fn().mockResolvedValue(true),
    useDraftAutosave: () => ({ status: "saved", quotaFull: false }),
    useImageInsert: () => ({ handleImageInserted: vi.fn() }),
  };
});

vi.mock("@/modules/export", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/export")>();
  return {
    ...actual,
    useExport: () => ({ jobs: [], runExport: vi.fn(), retry: vi.fn(), exportedBlobs: {} }),
    loadExportHistory: vi.fn().mockResolvedValue([]),
  };
});

afterEach(cleanup);

describe("Workspace Empty Report Recovery Hub", () => {
  it("renders EmptyReportHub exits when there are no active sections", async () => {
    mockBundleSections = [];
    render(<Workspace />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(screen.getByText("Báo cáo chưa có nội dung")).toBeTruthy();
    expect(screen.getByText("Thêm mục đầu tiên")).toBeTruthy();
    expect(screen.getByText("Nhập Markdown")).toBeTruthy();
    expect(screen.getByText("Quay lại khởi tạo")).toBeTruthy();
  });

  it("triggers section creation when Add Section card is clicked", async () => {
    mockBundleSections = [];
    render(<Workspace />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const addBtn = screen.getByText("Thêm mục đầu tiên");
    fireEvent.click(addBtn);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(screen.queryByText("Báo cáo chưa có nội dung")).toBeNull();
  });
});
