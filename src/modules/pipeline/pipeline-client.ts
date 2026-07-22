import type { PipelineRequest, PipelineResponse } from "@/types";

// W24-I: every pipeline request must end in success, stale, timeout, or a
// recoverable error — never a hanging Promise. The worker is managed by
// generation: any failure (error / messageerror / timeout) atomically rejects
// every pending task of the dead generation, clears its timers, terminates the
// worker, and lets the NEXT request spawn a fresh generation. Repeated crashes
// open a circuit so we fall back to the main thread instead of a respawn storm.
//
// W24-J (S1 coalescing + S3 bounded cache): per projectId:operation there is at
// most ONE in-flight request plus ONE queued "latest"; a superseded queued
// request is rejected stale BEFORE it ever reaches the worker, so rapid typing
// cannot pile CPU work onto the worker. The success cache holds only the LAST
// successful response per operation (bounded, cleared on reset/project change),
// instead of an unbounded Map that grows with every revision hash.
// (S2 asset-delta protocol and S4 render-ready migration are deferred to the
// O-profiler-gated follow-up per this contract's S0/exit-path guidance.)

export class StalePipelineResponseError extends Error {}
export class PipelineWorkerError extends Error {}
export class PipelineTimeoutError extends Error {}

type PendingTask = {
  resolve: (response: PipelineResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  generation: number;
};

type QueuedTask = {
  request: PipelineRequest;
  resolve: (response: PipelineResponse) => void;
  reject: (error: Error) => void;
};

type CacheEntry = { cacheKey: string; response: PipelineResponse };

// Per-operation ceilings: preview is on the keystroke hot path so it fails fast;
// check/format do more work and get a longer budget.
const OPERATION_TIMEOUT_MS: Record<PipelineRequest["operation"], number> = {
  preview: 8_000,
  check: 15_000,
  format: 15_000,
};
// Two hard crashes → open the circuit for the rest of the session.
const CIRCUIT_CRASH_THRESHOLD = 2;

// Bounded success cache: at most one entry per operationKey (projectId:operation).
const cache = new Map<string, CacheEntry>();
const pending = new Map<string, PendingTask>();
const latest = new Map<string, string>();
// Coalescing state per operationKey.
const inFlight = new Set<string>();
const queued = new Map<string, QueuedTask>();

let worker: Worker | null | undefined; // undefined = not created; null = deliberately none
let generation = 0;
let crashCount = 0;
let circuitOpen = false;

function canUseWorker(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

function operationKeyOf(request: Pick<PipelineRequest, "projectId" | "operation">): string {
  return `${request.projectId}:${request.operation}`;
}

function rejectGeneration(gen: number, error: Error): void {
  for (const [requestId, task] of [...pending]) {
    if (task.generation !== gen) continue;
    clearTimeout(task.timer);
    pending.delete(requestId);
    task.reject(error);
  }
}

function destroyWorker(): void {
  const dead = worker;
  worker = undefined;
  try {
    dead?.terminate();
  } catch {
    // ignore terminate failures on an already-dead worker
  }
}

// A hard crash (top-level ReferenceError like `document is not defined`,
// deserialization failure). Counts toward the circuit breaker.
function handleWorkerCrash(gen: number, error: Error): void {
  if (gen !== generation) return; // failure from an already-replaced generation
  crashCount += 1;
  rejectGeneration(gen, error);
  destroyWorker();
  if (crashCount >= CIRCUIT_CRASH_THRESHOLD) circuitOpen = true;
}

// A timeout means the single-threaded worker is likely wedged: recycle it and
// reject its pending tasks, but do NOT count it as a crash (a slow document is
// not a broken dependency).
function handleWorkerTimeout(gen: number, error: Error): void {
  if (gen !== generation) return;
  rejectGeneration(gen, error);
  destroyWorker();
}

function workerInstance(): Worker | null {
  if (circuitOpen) return null;
  if (worker !== undefined) return worker;
  if (!canUseWorker()) {
    worker = null;
    return null;
  }
  generation += 1;
  const gen = generation;
  const instance = new Worker(new URL("./pipeline.worker.ts", import.meta.url), { type: "module" });
  worker = instance;

  instance.addEventListener("message", (event: MessageEvent<PipelineResponse>) => {
    const response = event.data;
    const task = pending.get(response.requestId);
    if (!task) return;
    clearTimeout(task.timer);
    pending.delete(response.requestId);
    if (latest.get(operationKeyOf(response)) !== response.requestId) {
      task.reject(new StalePipelineResponseError("Discarded stale pipeline response."));
      return;
    }
    crashCount = 0; // a healthy response clears the crash streak
    task.resolve(response);
  });

  instance.addEventListener("error", (event: ErrorEvent) => {
    handleWorkerCrash(gen, new PipelineWorkerError(event.message || "Pipeline worker crashed."));
  });
  instance.addEventListener("messageerror", () => {
    handleWorkerCrash(gen, new PipelineWorkerError("Pipeline worker message could not be deserialized."));
  });

  return instance;
}

async function runOnMainThread(request: PipelineRequest): Promise<PipelineResponse> {
  // Yield once so a large fallback parse does not block synchronously in the
  // same task as the caller. (executePipelineRequest already returns ok:false on
  // internal errors, so this never throws for content issues.)
  await Promise.resolve();
  return (await import("./pipeline-core")).executePipelineRequest(request);
}

// The raw dispatch of a single request to the worker (or main-thread fallback).
function executeDispatch(request: PipelineRequest): Promise<PipelineResponse> {
  const activeWorker = workerInstance();
  if (!activeWorker) return runOnMainThread(request);
  const gen = generation;
  return new Promise<PipelineResponse>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!pending.has(request.requestId)) return;
      pending.delete(request.requestId);
      const timeoutError = new PipelineTimeoutError(`Pipeline ${request.operation} timed out.`);
      handleWorkerTimeout(gen, timeoutError);
      reject(timeoutError);
    }, OPERATION_TIMEOUT_MS[request.operation]);
    pending.set(request.requestId, { resolve, reject, timer, generation: gen });
    try {
      activeWorker.postMessage(request);
    } catch (error) {
      clearTimeout(timer);
      pending.delete(request.requestId);
      handleWorkerCrash(gen, new PipelineWorkerError(error instanceof Error ? error.message : "postMessage failed."));
      reject(error instanceof Error ? error : new PipelineWorkerError("postMessage failed."));
    }
  });
}

