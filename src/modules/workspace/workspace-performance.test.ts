// NOTE (W24-O): This is a *reducer microbenchmark* (advisory), NOT a user-path
// performance gate. It dispatches a single `active-section-changed` action in
// jsdom — it does not mount Workspace, load IndexedDB, autosave, run preview,
// compute stats/health, or process real keystrokes, and jsdom timing is flaky.
// The canonical keystroke/editor-ready gate lives in
// e2e/workspace-performance.spec.ts (production build, actual Chromium, actual
// Worker). Do not cite this as evidence of typing latency in a large report.
import { describe, expect, it } from "vitest";
import { initialWorkspaceState, workspaceReducer } from "./workspace-reducer";

describe("workspace reducer microbench (advisory, NOT a user-perf gate)", () => {
  it("keeps a pure reducer dispatch cheap (structural regression guard only)", () => {
    const samples: number[] = [];
    let state = initialWorkspaceState;
    for (let index = 0; index < 200; index += 1) {
      const startedAt = performance.now();
      state = workspaceReducer(state, { type: "active-section-changed", sectionId: `section-${index % 20}` });
      samples.push(performance.now() - startedAt);
    }
    samples.sort((a, b) => a - b);
    // Loose ceiling: guards against an accidental O(n) blowup in the reducer,
    // not against real typing latency. Kept generous so jsdom noise never flakes CI.
    expect(samples[Math.floor(samples.length * 0.95)]).toBeLessThan(50);
  });
});
