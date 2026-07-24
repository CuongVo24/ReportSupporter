import { NextResponse } from "next/server";
import { aiActionSchema } from "@/types/ai";
import type { AiAction, AiStreamEvent, AiUsage } from "@/types/ai";
import { createRateLimiter, aiAddressIdentity, aiKeyIdentity } from "@/lib/server/rate-limit";
import { parseGeminiChunk, extractJsonObjects } from "./providers/gemini";
import { parseOpenAiLine } from "./providers/openai";
import { parseAnthropicLine } from "./providers/anthropic";

type AiProvider = "gemini" | "openai" | "anthropic";

type AiProxyRequest = {
  action: AiAction;
  input: string;
  provider: AiProvider;
  model?: string;
  requestId?: string;
};

const GENERIC_PROVIDER_ERROR =
  "AI provider request failed. Please check your API key, quota, model, or provider status.";
const MAX_BODY_BYTES = 512 * 1024;
const MAX_INPUT_CHARS = 100_000;
const MAX_MODEL_CHARS = 128;
const MAX_OUTPUT_TOKENS = 4_000;
const AI_TIMEOUT_MS = 60_000;
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
  return model === undefined || (
    model.length <= MAX_MODEL_CHARS &&
    /^[a-zA-Z0-9._:/-]+$/.test(model)
  );
}

async function requestProvider(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
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
  const requestId = stringValue(record.requestId);

  if (
    !actionResult.success ||
    !input ||
    input.trim().length === 0 ||
    input.length > MAX_INPUT_CHARS ||
    !provider ||
    !validModel(model)
  ) return null;

  return {
    action: actionResult.data,
    input,
    provider,
    model,
    requestId,
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

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }
    const parsed = parseRequestBody(JSON.parse(rawBody));

    if (!parsed) {
      return NextResponse.json(
        { error: "Missing or invalid required fields: action, input, provider" },
        { status: 400 },
      );
    }

    const { action, input, provider, model, requestId: suppliedRequestId } = parsed;
    const requestId = suppliedRequestId || crypto.randomUUID();

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
        });
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
      const message = error instanceof Error ? error.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Create dynamic readable stream to pipe to client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder("utf-8", { fatal: false });

        // Meta event must go out first
        const metaEvent: AiStreamEvent = {
          event: "meta",
          requestId,
          provider,
          model: selectedModel,
        };
        controller.enqueue(encoder.encode(JSON.stringify(metaEvent) + "\n"));

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(JSON.stringify({
            event: "error",
            requestId,
            message: "Provider did not return a streamable response body.",
          } as AiStreamEvent) + "\n"));
          controller.close();
          clearTimeout(timeoutId);
          return;
        }

        let buffer = "";
        let anthropicInputTokens: number | undefined;
        let anthropicOutputTokens: number | undefined;
        let parsedUsage: AiUsage | undefined;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });

            if (provider === "gemini") {
              buffer += text;
              const { objects, remaining } = extractJsonObjects(buffer);
              buffer = remaining;

              for (const objText of objects) {
                const parsed = parseGeminiChunk(objText);
                if (parsed) {
                  if (parsed.delta) {
                    controller.enqueue(encoder.encode(JSON.stringify({
                      event: "delta",
                      requestId,
                      text: parsed.delta,
                    } as AiStreamEvent) + "\n"));
                  }
                  if (parsed.usage) {
                    parsedUsage = parsed.usage;
                  }
                }
              }
            } else if (provider === "openai") {
              buffer += text;
              let lineEndIndex;
              while ((lineEndIndex = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, lineEndIndex);
                buffer = buffer.slice(lineEndIndex + 1);
                const cleanLine = line.endsWith("\r") ? line.slice(0, -1) : line;

                const parsed = parseOpenAiLine(cleanLine);
                if (parsed) {
                  if (parsed.delta) {
                    controller.enqueue(encoder.encode(JSON.stringify({
                      event: "delta",
                      requestId,
                      text: parsed.delta,
                    } as AiStreamEvent) + "\n"));
                  }
                  if (parsed.usage) {
                    parsedUsage = parsed.usage;
                  }
                }
              }
            } else if (provider === "anthropic") {
              buffer += text;
              let lineEndIndex;
              while ((lineEndIndex = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, lineEndIndex);
                buffer = buffer.slice(lineEndIndex + 1);
                const cleanLine = line.endsWith("\r") ? line.slice(0, -1) : line;

                const parsed = parseAnthropicLine(cleanLine);
                if (parsed) {
                  if (parsed.delta) {
                    controller.enqueue(encoder.encode(JSON.stringify({
                      event: "delta",
                      requestId,
                      text: parsed.delta,
                    } as AiStreamEvent) + "\n"));
                  }
                  if (parsed.inputTokens !== undefined) {
                    anthropicInputTokens = parsed.inputTokens;
                  }
                  if (parsed.outputTokens !== undefined) {
                    anthropicOutputTokens = parsed.outputTokens;
                  }
                }
              }
            }
          }

          if (provider === "anthropic" && (anthropicInputTokens !== undefined || anthropicOutputTokens !== undefined)) {
            parsedUsage = {
              inputTokens: anthropicInputTokens,
              outputTokens: anthropicOutputTokens,
              estimated: false,
            };
          }

          const doneEvent: AiStreamEvent = {
            event: "done",
            requestId,
            usage: parsedUsage,
          };
          controller.enqueue(encoder.encode(JSON.stringify(doneEvent) + "\n"));
          controller.close();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : GENERIC_PROVIDER_ERROR;
          const errorEvent: AiStreamEvent = {
            event: "error",
            requestId,
            message: errorMsg,
          };
          controller.enqueue(encoder.encode(JSON.stringify(errorEvent) + "\n"));
          controller.close();
        } finally {
          reader.releaseLock();
          clearTimeout(timeoutId);
        }
      },
      cancel() {
        providerController.abort();
        clearTimeout(timeoutId);
      }
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
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