// Dispatch now, then drain the coalesced "latest" queued for this operation.
async function dispatchNow(operationKey: string, request: PipelineRequest): Promise<PipelineResponse> {
  inFlight.add(operationKey);
  try {
    const response = await executeDispatch(request);
    if (latest.get(operationKey) !== request.requestId) {
      throw new StalePipelineResponseError("Discarded stale pipeline response.");
    }
    if (response.ok) cache.set(operationKey, { cacheKey: request.cacheKey, response });
    return response;
  } finally {
    inFlight.delete(operationKey);
    const next = queued.get(operationKey);
    if (next) {
      queued.delete(operationKey);
      if (latest.get(operationKey) === next.request.requestId) {
        void dispatchNow(operationKey, next.request).then(next.resolve, next.reject);
      } else {
        next.reject(new StalePipelineResponseError("Discarded stale pipeline response."));
      }
    }
  }
}

export async function runPipelineRequest(request: PipelineRequest): Promise<PipelineResponse> {
  const operationKey = operationKeyOf(request);

  const cached = cache.get(operationKey);
  if (cached && cached.cacheKey === request.cacheKey) {
    return { ...cached.response, requestId: request.requestId } as PipelineResponse;
  }

  latest.set(operationKey, request.requestId);

  // Coalesce: if something is already running for this operation, hold only the
  // most recent request as the single queued "latest"; drop the previous queued.
  if (inFlight.has(operationKey)) {
    const previous = queued.get(operationKey);
    if (previous) previous.reject(new StalePipelineResponseError("Superseded by a newer pipeline request."));
    return new Promise<PipelineResponse>((resolve, reject) => {
      queued.set(operationKey, { request, resolve, reject });
    });
  }

  return dispatchNow(operationKey, request);
}

/** Clear cached responses — for one project, or all. Call on project unmount/reset. */
export function clearPipelineCache(projectId?: string): void {
  if (!projectId) {
    cache.clear();
    return;
  }
  for (const key of [...cache.keys()]) {
    if (key.startsWith(`${projectId}:`)) cache.delete(key);
  }
}

export function resetPipelineClientForTests(): void {
  for (const [requestId, task] of [...pending]) {
    clearTimeout(task.timer);
    pending.delete(requestId);
    task.reject(new PipelineWorkerError("Pipeline client reset."));
  }
  for (const [key, task] of [...queued]) {
    queued.delete(key);
    task.reject(new PipelineWorkerError("Pipeline client reset."));
  }
  destroyWorker();
  cache.clear();
  latest.clear();
  inFlight.clear();
  generation = 0;
  crashCount = 0;
  circuitOpen = false;
}
