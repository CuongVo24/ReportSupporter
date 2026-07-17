// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PipelineRequest, PipelineResponse } from "@/types";
import { resetPipelineClientForTests, runPipelineRequest } from "./pipeline-client";

class PerformanceWorker {
  private listener?: (event: MessageEvent<PipelineResponse>) => void;

  addEventListener(_type: string, listener: (event: MessageEvent<PipelineResponse>) => void) {
    this.listener = listener;
  }

  postMessage(input: PipelineRequest) {
    const request = structuredClone(input);
    if (request.operation !== "preview") throw new Error("Performance worker only supports preview requests.");
    queueMicrotask(() => this.listener?.({
      data: {
        requestId: request.requestId,
        projectId: request.projectId,
        operation: "preview",
        sectionRevisions: request.sectionRevisions,
        ok: true,
        result: { parsedParts: request.payload.parts.map((content) => ({ content, ast: { type: "root", children: [] } })) },
      },
    } as unknown as MessageEvent<PipelineResponse>));
  }

  terminate() {}
}

describe("pipeline main-thread performance gate", () => {
  beforeEach(() => {
    globalThis.Worker = PerformanceWorker as unknown as typeof Worker;
    resetPipelineClientForTests();
  });
  afterEach(resetPipelineClientForTests);

  it("transfers and receives a representative 40-page payload within 200 ms", async () => {
    const page = "# Kết quả\n\n" + "Phân tích dữ liệu và minh chứng. ".repeat(75);
    const parts = Array.from({ length: 40 }, (_, index) => `${page}\n\n## Mục ${index + 1}`);
    const startedAt = performance.now();
    const response = await runPipelineRequest({
      requestId: "perf-40-pages",
      projectId: "perf-project",
      operation: "preview",
      sectionRevisions: Object.fromEntries(parts.map((_, index) => [`section-${index}`, 1])),
      cacheKey: "perf-project:40:format:assets",
      payload: {
        parts,
        sections: parts.map((markdown, index) => ({ id: `section-${index}`, markdown })),
        assets: [],
      },
    });
    const elapsed = performance.now() - startedAt;

    expect(response.ok).toBe(true);
    expect(elapsed).toBeLessThan(200);
  });
});
