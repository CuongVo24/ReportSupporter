import { describe, expect, it } from "vitest";
import { initialWorkspaceState, workspaceReducer } from "./workspace-reducer";

describe("workspace keystroke performance gate", () => {
  it("keeps reducer event handling below 16 ms at P95", () => {
    const samples: number[] = [];
    let state = initialWorkspaceState;
    for (let index = 0; index < 200; index += 1) {
      const startedAt = performance.now();
      state = workspaceReducer(state, { type: "active-section-changed", sectionId: `section-${index % 20}` });
      samples.push(performance.now() - startedAt);
    }
    samples.sort((a, b) => a - b);
    expect(samples[Math.floor(samples.length * 0.95)]).toBeLessThan(16);
  });
});
