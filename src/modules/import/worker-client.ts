import type { ImportResult } from "@/types";

export interface ProgressPayload {
  stage: string;
  percent: number;
}

export type ProgressCallback = (progress: ProgressPayload) => void;

/**
 * Executes a conversion task inside a dedicated Web Worker.
 * Supports progress tracking, ArrayBuffer transferables, and cancellation via AbortSignal.
 */
export function runInWorker(
  format: "docx" | "xlsx" | "pptx" | "pdf",
  fileName: string,
  arrayBuffer?: ArrayBuffer,
  pages?: unknown,
  onProgress?: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Worker is only available in browser environment"));
    }

    let worker: Worker;
    try {
      worker = new Worker(new URL("./import.worker.ts", import.meta.url));
    } catch (err) {
      return reject(err);
    }

    const jobId = crypto.randomUUID();
    let settled = false;

    const cleanup = () => {
      abortSignal?.removeEventListener("abort", onAbort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };

    const resolveOnce = (result: ImportResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const rejectOnce = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const onAbort = () => rejectOnce(new Error("Import cancelled"));

    if (abortSignal) {
      if (abortSignal.aborted) {
        rejectOnce(new Error("Import cancelled"));
        return;
      }
      abortSignal.addEventListener("abort", onAbort, { once: true });
    }

    worker.onmessage = (e) => {
      const { id, type, progress, result, error } = e.data;
      if (id !== jobId) return;

      if (type === "progress") {
        if (onProgress && progress) {
          onProgress(progress);
        }
      } else if (type === "success") {
        resolveOnce(result);
      } else if (type === "error") {
        if (error === "FALLBACK_TO_MAIN_THREAD") {
          rejectOnce(new Error("FALLBACK_TO_MAIN_THREAD"));
        } else {
          rejectOnce(new Error(error || "Worker conversion error"));
        }
      }
    };

    worker.onerror = (err) => {
      rejectOnce(err.error || new Error(err.message || "Worker conversion error"));
    };

    // Construct transferable array list
    const transferables: Transferable[] = [];
    if (arrayBuffer) {
      transferables.push(arrayBuffer);
    }

    worker.postMessage(
      {
        id: jobId,
        format,
        fileName,
        arrayBuffer,
        pages,
      },
      transferables
    );
  });
}
