import { NextResponse } from "next/server";
import { aiActionSchema } from "@/types/ai";
import type { AiAction } from "@/types/ai";

type AiProvider = "gemini" | "openai" | "anthropic";

type AiProxyRequest = {
  action: AiAction;
  input: string;
  provider: AiProvider;
  model?: string;
};

const GENERIC_PROVIDER_ERROR =
  "AI provider request failed. Please check your API key, quota, model, or provider status.";
const MAX_BODY_BYTES = 512 * 1024;
const MAX_INPUT_CHARS = 100_000;
const MAX_MODEL_CHARS = 128;
const MAX_OUTPUT_TOKENS = 4_000;
const AI_TIMEOUT_MS = 60_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 20;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

class ProviderRequestError extends Error {}

function clientAddress(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")?.trim()
    || "unknown";
}

function consumeRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;

  // Keep the best-effort in-memory limiter bounded on long-lived instances.
  if (rateLimitBuckets.size > 10_000) {
    for (const [bucketKey, bucket] of rateLimitBuckets) {
      if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

function validModel(model: string | undefined): boolean {
  return model === undefined || (
    model.length <= MAX_MODEL_CHARS &&
    /^[a-zA-Z0-9._:/-]+$/.test(model)
  );
}

async function requestProvider(url: string, init: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(AI_TIMEOUT_MS) });
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

function readGeminiSuggestion(data: unknown): string {
  const record = asRecord(data);
  const candidates = Array.isArray(record.candidates) ? record.candidates : [];
  const firstCandidate = asRecord(candidates[0]);
  const content = asRecord(firstCandidate.content);
  const parts = Array.isArray(content.parts) ? content.parts : [];
  const firstPart = asRecord(parts[0]);
  return stringValue(firstPart.text) ?? "";
}

function readOpenAiSuggestion(data: unknown): string {
  const record = asRecord(data);
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice.message);
  return stringValue(message.content) ?? "";
}

function readAnthropicSuggestion(data: unknown): string {
  const record = asRecord(data);
  const content = Array.isArray(record.content) ? record.content : [];
  const firstContent = asRecord(content[0]);
  return stringValue(firstContent.text) ?? "";
}

export async function POST(req: Request) {
  try {
    const declaredLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }

    const rateLimit = consumeRateLimit(clientAddress(req));
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many AI requests. Please retry shortly." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
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

    const { action, input, provider, model } = parsed;

    const apiKey = req.headers.get("x-api-key")?.trim() ?? "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key. Configure a local client API key in AI Settings." },
        { status: 401 },
      );
    }

    const prompt = buildPrompt(action, input);
    let suggestion = "";

    if (provider === "gemini") {
      const selectedModel = model || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent`;

      const response = await requestProvider(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
        }),
      });

      const data: unknown = await response.json();
      suggestion = readGeminiSuggestion(data);
    } else if (provider === "openai") {
      const selectedModel = model || "gpt-4o";
      const url = "https://api.openai.com/v1/chat/completions";

      const response = await requestProvider(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: MAX_OUTPUT_TOKENS,
        }),
      });

      const data: unknown = await response.json();
      suggestion = readOpenAiSuggestion(data);
    } else {
      const selectedModel = model || "claude-3-5-sonnet-20241022";
      const url = "https://api.anthropic.com/v1/messages";

      const response = await requestProvider(url, {
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
        }),
      });

      const data: unknown = await response.json();
      suggestion = readAnthropicSuggestion(data);
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("AI Proxy error:", error);
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
