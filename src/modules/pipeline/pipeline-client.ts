import type { PipelineRequest, PipelineResponse } from "@/types";

const cache = new Map<string, PipelineResponse>();
const pending = new Map<string, { resolve: (response: PipelineResponse) => void; reject: (error: Error) => void }>();
const latest = new Map<string, string>();
let worker: Worker | null | undefined;

export class StalePipelineResponseError extends Error {}

function workerInstance(): Worker | null {
  if (worker !== undefined) return worker;
  worker = typeof window !== "undefined" && typeof Worker !== "undefined"
    ? new Worker(new URL("./pipeline.worker.ts", import.meta.url), { type: "module" })
    : null;
  worker?.addEventListener("message", (event: MessageEvent<PipelineResponse>) => {
    const response = event.data;
    const operationKey = `${response.projectId}:${response.operation}`;
    const task = pending.get(response.requestId);
    if (!task) return;
    pending.delete(response.requestId);
    if (latest.get(operationKey) !== response.requestId) {
      task.reject(new StalePipelineResponseError("Discarded stale pipeline response."));
      return;
    }
    task.resolve(response);
  });
  return worker;
}

export async function runPipelineRequest(request: PipelineRequest): Promise<PipelineResponse> {
  const cached = cache.get(request.cacheKey);
  if (cached) return { ...cached, requestId: request.requestId } as PipelineResponse;
  const operationKey = `${request.projectId}:${request.operation}`;
  latest.set(operationKey, request.requestId);
  const activeWorker = workerInstance();
  const response = activeWorker
    ? await new Promise<PipelineResponse>((resolve, reject) => {
        pending.set(request.requestId, { resolve, reject });
        activeWorker.postMessage(request);
      })
    : await (await import("./pipeline-core")).executePipelineRequest(request);
  if (latest.get(operationKey) !== request.requestId) {
    throw new StalePipelineResponseError("Discarded stale pipeline response.");
  }
  if (response.ok) cache.set(request.cacheKey, response);
  return response;
}

export function resetPipelineClientForTests(): void {
  worker?.terminate();
  worker = undefined;
  cache.clear();
  pending.clear();
  latest.clear();
}
