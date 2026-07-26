// Shared bounded-body reader for untrusted request bodies (W25-2-C): every
// network boundary must enforce an actual byte cap DURING the stream read —
// never trust Content-Length alone, and never fully materialize an
// unbounded body before checking it. Originally implemented in
// src/app/api/pdf/route.ts (the PDF gateway); factored out so
// src/app/api/pdf/ticket/route.ts (ticket issuance) can share the same
// cap+deadline+cancellation guarantees instead of using unbounded req.json().

export type BoundedBodyResult =
  | { ok: true; text: string }
  | { ok: false; status: number; message: string };

export async function readBoundedBody(
  request: Request,
  maxBytes: number,
  idleMs: number,
  totalMs: number,
): Promise<BoundedBodyResult> {
  if (
    !Number.isSafeInteger(maxBytes) ||
    maxBytes <= 0 ||
    !Number.isSafeInteger(idleMs) ||
    idleMs <= 0 ||
    !Number.isSafeInteger(totalMs) ||
    totalMs <= 0
  ) {
    return { ok: false, status: 500, message: "Invalid bounded-body configuration." };
  }

  const body = request.body;
  if (!body) return { ok: true, text: "" };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const deadlineAt = Date.now() + totalMs;
  let aborted = request.signal.aborted;
  let resolveAbort: (() => void) | undefined;
  const abortSignal = new Promise<"aborted">((resolve) => {
    resolveAbort = () => resolve("aborted");
  });
  const onAbort = () => {
    aborted = true;
    resolveAbort?.();
  };
  request.signal.addEventListener("abort", onAbort, { once: true });

  try {
    while (true) {
      if (aborted) {
        await reader.cancel(request.signal.reason).catch(() => undefined);
        return { ok: false, status: 499, message: "Request was aborted." };
      }

      const remaining = deadlineAt - Date.now();
      if (remaining <= 0) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, status: 408, message: "Request body read total deadline exceeded." };
      }

      let idleTimer: ReturnType<typeof setTimeout>;
      const timeoutKind = idleMs <= remaining ? "idle" : "total";
      const deadlineSignal = new Promise<"idle" | "total">((resolve) => {
        idleTimer = setTimeout(() => resolve(timeoutKind), Math.min(idleMs, remaining));
      });

      const result = await Promise.race([reader.read(), deadlineSignal, abortSignal]);
      clearTimeout(idleTimer!);

      if (aborted || result === "aborted") {
        await reader.cancel(request.signal.reason).catch(() => undefined);
        return { ok: false, status: 499, message: "Request was aborted." };
      }

      if (result === "idle" || result === "total") {
        await reader.cancel().catch(() => undefined);
        return {
          ok: false,
          status: 408,
          message:
            result === "total"
              ? "Request body read total deadline exceeded."
              : "Request body read idle timeout.",
        };
      }

      const { done, value } = result;
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel().catch(() => undefined);
          return { ok: false, status: 413, message: "Request body exceeds size limit." };
        }
        chunks.push(value);
      }
    }
  } catch {
    return { ok: false, status: 400, message: "Failed to read request body." };
  } finally {
    request.signal.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(combined) };
  } catch {
    return { ok: false, status: 400, message: "Request body is not valid UTF-8." };
  }
}
