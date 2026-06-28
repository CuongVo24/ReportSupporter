import { describe, expect, it } from "vitest";
import { DEFAULT_FORMAT_SETTINGS, SCHEMA_VERSION, type CheckResult, type ReportProjectBundle } from "@/types";
import { computeReportHealth } from "./report-health";

function createBundle(markdowns: string[], evidenceUrl?: string): ReportProjectBundle {
  return {
    project: {
      id: "project-1",
      title: "Health test",
      templateId: "software-project",
      metadata: {},
      sections: markdowns.map((markdown, index) => ({
        id: `section-${index + 1}`,
        order: index,
        title: `Section ${index + 1}`,
        markdown,
        status: "draft",
      })),
      updatedAt: "2026-06-28T00:00:00.000Z",
    },
    assets: [],
    evidence: evidenceUrl
      ? [
          {
            id: "evidence-1",
            kind: "github",
            title: "Repository",
            url: evidenceUrl,
            qrEnabled: true,
            createdAt: "2026-06-28T00:00:00.000Z",
          },
        ]
      : [],
    formatSettings: DEFAULT_FORMAT_SETTINGS,
    schemaVersion: SCHEMA_VERSION,
  };
}

function createCheckResult(readinessScore: number, sectionId?: string): CheckResult {
  return {
    issues: sectionId
      ? [
          {
            id: "issue-1",
            severity: "warning",
            module: "check",
            message: "Needs evidence",
            suggestion: "Add evidence",
            sectionId,
          },
        ]
      : [],
    grouped: { error: [], warning: [], info: [] },
    readinessScore,
    ranAt: "2026-06-28T00:00:00.000Z",
  };
}

describe("computeReportHealth", () => {
  it("returns 0 for an empty report", () => {
    const health = computeReportHealth(createBundle([]));

    expect(health.score).toBe(0);
    expect(health.status).toBe("red");
  });

  it("combines readiness, weak sections, and evidence with declared weights", () => {
    const bundle = createBundle([
      "Intro with https://github.com/acme/repo",
      "Body without linked evidence",
    ], "https://github.com/acme/repo");

    const health = computeReportHealth(bundle, createCheckResult(80, "section-2"));

    expect(health.breakdown.map((item) => [item.id, item.weight])).toEqual([
      ["readiness", 0.6],
      ["weak-sections", 0.25],
      ["evidence", 0.15],
    ]);
    expect(health.breakdown.find((item) => item.id === "weak-sections")?.score).toBe(50);
    expect(health.breakdown.find((item) => item.id === "evidence")?.score).toBe(50);
    expect(health.score).toBe(68);
    expect(health.weakestSectionId).toBe("section-2");
  });

  it("reaches 100 when checked cleanly and every section has evidence", () => {
    const bundle = createBundle([
      "Intro with https://github.com/acme/repo",
      "Body cites https://github.com/acme/repo",
    ], "https://github.com/acme/repo");

    const health = computeReportHealth(bundle, createCheckResult(100));

    expect(health.score).toBe(100);
    expect(health.status).toBe("green");
  });

  it("penalizes reports that have content but no evidence signals", () => {
    const health = computeReportHealth(createBundle(["Intro", "Body"]), createCheckResult(100));

    expect(health.breakdown.find((item) => item.id === "evidence")?.score).toBe(0);
    expect(health.score).toBe(85);
  });
});
