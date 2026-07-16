import { afterAll, describe, expect, it, vi } from "vitest";
import { runInWorker, type ProgressPayload } from "./worker-client";

// Mock window and Worker for Node testing environment
global.window = global as unknown as Window & typeof globalThis;

class MockWorker {
  onmessage: ((ev: MessageEvent) => unknown) | null = null;
  onerror: ((ev: ErrorEvent) => unknown) | null = null;
  postMessage = vi.fn().mockImplementation((data) => {
    // Simulate messages from worker
    setTimeout(() => {
      if (this.onmessage) {
        if (data.format === "pptx") {
          // Fallback simulation
          this.onmessage({
            data: { id: data.id, type: "error", error: "FALLBACK_TO_MAIN_THREAD" },
          } as MessageEvent);
        } else if (data.format === "docx") {
          // Progress then success
          this.onmessage({
            data: { id: data.id, type: "progress", progress: { stage: "Đang đọc...", percent: 50 } },
          } as MessageEvent);
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({
                data: {
                  id: data.id,
                  type: "success",
                  result: {
                    sourceFormat: "docx",
                    fileName: data.fileName,
                    markdown: "Docx content",
                    assets: [],
                    warnings: [],
                  },
                },
              } as MessageEvent);
            }
          }, 10);
        } else {
          // General error
          this.onmessage({
            data: { id: data.id, type: "error", error: "Worker error details" },
          } as MessageEvent);
        }
      }
    }, 10);
  });
  terminate = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

global.Worker = MockWorker as unknown as typeof Worker;

describe("Worker Client Protocol & Fallbacks", () => {
  afterAll(() => {
    delete (global as unknown as { window?: unknown }).window;
  });

  it("should handle progress updates and successful conversion in worker", async () => {
    const progressCalls: ProgressPayload[] = [];
    const result = await runInWorker(
      "docx",
      "test.docx",
      new ArrayBuffer(8),
      undefined,
      (p) => progressCalls.push(p)
    );

    expect(progressCalls.length).toBeGreaterThanOrEqual(1);
    expect(progressCalls[0]).toEqual({ stage: "Đang đọc...", percent: 50 });
    expect(result.sourceFormat).toBe("docx");
    expect(result.markdown).toBe("Docx content");
  });

  it("should report fallback request for unsupported environment (e.g. PPTX DOMParser absent)", async () => {
    await expect(
      runInWorker("pptx", "test.pptx", new ArrayBuffer(8))
    ).rejects.toThrow("FALLBACK_TO_MAIN_THREAD");
  });

  it("should propagate other worker errors as standard exceptions", async () => {
    await expect(
      runInWorker("xlsx", "test.xlsx", new ArrayBuffer(8))
    ).rejects.toThrow("Worker error details");
  });

  it("should support AbortSignal cancellation", async () => {
    const controller = new AbortController();
    const removeListenerSpy = vi.spyOn(controller.signal, "removeEventListener");
    const promise = runInWorker("docx", "test.docx", new ArrayBuffer(8), undefined, undefined, controller.signal);
    controller.abort();

    await expect(promise).rejects.toThrow("Import cancelled");
    expect(removeListenerSpy).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});
