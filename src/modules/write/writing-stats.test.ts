import { describe, expect, it } from "vitest";
import type { ReportSection } from "@/types";
import { computeWritingStats } from "./writing-stats";

describe("computeWritingStats", () => {
  it("returns zeros for empty markdown", () => {
    expect(computeWritingStats("   ")).toEqual({ words: 0, chars: 0, readingMinutes: 0 });
  });

  it("does not count common markdown syntax as words", () => {
    const stats = computeWritingStats("# Title\n\n- **Bold idea** with [link text](https://example.com)\n\n`code sample`");

    expect(stats.words).toBe(8);
    expect(stats.readingMinutes).toBe(1);
  });

  it("aggregates multiple sections", () => {
    const sections: ReportSection[] = [
      { id: "a", order: 0, title: "A", markdown: "One two", status: "draft",
      revision: 0 },
      { id: "b", order: 1, title: "B", markdown: "Three four five", status: "review",
      revision: 0 },
    ];

    expect(computeWritingStats(sections).words).toBe(5);
  });
});
