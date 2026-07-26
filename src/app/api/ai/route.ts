import { NextResponse } from "next/server";
import { aiActionSchema } from "@/types/ai";
import type { AiAction, AiStreamEvent, AiUsage } from "@/types/ai";
import { createRateLimiter, aiAddressIdentity, aiKeyIdentity } from "@/lib/server/rate-limit";
import { readBoundedBody } from "@/lib/server/bounded-body";
import {
  parseGeminiChunk,
  extractJsonObjects,
  MAX_GEMINI_BUFFER_BYTES,
} from "./providers/gemini";
import { parseOpenAiLine, MAX_OPENAI_LINE_BYTES } from "./providers/openai";
import { parseAnthropicLine, MAX_ANTHROPIC_LINE_BYTES } from "./providers/anthropic";

type AiProvider = "gemini" | "openai" | "anthropic";

type AiProxyRequest = {
  action: AiAction;
  input: string;
  provider: AiProvider;
  model?: string;
};

const GENERIC_PROVIDER_ERROR =
  "AI provider request failed. Please check your API key, quota, model, or provider status.";
const GENERIC_STREAM_EXCEEDED_ERROR =
  "AI response stream exceeded maximum allowed output size.";
const GENERIC_PROTOCOL_ERROR =
  "AI provider returned a malformed or incomplete streaming response.";
const GENERIC_SERVER_ERROR =
  "An internal server error occurred while processing the AI request.";

const MAX_BODY_BYTES = 512 * 1024;
const REQUEST_BODY_IDLE_MS = 10_000;
const REQUEST_BODY_TOTAL_MS = 20_000;
const MAX_INPUT_CHARS = 100_000;
const MAX_MODEL_CHARS = 128;
const MAX_OUTPUT_TOKENS = 4_000;
const AI_TIMEOUT_MS = 60_000;
const STREAM_IDLE_TIMEOUT_MS = 20_000; // no upstream progress for this long -> abort

// Stream budget caps
const MAX_UPSTREAM_BYTES = 2 * 1024 * 1024; // 2 MiB max raw upstream bytes
const MAX_TOTAL_DELTA_CHARS = 50_000;       // 50,000 output characters max
const MAX_EVENTS = 2_000;                  // 2,000 NDJSON events max
const MAX_SINGLE_DELTA_CHARS = 16_000;     // 16,000 chars per single delta event max

const consumeAiAddressRateLimit = createRateLimiter({
  namespace: "ai-addr",
  requests: 20,
  windowSeconds: 60,
});
const consumeAiKeyRateLimit = createRateLimiter({
  namespace: "ai-key",
  requests: 20,
  windowSeconds: 60,
});

class ProviderRequestError extends Error {}

function validModel(model: string | undefined): boolean {
  return (
    model === undefined ||
    (model.length <= MAX_MODEL_CHARS && /^[a-zA-Z0-9._:/-]+$/.test(model))
  );
}

