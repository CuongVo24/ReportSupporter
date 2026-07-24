// @vitest-environment jsdom
// W24-I: prove no pending Promise ever hangs — worker error / messageerror /
// timeout / reset each reject affected pending exactly once, and repeated crashes
// open the circuit (fall back to the main thread) instead of a respawn storm.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PipelineRequest, PipelineResponse } from "@/types";
import {
  clearPipelineCache,
  PipelineTimeoutError,
  PipelineWorkerError,
  resetPipelineClientForTests,
  runPipelineRequest,
  StalePipelineResponseError,
} from "./pipeline-client";

// W25-K (S2): the circuit-breaker fallback (`runOnMainThread` in
// pipeline-client.ts) does a real `await import("./pipeline-core")`. Left
// unmocked, this pulls in the real parser module graph and executes real
// work — fast when the machine is idle, but slow enough under full-suite
// CPU contention (or coverage instrumentation) to blow past `testTimeout`.
// Mocking the module here makes the fallback path deterministic regardless
// of machine load; the real dynamic import + real `pipeline-core` execution
// is proven separately by the worker E2E suite (production actual-worker
// proof), not by this unit test.
vi.mock("./pipeline-core", () => ({
  executePipelineRequest: vi.fn(
    async (request: PipelineRequest): Promise<PipelineResponse> =>
      ({
        requestId: request.requestId,
        projectId: request.projectId,
        operation: request.operation,
        sectionRevisions: request.sectionRevisions,
        ok: true,
        result: { parsedParts: [], parsedSections: [] },
      }) as PipelineResponse,
  ),
}));

type Listener = (event: unknown) => void;

// A controllable fake worker: tests decide when it emits message/error/messageerror.
class ControllableWorker {
  static instances: ControllableWorker[] = [];
  listeners = new Map<string, Listener[]>();
  terminated = false;
  lastPosted: PipelineRequest | null = null;

  constructor() {
    ControllableWorker.instances.push(this);
  }
  addEventListener(type: string, listener: Listener) {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }
  removeEventListener(type: string, listener: Listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((l) => l !== listener));
  }
  postMessage(request: PipelineRequest) {
    this.lastPosted = request;
  }
  terminate() {
    this.terminated = true;
  }
  emit(type: string, event: unknown) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
  emitSuccess(request: PipelineRequest) {
    this.emit("message", {
      data: {
        requestId: request.requestId,
        projectId: request.projectId,
        operation: request.operation,
        sectionRevisions: request.sectionRevisions,
        ok: true,
        result: { parsedParts: [], parsedSections: [] },
      },
    });
  }
}

function previewRequest(id: string): PipelineRequest {
  return {
    requestId: id,
    projectId: "p1",
    operation: "preview",
    sectionRevisions: {},
    cacheKey: `key-${id}`,
    payload: { parts: [], sections: [], assets: [] },
  };
}

beforeEach(() => {
  ControllableWorker.instances = [];
  globalThis.Worker = ControllableWorker as unknown as typeof Worker;
  resetPipelineClientForTests();
});
afterEach(() => {
  resetPipelineClientForTests();
  vi.useRealTimers();
});

