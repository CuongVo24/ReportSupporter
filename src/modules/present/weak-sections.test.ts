import { describe, it, expect } from "vitest";
import { buildWeakSectionHints } from "./weak-sections";
import type { CheckResult, SlideOutline } from "@/types";

describe("buildWeakSectionHints", () => {
  const mockOutline: SlideOutline[] = [
    {
      id: "slide-1",
      fromSectionId: "sec-1",
      order: 0,
      title: "Introduction",
      bullets: [],
      evidenceRefs: [],
    },
    {
      id: "slide-2",
      fromSectionId: "sec-2",
      order: 1,
      title: "Content",
      bullets: [],
      evidenceRefs: [],
    },
  ];

  it("should aggregate errors and warnings correctly and pick the heaviest severity", () => {
    const checkResult: CheckResult = {
      issues: [
        {
          id: "issue-1",
          severity: "warning",
          module: "check",
          message: "Warning message",
          suggestion: "Fix warning",
          sectionId: "sec-1",
        },
        {
          id: "issue-2",
          severity: "error",
          module: "check",
          message: "Error message",
          suggestion: "Fix error",
          sectionId: "sec-1",
        },
      ],
      grouped: { error: [], warning: [], info: [] },
      readinessScore: 80,
      ranAt: new Date().toISOString(),
    };

    const hints = buildWeakSectionHints(checkResult, mockOutline);
    expect(hints).toHaveLength(1);
    expect(hints[0].sectionId).toBe("sec-1");
    expect(hints[0].slideId).toBe("slide-1");
    expect(hints[0].severity).toBe("error");
    expect(hints[0].reason).toContain("Warning message");
    expect(hints[0].reason).toContain("Error message");
  });

  it("should map slideId correctly when outline matches sectionId", () => {
    const checkResult: CheckResult = {
      issues: [
        {
          id: "issue-3",
          severity: "info",
          module: "check",
          message: "Info message",
          suggestion: "Do something",
          sectionId: "sec-2",
        },
      ],
      grouped: { error: [], warning: [], info: [] },
      readinessScore: 90,
      ranAt: new Date().toISOString(),
    };

    const hints = buildWeakSectionHints(checkResult, mockOutline);
    expect(hints).toHaveLength(1);
    expect(hints[0].sectionId).toBe("sec-2");
    expect(hints[0].slideId).toBe("slide-2");
    expect(hints[0].severity).toBe("info");
  });

  it("should return empty list if there are no issues (clean project)", () => {
    const checkResult: CheckResult = {
      issues: [],
      grouped: { error: [], warning: [], info: [] },
      readinessScore: 100,
      ranAt: new Date().toISOString(),
    };

    const hints = buildWeakSectionHints(checkResult, mockOutline);
    expect(hints).toHaveLength(0);
  });

  it("should aggregate issues missing sectionId under global key without dropping them", () => {
    const checkResult: CheckResult = {
      issues: [
        {
          id: "issue-global-1",
          severity: "error",
          module: "check",
          message: "Global error",
          suggestion: "Fix project configuration",
        },
      ],
      grouped: { error: [], warning: [], info: [] },
      readinessScore: 50,
      ranAt: new Date().toISOString(),
    };

    const hints = buildWeakSectionHints(checkResult, mockOutline);
    expect(hints).toHaveLength(1);
    expect(hints[0].sectionId).toBe("global");
    expect(hints[0].slideId).toBeUndefined();
    expect(hints[0].severity).toBe("error");
    expect(hints[0].reason).toBe("Global error");
  });

  it("should be deterministic (same input produces same output)", () => {
    const checkResult: CheckResult = {
      issues: [
        {
          id: "issue-1",
          severity: "warning",
          module: "check",
          message: "Warning message",
          suggestion: "Fix warning",
          sectionId: "sec-1",
        },
        {
          id: "issue-global",
          severity: "error",
          module: "check",
          message: "Global error",
          suggestion: "Fix global",
        },
      ],
      grouped: { error: [], warning: [], info: [] },
      readinessScore: 70,
      ranAt: new Date().toISOString(),
    };

    const run1 = buildWeakSectionHints(checkResult, mockOutline);
    const run2 = buildWeakSectionHints(checkResult, mockOutline);
    expect(run1).toEqual(run2);
  });
});
