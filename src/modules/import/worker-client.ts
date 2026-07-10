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

    if (abortSignal) {
      if (abortSignal.aborted) {
        worker.terminate();
        return reject(new Error("Import cancelled"));
      }
      abortSignal.addEventListener("abort", () => {
        worker.terminate();
        reject(new Error("Import cancelled"));
      });
    }

    worker.onmessage = (e) => {
      const { id, type, progress, result, error } = e.data;
      if (id !== jobId) return;

      if (type === "progress") {
        if (onProgress && progress) {
          onProgress(progress);
        }
      } else if (type === "success") {
        worker.terminate();
        resolve(result);
      } else if (type === "error") {
        worker.terminate();
        if (error === "FALLBACK_TO_MAIN_THREAD") {
          reject(new Error("FALLBACK_TO_MAIN_THREAD"));
        } else {
          reject(new Error(error || "Worker conversion error"));
        }
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
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