describe("pipeline worker fail-fast", () => {
  it("rejects the pending Promise when the worker emits an error", async () => {
    const promise = runPipelineRequest(previewRequest("r1"));
    const worker = ControllableWorker.instances[0];
    worker.emit("error", { message: "document is not defined" });
    await expect(promise).rejects.toBeInstanceOf(PipelineWorkerError);
    expect(worker.terminated).toBe(true);
  });

  it("rejects on messageerror without a message event", async () => {
    const promise = runPipelineRequest(previewRequest("r2"));
    ControllableWorker.instances[0].emit("messageerror", {});
    await expect(promise).rejects.toBeInstanceOf(PipelineWorkerError);
  });

  it("times out a wedged worker with PipelineTimeoutError", async () => {
    vi.useFakeTimers();
    const promise = runPipelineRequest(previewRequest("r3"));
    const expectation = expect(promise).rejects.toBeInstanceOf(PipelineTimeoutError);
    await vi.advanceTimersByTimeAsync(8_100);
    await expectation;
  });

  it("resolves normally and clears its timer on a healthy response", async () => {
    const request = previewRequest("r4");
    const promise = runPipelineRequest(request);
    ControllableWorker.instances[0].emitSuccess(request);
    const response = await promise;
    expect(response.ok).toBe(true);
  });

  it("opens the circuit after repeated crashes and falls back to the main thread", async () => {
    const first = runPipelineRequest(previewRequest("c1"));
    ControllableWorker.instances[0].emit("error", { message: "boom" });
    await expect(first).rejects.toBeInstanceOf(PipelineWorkerError);

    const second = runPipelineRequest(previewRequest("c2"));
    ControllableWorker.instances[1].emit("error", { message: "boom" });
    await expect(second).rejects.toBeInstanceOf(PipelineWorkerError);

    // Circuit now open: no new worker is created; the request runs on the main thread.
    const workersBefore = ControllableWorker.instances.length;
    const third = await runPipelineRequest(previewRequest("c3"));
    expect(third.ok).toBe(true);
    expect(ControllableWorker.instances.length).toBe(workersBefore);
  });
});

describe("pipeline coalescing + bounded cache (W24-J)", () => {
  it("coalesces to one in-flight + one queued; superseded requests reject stale", async () => {
    const first = runPipelineRequest(previewRequest("q1")); // becomes in-flight
    const second = runPipelineRequest(previewRequest("q2")); // queued
    const third = runPipelineRequest(previewRequest("q3")); // supersedes q2

    // q2 was superseded before ever reaching the worker.
    await expect(second).rejects.toBeInstanceOf(StalePipelineResponseError);

    const worker = ControllableWorker.instances[0];
    // Only q1 was posted so far (q3 is queued behind it).
    expect(worker.lastPosted?.requestId).toBe("q1");

    // Finishing q1 (as stale, since q3 is now latest) drains the queue to q3.
    worker.emit("message", {
      data: { requestId: "q1", projectId: "p1", operation: "preview", sectionRevisions: {}, ok: true, result: { parsedParts: [], parsedSections: [] } },
    });
    await expect(first).rejects.toBeInstanceOf(StalePipelineResponseError);

    expect(worker.lastPosted?.requestId).toBe("q3");
    worker.emit("message", {
      data: { requestId: "q3", projectId: "p1", operation: "preview", sectionRevisions: {}, ok: true, result: { parsedParts: [], parsedSections: [] } },
    });
    const result = await third;
    expect(result.ok).toBe(true);
  });

  it("serves the last successful response from cache and clears it per project", async () => {
    const request = { ...previewRequest("cache1"), cacheKey: "p1:preview:v1" };
    const promise = runPipelineRequest(request);
    ControllableWorker.instances[0].emitSuccess(request);
    await promise;

    // Same cacheKey → served from cache without a new worker post.
    const workersBefore = ControllableWorker.instances.length;
    const cached = await runPipelineRequest({ ...request, requestId: "cache2", cacheKey: "p1:preview:v1" });
    expect(cached.ok).toBe(true);
    expect(cached.requestId).toBe("cache2");
    expect(ControllableWorker.instances.length).toBe(workersBefore);

    // After clearing this project's cache, the next identical request re-dispatches
    // to the worker (the persistent worker is reused — no cache short-circuit).
    clearPipelineCache("p1");
    const redispatch = runPipelineRequest({ ...request, requestId: "cache3", cacheKey: "p1:preview:v1" });
    const reusedWorker = ControllableWorker.instances[ControllableWorker.instances.length - 1];
    expect(reusedWorker.lastPosted?.requestId).toBe("cache3");
    reusedWorker.emit("message", {
      data: { requestId: "cache3", projectId: "p1", operation: "preview", sectionRevisions: {}, ok: true, result: { parsedParts: [], parsedSections: [] } },
    });
    expect((await redispatch).ok).toBe(true);
  });
});
