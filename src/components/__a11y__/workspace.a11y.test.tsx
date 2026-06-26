// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";
import { WorkspaceLayout } from "../WorkspaceLayout";
import { Workspace } from "../Workspace";

expect.extend(matchers);

// Mock window.matchMedia for WorkspaceLayout
beforeEach(() => {
  if (typeof window !== "undefined") {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true, // desktop mode
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

    if (window.Range) {
      window.Range.prototype.getClientRects = vi.fn().mockReturnValue({
        length: 0,
        item: () => null,
      });
      window.Range.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0,
      });
    }
  }
});

async function assertNoViolations(container: HTMLElement) {
  const results = await axe(container);
  (expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations();
}

// Mock modules that access IndexedDB/APIs
vi.mock("@/modules/write", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/write")>();
  return {
    ...actual,
    loadBundle: vi.fn().mockResolvedValue({
      project: {
        id: "test-proj",
        title: "Báo cáo thử nghiệm",
        templateId: "software-project",
        metadata: {},
        sections: [
          { id: "sec1", order: 0, title: "Mở đầu", markdown: "Nội dung mở đầu", status: "done" },
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
    }),
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

const mockSections = [
  { id: "sec1", title: "Mở đầu", status: "done" as const },
  { id: "sec2", title: "Nội dung chính", status: "draft" as const },
];

describe("Workspace Shell Layout a11y", () => {
  it("WorkspaceLayout has no critical a11y violations", async () => {
    const { container } = render(
      <WorkspaceLayout
        editor={<div>Mock Editor</div>}
        preview={<div>Mock Preview</div>}
        sidePanel={<div>Mock Side Panel</div>}
        sections={mockSections}
        activeSectionId="sec1"
        onSectionSelect={() => {}}
        reportTitle="Báo cáo thử nghiệm"
        saveStatus={<span>Đã lưu</span>}
        primaryAction={<button>Xuất bản</button>}
      />
    );
    await assertNoViolations(container);
  });

  it("Workspace container has no critical a11y violations", async () => {
    const { container } = render(<Workspace />);
    // Wait a brief tick for the useEffect bundle loading mock resolved state
    await new Promise((resolve) => setTimeout(resolve, 50));
    await assertNoViolations(container);
  });
});
