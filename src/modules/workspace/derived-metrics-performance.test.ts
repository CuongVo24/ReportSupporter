// W24-P (S0): measure-before-change harness for the derived metrics
// (`computeWritingStats` + `computeReportHealth`). This is the exit-path gate: if
// the per-update cost on large fixtures is already low, we KEEP the current
// implementation and do NOT add an incremental cache ("không thêm cache vô ích").
// Numbers here are a local advisory microbench (jsdom-free, pure functions); the
// canonical ratio vs preview/autosave comes from the O production profiler.
import { describe, expect, it } from "vitest";
import { DEFAULT_FORMAT_SETTINGS, SCHEMA_VERSION } from "@/types";
import type { EvidenceItem, ReportProjectBundle, ReportSection } from "@/types";
import { computeWritingStats } from "@/modules/write/writing-stats";
import { computeReportHealth } from "@/modules/check/report-health";

function buildSections(count: number): ReportSection[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `section-${index}`,
    order: index,
    title: `Mục ${index + 1}`,
    markdown:
      `# Mục ${index + 1}\n\n` +
      `Phân tích dữ liệu và minh chứng cho mục ${index + 1}. `.repeat(8) +
      `\n\n\`\`\`ts\nconst x = ${index};\n\`\`\`\n\n[liên kết](https://example.test/${index}) và ![hình](asset:img-${index}).`,
    status: "draft" as const,
    revision: 1,
  }));
}

function buildEvidence(count: number): EvidenceItem[] {
  const kinds = ["github", "deploy", "video", "drive"] as const;
  return Array.from({ length: count }, (_, index) => ({
    id: `evidence-${index}`,
    kind: kinds[index % kinds.length],
    title: `Bằng chứng ${index + 1}`,
    url: `https://example.test/evidence/${index}`,
    qrEnabled: index % 2 === 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  }));
}

function buildBundle(sectionCount: number, evidenceCount: number): ReportProjectBundle {
  return {
    project: {
      id: "perf-derived",
      title: "Đo derived metrics",
      templateId: "software-project",
      metadata: {},
      sections: buildSections(sectionCount),
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    assets: [],
    evidence: buildEvidence(evidenceCount),
    formatSettings: DEFAULT_FORMAT_SETTINGS,
    schemaVersion: SCHEMA_VERSION,
  };
}

function percentile(samples: number[], p: number): number {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

function measure(label: string, run: () => void): number {
  // Warmup.
  for (let i = 0; i < 5; i += 1) run();
  const samples: number[] = [];
  for (let i = 0; i < 50; i += 1) {
    const started = performance.now();
    run();
    samples.push(performance.now() - started);
  }
  const p95 = percentile(samples, 0.95);
  console.log(`[W24-P] ${label}: median=${percentile(samples, 0.5).toFixed(3)}ms p95=${p95.toFixed(3)}ms`);
  return p95;
}

// Measured 2026-07-21 (advisory, CI hardware varies): writing-stats is cheap
// (median ~4ms @40, ~7ms @100); report-health is the hot spot (median ~14ms @40,
// ~67ms @100, p95 ~134ms). That crosses the S0 threshold → report-health warrants
// optimization. The safe, no-parity-risk step (W24-P) is to run health during
// browser idle in Workspace (S3), so its long task leaves the keystroke/preview
// frame. Deeper S1/S2 algorithmic caching is deferred to a parity-tested,
// O-profiler-gated follow-up. Ceilings below are LOOSE regression guards (catch an
// order-of-magnitude / O(n^2) blowup) — not the product budget.
describe("W24-P derived metrics cost (S0 measure-before-change)", () => {
  it("writing stats stays cheap; report health is the measured hot spot (40 sections)", () => {
    const bundle = buildBundle(40, 40);
    const statsP95 = measure("stats(40)", () => computeWritingStats(bundle.project.sections));
    const healthP95 = measure("health(40)", () => computeReportHealth(bundle));
    expect(statsP95).toBeLessThan(60);
    expect(healthP95).toBeLessThan(120);
  });

  it("does not regress into an order-of-magnitude blowup at 100 sections / 100 evidence", () => {
    const bundle = buildBundle(100, 100);
    const statsP95 = measure("stats(100)", () => computeWritingStats(bundle.project.sections));
    const healthP95 = measure("health(100)", () => computeReportHealth(bundle));
    expect(statsP95).toBeLessThan(120);
    // Guardrail well above the measured ~134ms p95 — a much larger number means a
    // genuine algorithmic regression, which is what this test exists to catch.
    expect(healthP95).toBeLessThan(500);
  });
});
