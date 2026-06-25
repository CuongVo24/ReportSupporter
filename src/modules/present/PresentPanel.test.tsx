/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { PresentPanel } from "./PresentPanel";
import type { ReportProjectBundle, CheckResult } from "@/types";

// Mock React hooks to run components in node environment
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  let stateCallCount = 0;

  return {
    ...actual,
    useState: () => {
      // Dynamically check mockActiveTab for the activeTab state (which is the first useState call in PresentPanel)
      const activeTabVal = (globalThis as any).mockActiveTab || "outline";
      const stateValues = [
        [activeTabVal, vi.fn()], // activeTab
        [{}, vi.fn()], // editedBullets
        [{}, vi.fn()], // editedSpeakers
        [{}, vi.fn()], // editedScripts
        [10, vi.fn()], // limitMinutes (10 mins)
      ];
      const pair = stateValues[stateCallCount % stateValues.length];
      stateCallCount++;
      return pair;
    },
    useCallback: (fn: (...args: unknown[]) => unknown) => fn,
    useEffect: vi.fn(),
    useMemo: (fn: () => unknown) => fn(),
  };
});

describe("PresentPanel Component (pure JSX structure)", () => {
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

  it("renders a slide list with correct counts and elements", () => {
    const bundle = mockBundle("# Mở đầu\n\nĐoạn văn mở đầu. Câu 2.\n\n## Lý do chọn đề tài\n\nNội dung lý do.\n");
    const element = PresentPanel({ bundle });

    expect(element).toBeDefined();
    expect(element.type).toBe("div");
    expect(element.props.className).toBe("ws-present");

    const children = element.props.children;
    expect(children[0].props.children).toBe("Thuyết trình"); // Title

    const timelineSummary = children[2].props.children[0];
    expect(timelineSummary.props.className).toBe("ws-present-timeline-summary");

    const slidesList = children[2].props.children[1];
    expect(slidesList.props.className).toBe("ws-present-slides-list");
    const slideViews = slidesList.props.children;
    expect(slideViews).toHaveLength(2); // H1 slide and H2 slide
    expect(slideViews[0].props.slide.title).toBe("1. Mở đầu");
  });

  it("renders empty state warning if report has no valid sections or content", () => {
    const bundle = mockBundle(""); // empty markdown
    const element = PresentPanel({ bundle });

    expect(element).toBeDefined();
    expect(element.props.children[1].props.className).toBe("ws-present-empty");
    expect(element.props.children[1].props.children).toContain(
      "Báo cáo chưa có nội dung hoặc chỉ có các chương rỗng"
    );
  });

  it("renders hints tab resolving slideId to title", () => {
    (globalThis as any).mockActiveTab = "hints";
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
    const element = PresentPanel({ bundle, checkResult });

    expect(element).toBeDefined();
    // Verify it renders the hints list
    const tabContent = element.props.children[5];
    const hintsView = tabContent.props.children;
    expect(hintsView.props.className).toBe("ws-present-hints-view");
    const hintsList = hintsView.props.children[1];
    expect(hintsList.props.className).toBe("ws-present-hints-list");
    const hintItem = hintsList.props.children[0];
    const hintHeader = hintItem.props.children[0];
    const linkSpan = hintHeader.props.children[1];
    expect(linkSpan.props.children[1].props.children).toBe("1. Mở đầu");

    // Clean up
    (globalThis as any).mockActiveTab = undefined;
  });
});
