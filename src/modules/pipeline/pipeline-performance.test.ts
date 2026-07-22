// @vitest-environment jsdom
//
// NOTE (W24-O): This is a *main-thread transfer smoke test*, NOT a user-path
// performance gate. It uses a fake worker that returns an empty AST, so it only
// measures structuredClone + microtask scheduling on the client — it cannot run
// the real worker bundle/parse/render and cannot catch `document is not defined`
// in the actual worker graph. The canonical user-path perf gate lives in
// e2e/workspace-performance.spec.ts (production build, actual Chromium, actual
// Worker). Do not cite this test as evidence of editor-ready/preview latency.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PipelineRequest, PipelineResponse } from "@/types";
import { resetPipelineClientForTests, runPipelineRequest } from "./pipeline-client";

class FakeTransferWorker {
  private listener?: (event: MessageEvent<PipelineResponse>) => void;

  addEventListener(type: string, listener: (event: MessageEvent<PipelineResponse>) => void) {
    if (type === "message") this.listener = listener;
  }

  removeEventListener() {}

  postMessage(input: PipelineRequest) {
    const request = structuredClone(input);
    if (request.operation !== "preview") throw new Error("Fake transfer worker only supports preview requests.");
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

describe("pipeline main-thread transfer smoke (NOT a user-perf gate)", () => {
  beforeEach(() => {
    globalThis.Worker = FakeTransferWorker as unknown as typeof Worker;
    resetPipelineClientForTests();
  });
  afterEach(resetPipelineClientForTests);

  it("round-trips a 40-part payload through the client without throwing", async () => {
    const page = "# Kết quả\n\n" + "Phân tích dữ liệu và minh chứng. ".repeat(75);
    const parts = Array.from({ length: 40 }, (_, index) => `${page}\n\n## Mục ${index + 1}`);
    const response = await runPipelineRequest({
      requestId: "smoke-40-parts",
      projectId: "smoke-project",
      operation: "preview",
      sectionRevisions: Object.fromEntries(parts.map((_, index) => [`section-${index}`, 1])),
      cacheKey: "smoke-project:40:format:assets",
      payload: {
        parts,
        sections: parts.map((markdown, index) => ({ id: `section-${index}`, markdown })),
        assets: [],
      },
    });

    expect(response.ok).toBe(true);
    // Deliberately no timing assertion: a fake-worker microtask says nothing
    // about real editor-ready latency. See e2e/workspace-performance.spec.ts.
  });
});
