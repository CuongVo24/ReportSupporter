import { describe, expect, it } from "vitest";
import { computeReadiness, scoreBand } from "./readiness-score";
import type { ReportIssue } from "@/types";

describe("readiness-score engine", () => {
  it("computes readiness score correctly based on issue severities (3.Check.md §5.3)", () => {
    const issues: ReportIssue[] = [
      { id: "e1", severity: "error", module: "check", message: "Error 1", suggestion: "" },
      { id: "w1", severity: "warning", module: "check", message: "Warning 1", suggestion: "" },
      { id: "w2", severity: "warning", module: "check", message: "Warning 2", suggestion: "" },
    ];
    // Start at 100: -15 (error) - 10 (2 warnings) = 75
    expect(computeReadiness(issues)).toBe(75);
  });

  it("clamps score at 0 when there are too many errors", () => {
    const issues: ReportIssue[] = Array.from({ length: 10 }, (_, i) => ({
      id: `err-${i}`,
      severity: "error",
      module: "check",
      message: `Error ${i}`,
      suggestion: "",
    }));
    // 100 - 150 = -50 -> clamps to 0
    expect(computeReadiness(issues)).toBe(0);
  });

  it("deducts 1 point for info issues", () => {
    const issues: ReportIssue[] = [
      { id: "i1", severity: "info", module: "check", message: "Info 1", suggestion: "" },
    ];
    expect(computeReadiness(issues)).toBe(99);
  });

  it("handles empty issues list with a perfect 100 score", () => {
    expect(computeReadiness([])).toBe(100);
  });
});

describe("scoreBand classification", () => {
  it("classifies green band for scores >= 85", () => {
    expect(scoreBand(100)).toBe("green");
    expect(scoreBand(85)).toBe("green");
  });

  it("classifies yellow band for scores 60 to 84", () => {
    expect(scoreBand(84)).toBe("yellow");
    expect(scoreBand(75)).toBe("yellow");
    expect(scoreBand(60)).toBe("yellow");
  });

  it("classifies red band for scores < 60", () => {
    expect(scoreBand(59)).toBe("red");
    expect(scoreBand(30)).toBe("red");
    expect(scoreBand(0)).toBe("red");
  });
});
