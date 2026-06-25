import { describe, it, expect, vi } from "vitest";
import { SubmissionPanel } from "./SubmissionPanel";
import type { ReportProjectBundle, CheckResult } from "@/types";

// Mock React hooks to allow direct invocation of the component function in pure Node
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const val = typeof initial === "function" ? (initial as () => unknown)() : initial;
      return [val, vi.fn()];
    },
    useCallback: (fn: (...args: unknown[]) => unknown) => fn,
    useEffect: vi.fn(),
    useMemo: (fn: () => unknown) => fn(),
  };
});

describe("SubmissionPanel component structure", () => {
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

  it("renders the checklist items and download button", () => {
    const element = SubmissionPanel({
      bundle: mockBundle,
      check: mockCheck,
      exportedBlobs: {},
      jobs: [],
    });

    expect(element).toBeDefined();
    expect(element.type).toBe("div");
    expect(element.props.className).toBe("ws-submission-panel");

    const children = element.props.children;
    expect(children).toBeInstanceOf(Array);

    const titleEl = children[0];
    expect(titleEl.type).toBe("h3");
    expect(titleEl.props.children).toBe("Đóng gói nộp bài");

    const checklistContainer = children[1];
    expect(checklistContainer.type).toBe("div");
    expect(checklistContainer.props.className).toBe("ws-submission-checklist-container");

    const downloadButton = children[2];
    expect(downloadButton.type).toBe("button");
    expect(downloadButton.props.className).toBe("ws-submission-btn");
    expect(downloadButton.props.children).toBe("Tải về evidence.zip");
  });
});