async function requestProvider(
  url: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<Response> {
  try {
    const response = await fetch(url, { ...init, signal });
    if (!response.ok) throw new ProviderRequestError(GENERIC_PROVIDER_ERROR);
    return response;
  } catch (error: unknown) {
    if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw error;
    }
    if (error instanceof ProviderRequestError) throw error;
    throw new ProviderRequestError(GENERIC_PROVIDER_ERROR);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseProvider(value: unknown): AiProvider | null {
  if (value === "gemini" || value === "openai" || value === "anthropic") return value;
  return null;
}

function parseRequestBody(body: unknown): AiProxyRequest | null {
  const record = asRecord(body);
  const actionResult = aiActionSchema.safeParse(record.action);
  const input = stringValue(record.input);
  const provider = parseProvider(record.provider);
  const model = stringValue(record.model);
  // record.requestId (if the client sent one) is deliberately never read: a
  // client-chosen value must not become the server's correlation ID (see
  // w25_fix-all-bugs.md §D). The server always mints its own below.

  if (
    !actionResult.success ||
    !input ||
    input.trim().length === 0 ||
    input.length > MAX_INPUT_CHARS ||
    !provider ||
    !validModel(model)
  ) {
    return null;
  }

  return {
    action: actionResult.data,
    input,
    provider,
    model,
  };
}

function buildPrompt(action: AiAction, input: string): string {
  switch (action) {
    case "rewrite":
      return `Hãy viết lại đoạn văn sau để hay hơn, mạch lạc hơn nhưng giữ nguyên ý nghĩa và định dạng Markdown:\n\n${input}`;
    case "tone":
      return `Hãy cải thiện văn phong của đoạn văn sau cho chuyên nghiệp, học thuật hơn phù hợp với báo cáo khoa học/kỹ thuật, giữ nguyên định dạng Markdown:\n\n${input}`;
    case "outline":
      return `Hãy tạo một dàn ý chi tiết cho báo cáo với chủ đề/nội dung sau dưới dạng cấu trúc Markdown:\n\n${input}`;
    case "translate":
      return [
        "Dịch nội dung Markdown sau giữa tiếng Việt và tiếng Anh.",
        "Nếu văn bản chính là tiếng Việt, dịch sang tiếng Anh học thuật. Nếu văn bản chính là tiếng Anh, dịch sang tiếng Việt học thuật.",
        "Giữ nguyên cấu trúc Markdown, heading, bảng, code block, link, ảnh và thuật ngữ kỹ thuật phổ biến khi không nên dịch.",
        "",
        input,
      ].join("\n");
    case "terminology":
      return [
        "Chuẩn hóa thuật ngữ học thuật/kỹ thuật trong nội dung Markdown sau.",
        "Giữ nguyên ý nghĩa, cấu trúc Markdown, heading, bảng, code block, link và ảnh.",
        "Ưu tiên thuật ngữ nhất quán, trang trọng, phù hợp báo cáo sinh viên/kỹ thuật; không tự thêm nội dung mới.",
        "",
        input,
      ].join("\n");
  }
}

export async function POST(req: Request) {
  try {
    const declaredLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 400 });
    }

    const apiKey = req.headers.get("x-api-key")?.trim() ?? "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key. Configure a local client API key in AI Settings." },
        { status: 401 },
      );
    }

    const addressLimit = await consumeAiAddressRateLimit(aiAddressIdentity(req));
    const keyLimit = await consumeAiKeyRateLimit(aiKeyIdentity(apiKey));
    if (!addressLimit.available || !keyLimit.available) {
      return NextResponse.json(
        { error: "AI service rate limiter is unavailable. Please retry shortly." },
        { status: 503 },
      );
    }
    if (!addressLimit.allowed || !keyLimit.allowed) {
      const retryAfterSeconds = Math.max(
        addressLimit.retryAfterSeconds,
        keyLimit.retryAfterSeconds,
      );
      return NextResponse.json(
        { error: "Too many AI requests. Please retry shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

    const bodyResult = await readBoundedBody(
      req,
      MAX_BODY_BYTES,
      REQUEST_BODY_IDLE_MS,
      REQUEST_BODY_TOTAL_MS,
    );
    if (!bodyResult.ok) {
      if (bodyResult.status === 499) return new Response(null, { status: 499 });
      return NextResponse.json(
        {
          error:
            bodyResult.status === 413
              ? "Request body is too large."
              : bodyResult.status === 408
                ? "Request body timed out."
                : "Request body must be valid UTF-8 JSON.",
        },
        { status: bodyResult.status },
      );
    }
    const rawBody = bodyResult.text;
    const parsed = parseRequestBody(JSON.parse(rawBody));

    if (!parsed) {
      return NextResponse.json(
        { error: "Missing or invalid required fields: action, input, provider" },
        { status: 400 },
      );
    }

    const { action, input, provider, model } = parsed;
    // Server-generated canonical ID — never derived from client input.
    const requestId = crypto.randomUUID();

    const prompt = buildPrompt(action, input);
    let selectedModel = "";
    let url = "";
    let fetchInit: RequestInit = {};

    if (provider === "gemini") {
      selectedModel = model || "gemini-1.5-flash";
      url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:streamGenerateContent`;
      fetchInit = {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
        }),
      };
    } else if (provider === "openai") {
      selectedModel = model || "gpt-4o";
      url = "https://api.openai.com/v1/chat/completions";
      fetchInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: MAX_OUTPUT_TOKENS,
          stream: true,
          stream_options: { include_usage: true },
        }),
      };
    } else {
      selectedModel = model || "claude-3-5-sonnet-20241022";
      url = "https://api.anthropic.com/v1/messages";
      fetchInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: MAX_OUTPUT_TOKENS,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      };
    }

    const providerController = new AbortController();

    // Link client request abort to provider request abort
    if (req.signal) {
      if (req.signal.aborted) {
        providerController.abort(req.signal.reason);
      } else {
        req.signal.addEventListener("abort", () => {
          providerController.abort(req.signal.reason);
        }, { once: true });
      }
    }

    // Set overall timeout
    const timeoutId = setTimeout(() => {
      providerController.abort(new DOMException("The operation timed out.", "TimeoutError"));
    }, AI_TIMEOUT_MS);

    let response: Response;
    try {
      response = await requestProvider(url, fetchInit, providerController.signal);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
        return NextResponse.json({ error: "AI provider request timed out." }, { status: 504 });
      }
      if (error instanceof ProviderRequestError) {
        return NextResponse.json({ error: GENERIC_PROVIDER_ERROR }, { status: 502 });
      }
      return NextResponse.json({ error: GENERIC_SERVER_ERROR }, { status: 500 });
    }

    const providerContentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    const validProviderContentType =
      provider === "gemini"
        ? providerContentType.includes("application/json")
        : providerContentType.includes("text/event-stream");
    if (!validProviderContentType) {
      clearTimeout(timeoutId);
      providerController.abort();
      await response.body?.cancel().catch(() => undefined);
      return NextResponse.json({ error: GENERIC_PROTOCOL_ERROR }, { status: 502 });
    }

    // ------------------------------------------------------------------
    // Pull-aware NDJSON bridge (§D): each `pull()` call performs AT MOST one
    // upstream read, so the stream machinery only asks for more when the
    // downstream consumer actually wants it (governed by desiredSize) —
    // never a greedy loop that drains the whole upstream regardless of
    // whether anyone is reading.
    // ------------------------------------------------------------------
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8", { fatal: true });

    let totalUpstreamBytes = 0;
    let totalDeltaChars = 0;
    let totalEvents = 0;
    let totalFrames = 0;
    let buffer = "";
    let anthropicInputTokens: number | undefined;
    let anthropicOutputTokens: number | undefined;
    let parsedUsage: AiUsage | undefined;
    let terminalSent = false;
    let geminiIncompleteObject = false; // true only if buffer ends mid-{object}, not trailing `]`/`,`
    const reader = response.body?.getReader();

    type ChunkResult = { ok: true } | { ok: false; code: string; message: string };

    function countFrame(): ChunkResult {
      totalFrames += 1;
      return totalFrames > MAX_EVENTS
        ? { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR }
        : { ok: true };
    }

    function emitDelta(controller: ReadableStreamDefaultController<Uint8Array>, deltaText: string): ChunkResult {
      if (deltaText.length > MAX_SINGLE_DELTA_CHARS) {
        return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
      }
      totalDeltaChars += deltaText.length;
      if (totalDeltaChars > MAX_TOTAL_DELTA_CHARS) {
        return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
      }
      if (totalEvents >= MAX_EVENTS) {
        return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
      }
      totalEvents += 1;
      controller.enqueue(encoder.encode(JSON.stringify({ event: "delta", text: deltaText } satisfies AiStreamEvent) + "\n"));
      return { ok: true };
    }

    function processGeminiText(controller: ReadableStreamDefaultController<Uint8Array>, text: string): ChunkResult {
      buffer += text;
      if (new TextEncoder().encode(buffer).byteLength > MAX_GEMINI_BUFFER_BYTES) {
        return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
      }
      let extracted: { objects: string[]; remaining: string; incomplete: boolean };
      try {
        extracted = extractJsonObjects(buffer);
      } catch {
        return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
      }
      buffer = extracted.remaining;
      geminiIncompleteObject = extracted.incomplete;
      for (const objText of extracted.objects) {
        const frameResult = countFrame();
        if (!frameResult.ok) return frameResult;
        const parsedChunk = parseGeminiChunk(objText);
        if (!parsedChunk) continue;
        if (parsedChunk.limitExceeded) {
          return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
        }
        if (parsedChunk.malformed) {
          return { ok: false, code: "AI_PROTOCOL_ERROR", message: GENERIC_PROTOCOL_ERROR };
        }
        if (parsedChunk.delta) {
          const result = emitDelta(controller, parsedChunk.delta);
          if (!result.ok) return result;
        }
        if (parsedChunk.usage) parsedUsage = parsedChunk.usage;
      }
      return { ok: true };
    }

    function processOpenAiText(controller: ReadableStreamDefaultController<Uint8Array>, text: string): ChunkResult {
      buffer += text;
      if (
        buffer.indexOf("\n") === -1 &&
        new TextEncoder().encode(buffer).byteLength > MAX_OPENAI_LINE_BYTES
      ) {
        return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
      }
      let lineEndIndex: number;
      while ((lineEndIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, lineEndIndex);
        buffer = buffer.slice(lineEndIndex + 1);
        const cleanLine = line.endsWith("\r") ? line.slice(0, -1) : line;
        if (cleanLine.trim().startsWith("data:")) {
          const frameResult = countFrame();
          if (!frameResult.ok) return frameResult;
        }
        const parsedChunk = parseOpenAiLine(cleanLine);
        if (!parsedChunk) continue;
        if (parsedChunk.limitExceeded) {
          return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
        }
        if (parsedChunk.malformed) {
          return { ok: false, code: "AI_PROTOCOL_ERROR", message: GENERIC_PROTOCOL_ERROR };
        }
        if (parsedChunk.delta) {
          const result = emitDelta(controller, parsedChunk.delta);
          if (!result.ok) return result;
        }
        if (parsedChunk.usage) parsedUsage = parsedChunk.usage;
      }
      return { ok: true };
    }

    function processAnthropicText(controller: ReadableStreamDefaultController<Uint8Array>, text: string): ChunkResult {
      buffer += text;
      if (
        buffer.indexOf("\n") === -1 &&
        new TextEncoder().encode(buffer).byteLength > MAX_ANTHROPIC_LINE_BYTES
      ) {
        return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
      }
      let lineEndIndex: number;
      while ((lineEndIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, lineEndIndex);
        buffer = buffer.slice(lineEndIndex + 1);
        const cleanLine = line.endsWith("\r") ? line.slice(0, -1) : line;
        if (cleanLine.trim().startsWith("data:")) {
          const frameResult = countFrame();
          if (!frameResult.ok) return frameResult;
        }
        const parsedChunk = parseAnthropicLine(cleanLine);
        if (!parsedChunk) continue;
        if (parsedChunk.limitExceeded) {
          return { ok: false, code: "AI_STREAM_EXCEEDED", message: GENERIC_STREAM_EXCEEDED_ERROR };
        }
        if (parsedChunk.malformed) {
          return { ok: false, code: "AI_PROTOCOL_ERROR", message: GENERIC_PROTOCOL_ERROR };
        }
        if (parsedChunk.delta) {
          const result = emitDelta(controller, parsedChunk.delta);
          if (!result.ok) return result;
        }
        if (parsedChunk.inputTokens !== undefined) anthropicInputTokens = parsedChunk.inputTokens;
        if (parsedChunk.outputTokens !== undefined) anthropicOutputTokens = parsedChunk.outputTokens;
      }
      return { ok: true };
    }

    function processText(controller: ReadableStreamDefaultController<Uint8Array>, text: string): ChunkResult {
      if (provider === "gemini") return processGeminiText(controller, text);
      if (provider === "openai") return processOpenAiText(controller, text);
      return processAnthropicText(controller, text);
    }

    function finishTerminal(controller: ReadableStreamDefaultController<Uint8Array>, event: AiStreamEvent): void {
      if (terminalSent) return;
      terminalSent = true;
      clearTimeout(timeoutId);
      controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      controller.close();
    }

    async function abortWithError(
      controller: ReadableStreamDefaultController<Uint8Array>,
      code: string,
      message: string,
      logExtra?: Record<string, unknown>,
    ): Promise<void> {
      await reader?.cancel().catch(() => undefined);
      providerController.abort();
      console.error("[AI Stream Error]", { requestId, provider, model: selectedModel, code, ...logExtra });
      finishTerminal(controller, { event: "error", requestId, code, message });
    }

    // Handles the EOF case: flush the decoder (rejects invalid/incomplete
    // trailing UTF-8), then try to salvage one last unterminated line/object
    // — a real upstream may end its final `data:` line without a trailing
    // newline — before deciding whether the stream ended cleanly.
    async function finalize(controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> {
      try {
        decoder.decode();
      } catch {
        await abortWithError(controller, "AI_PROTOCOL_ERROR", "Upstream response ended with invalid/incomplete UTF-8.");
        return;
      }

      if (buffer.trim().length > 0) {
        if (provider === "gemini") {
          // Only a genuine mid-object truncation is an error — trailing `]`/
          // `,`/whitespace is expected wire-format boilerplate around
          // Gemini's `[ {...}, {...} ]` array response.
          if (geminiIncompleteObject) {
            await abortWithError(controller, "AI_PROTOCOL_ERROR", GENERIC_PROTOCOL_ERROR, { reason: "trailing_incomplete_object" });
            return;
          }
          buffer = "";
        } else {
          const cleanLine = buffer.endsWith("\r") ? buffer.slice(0, -1) : buffer;
          buffer = "";
          if (cleanLine.trim().startsWith("data:")) {
            const frameResult = countFrame();
            if (!frameResult.ok) {
              await abortWithError(controller, frameResult.code, frameResult.message);
              return;
            }
          }
          const parsedChunk = provider === "openai" ? parseOpenAiLine(cleanLine) : parseAnthropicLine(cleanLine);
          if (parsedChunk?.limitExceeded) {
            await abortWithError(controller, "AI_STREAM_EXCEEDED", GENERIC_STREAM_EXCEEDED_ERROR);
            return;
          }
          if (parsedChunk?.malformed) {
            await abortWithError(controller, "AI_PROTOCOL_ERROR", GENERIC_PROTOCOL_ERROR, { reason: "trailing_incomplete_line" });
            return;
          }
          if (parsedChunk?.delta) {
            const result = emitDelta(controller, parsedChunk.delta);
            if (!result.ok) {
              await abortWithError(controller, result.code, result.message);
              return;
            }
          }
          if (provider === "openai" && parsedChunk && "usage" in parsedChunk && parsedChunk.usage) {
            parsedUsage = parsedChunk.usage;
          }
          if (provider === "anthropic" && parsedChunk) {
            if ("inputTokens" in parsedChunk && parsedChunk.inputTokens !== undefined) anthropicInputTokens = parsedChunk.inputTokens;
            if ("outputTokens" in parsedChunk && parsedChunk.outputTokens !== undefined) anthropicOutputTokens = parsedChunk.outputTokens;
          }
        }
      }

      if (provider === "anthropic" && (anthropicInputTokens !== undefined || anthropicOutputTokens !== undefined)) {
        parsedUsage = { inputTokens: anthropicInputTokens, outputTokens: anthropicOutputTokens, estimated: false };
      }

      clearTimeout(timeoutId);
      finishTerminal(controller, { event: "done", requestId, usage: parsedUsage });
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Meta event must go out first, before any pull-driven reads.
        controller.enqueue(
          encoder.encode(JSON.stringify({ event: "meta", requestId, provider, model: selectedModel } satisfies AiStreamEvent) + "\n"),
        );
        if (!reader) {
          void abortWithError(controller, "AI_PROVIDER_ERROR", GENERIC_PROVIDER_ERROR, { reason: "no_response_body" });
        }
      },
      async pull(controller) {
        if (terminalSent || !reader) return;

        // A pull() call MUST enqueue at least one chunk (or close/error)
        // before returning — the stream is only re-invoked on desiredSize
        // changes caused by an enqueue/dequeue, so a pull() that reads
        // upstream data but produces no visible output (e.g. a usage-only
        // frame with no delta text) would otherwise stall the stream
        // forever. Loop internally until we have something to enqueue.
        let readsThisPull = 0;
        while (!terminalSent && readsThisPull < 1) {
          readsThisPull += 1;
          let idleTimer: ReturnType<typeof setTimeout> | undefined;
          type ReadOutcome = ReadableStreamReadResult<Uint8Array> | "idle";
          let outcome: ReadOutcome;
          try {
            outcome = await Promise.race<ReadOutcome>([
              reader.read(),
              new Promise<"idle">((resolve) => {
                idleTimer = setTimeout(() => resolve("idle"), STREAM_IDLE_TIMEOUT_MS);
              }),
            ]);
          } catch {
            clearTimeout(idleTimer);
            if (req.signal?.aborted ?? false) {
              terminalSent = true;
              clearTimeout(timeoutId);
              controller.error(new Error("aborted"));
              return;
            }
            if (providerController.signal.aborted) {
              await abortWithError(controller, "AI_TIMEOUT", "AI provider request timed out.");
              return;
            }
            await abortWithError(controller, "AI_PROVIDER_ERROR", GENERIC_PROVIDER_ERROR, { reason: "read_error" });
            return;
          }
          clearTimeout(idleTimer);

          if (outcome === "idle") {
            await abortWithError(controller, "AI_STREAM_IDLE_TIMEOUT", "AI provider stream stalled (no data received in time).");
            return;
          }

          const { done, value } = outcome;
          if (done) {
            await finalize(controller);
            return;
          }
          if (!value) continue;

          totalUpstreamBytes += value.byteLength;
          if (totalUpstreamBytes > MAX_UPSTREAM_BYTES) {
            await abortWithError(controller, "AI_STREAM_EXCEEDED", GENERIC_STREAM_EXCEEDED_ERROR, { reason: "upstream_bytes" });
            return;
          }

          let text: string;
          try {
            text = decoder.decode(value, { stream: true });
          } catch {
            await abortWithError(controller, "AI_PROTOCOL_ERROR", "Invalid UTF-8 in upstream response.");
            return;
          }

          const eventsBefore = totalEvents;
          const result = processText(controller, text);
          if (!result.ok) {
            await abortWithError(controller, result.code, result.message);
            return;
          }
          if (totalEvents > eventsBefore) return; // enqueued something — let the stream re-pull when it wants more
          // else: this chunk produced no visible event (e.g. usage-only
          // frame) — loop and read the next upstream chunk immediately.
        }
        if (!terminalSent) controller.enqueue(new Uint8Array());
      },
      cancel() {
        terminalSent = true;
        clearTimeout(timeoutId);
        providerController.abort();
        void reader?.cancel().catch(() => undefined);
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson;charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return NextResponse.json({ error: "AI provider request timed out." }, { status: 504 });
    }
    if (error instanceof ProviderRequestError) {
      return NextResponse.json({ error: GENERIC_PROVIDER_ERROR }, { status: 502 });
    }
    return NextResponse.json(
      { error: GENERIC_SERVER_ERROR },
      { status: 500 },
    );
  }
}
