import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function aiRequest(body: unknown, apiKey?: string): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (apiKey) headers.set("x-api-key", apiKey);

  return new Request("http://localhost/api/ai", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("/api/ai route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects requests without a client API key and does not call provider fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "Draft text",
      provider: "openai",
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: "Missing API key. Configure a local client API key in AI Settings.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a generic provider error without leaking upstream details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Payment Required",
      text: async () => "quota exhausted for account billing@example.com",
    } as Response));

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "Draft text",
      provider: "openai",
    }, "client-key"));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe(
      "AI provider request failed. Please check your API key, quota, model, or provider status.",
    );
    expect(JSON.stringify(data)).not.toContain("billing@example.com");
    expect(JSON.stringify(data)).not.toContain("quota exhausted");
  });

  it("rejects oversized request bodies before calling a provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "x".repeat(513 * 1024),
      provider: "openai",
    }, "client-key"));

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized streamed body enforced by actual bytes, not a trusted/missing Content-Length header", async () => {
    // No content-length is set (streamed body), so the early declared-length
    // check can't catch this — the bounded reader must enforce the cap
    // while reading, not after fully materializing the body into memory.
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const encoder = new TextEncoder();
    const chunk = encoder.encode("x".repeat(100 * 1024)); // 100 KiB per chunk
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < 6; i++) controller.enqueue(chunk); // 600 KiB > 512 KiB cap
        controller.close();
      },
    });

    const req = new Request("http://localhost/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "client-key" },
      body,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect(req.headers.get("content-length")).toBeNull();

    const response = await POST(req);

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a Gemini key in a header instead of the URL and caps output", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "Content-Type": "application/json" }),
      body: new Response("[]").body,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "Suggestion" }] } }] }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "Draft text",
      provider: "gemini",
      model: "gemini-2.0-flash",
    }, "secret-client-key"));

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain("secret-client-key");
    expect(url).not.toContain("?key=");
    expect(init.headers).toMatchObject({ "x-goog-api-key": "secret-client-key" });
    expect(JSON.parse(String(init.body)).generationConfig.maxOutputTokens).toBe(4000);
  });

  async function readResponseStream(response: Response): Promise<string[]> {
    const reader = response.body?.getReader();
    if (!reader) return [];
    const decoder = new TextDecoder();
    let buffer = "";
    const lines: string[] = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lineEndIndex;
        while ((lineEndIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, lineEndIndex);
          buffer = buffer.slice(lineEndIndex + 1);
          if (line.trim()) lines.push(line);
        }
      }
      if (buffer.trim()) lines.push(buffer);
    } finally {
      reader.releaseLock();
    }
    return lines;
  }

  it("handles OpenAI stream request and parses delta and usage", async () => {
    const encoder = new TextEncoder();
    const mockOpenAiStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices": [{"delta": {"content": "Hello"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: {"choices": [{"delta": {"content": " world"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: {"choices": [{}], "usage": {"prompt_tokens": 10, "completion_tokens": 5}}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "Content-Type": "text/event-stream" }),
      body: mockOpenAiStream,
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "Draft text",
      provider: "openai",
    }, "client-key"));

    expect(response.status).toBe(200);
    const lines = await readResponseStream(response);
    expect(lines).toHaveLength(4);
    expect(JSON.parse(lines[0])).toMatchObject({ event: "meta", provider: "openai" });
    expect(JSON.parse(lines[1])).toEqual({ event: "delta", text: "Hello" });
    expect(JSON.parse(lines[2])).toEqual({ event: "delta", text: " world" });
    expect(JSON.parse(lines[3])).toEqual({ event: "done", requestId: expect.any(String), usage: { inputTokens: 10, outputTokens: 5, estimated: false } });
  });

  it("handles Gemini stream request and parses delta and usage", async () => {
    const encoder = new TextEncoder();
    const mockGeminiStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('[\n'));
        controller.enqueue(encoder.encode('  {"candidates": [{"content": {"parts": [{"text": "Hello"}]}}]}\n'));
        controller.enqueue(encoder.encode('  ,\n  {"candidates": [{"content": {"parts": [{"text": " world"}]}}],\n'));
        controller.enqueue(encoder.encode('   "usageMetadata": {"promptTokenCount": 12, "candidatesTokenCount": 6}}\n'));
        controller.enqueue(encoder.encode(']\n'));
        controller.close();
      }
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "Content-Type": "application/json" }),
      body: mockGeminiStream,
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "Draft text",
      provider: "gemini",
    }, "client-key"));

    expect(response.status).toBe(200);
    const lines = await readResponseStream(response);
    expect(lines).toHaveLength(4);
    expect(JSON.parse(lines[0])).toMatchObject({ event: "meta", provider: "gemini" });
    expect(JSON.parse(lines[1])).toEqual({ event: "delta", text: "Hello" });
    expect(JSON.parse(lines[2])).toEqual({ event: "delta", text: " world" });
    expect(JSON.parse(lines[3])).toEqual({ event: "done", requestId: expect.any(String), usage: { inputTokens: 12, outputTokens: 6, estimated: false } });
  });

  it("handles Anthropic stream request and parses delta and usage", async () => {
    const encoder = new TextEncoder();
    const mockAnthropicStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: message_start\ndata: {"type": "message_start", "message": {"usage": {"input_tokens": 15}}}\n\n'));
        controller.enqueue(encoder.encode('event: content_block_delta\ndata: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}}\n\n'));
        controller.enqueue(encoder.encode('event: content_block_delta\ndata: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": " world"}}\n\n'));
        controller.enqueue(encoder.encode('event: message_delta\ndata: {"type": "message_delta", "usage": {"output_tokens": 7}}\n\n'));
        controller.close();
      }
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "Content-Type": "text/event-stream" }),
      body: mockAnthropicStream,
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(aiRequest({
      action: "rewrite",
      input: "Draft text",
      provider: "anthropic",
    }, "client-key"));

    expect(response.status).toBe(200);
    const lines = await readResponseStream(response);
    expect(lines).toHaveLength(4);
    expect(JSON.parse(lines[0])).toMatchObject({ event: "meta", provider: "anthropic" });
    expect(JSON.parse(lines[1])).toEqual({ event: "delta", text: "Hello" });
    expect(JSON.parse(lines[2])).toEqual({ event: "delta", text: " world" });
    expect(JSON.parse(lines[3])).toEqual({ event: "done", requestId: expect.any(String), usage: { inputTokens: 15, outputTokens: 7, estimated: false } });
  });

  it("propagates client abort to upstream provider request", async () => {
    const encoder = new TextEncoder();
    let fetchSignal: AbortSignal | undefined;

    vi.stubGlobal("fetch", vi.fn().mockImplementation((url, init) => {
      fetchSignal = init.signal;
      return Promise.resolve({
        ok: true,
        headers: new Headers({ "Content-Type": "text/event-stream" }),
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('data: {"choices": [{"delta": {"content": "Hello"}}]}\n\n'));
          }
        })
      });
    }));

    const controller = new AbortController();
    const req = new Request("http://localhost/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "client-key" },
      body: JSON.stringify({
        action: "rewrite",
        input: "Draft text",
        provider: "openai",
      }),
      signal: controller.signal,
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    // Read the first chunk
    const { value } = await reader!.read();
    expect(value).toBeDefined();

    // Trigger abort on client signal
    controller.abort();

    // Also call reader.cancel() as Next.js does when connection closes
    await reader!.cancel();

    expect(fetchSignal?.aborted).toBe(true);
  });

  it("enforces dual rate limiting (per-address and per-key)", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve({
      ok: true,
      headers: new Headers({ "Content-Type": "application/json" }),
      body: new Response("[]").body,
    } as Response));
    vi.stubGlobal("fetch", fetchMock);

    // 1. Consume 20 requests with same IP but rotated API keys -> 21st must be blocked by address quota
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const addressHeaders = { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.99" };

    for (let i = 0; i < 20; i++) {
      const res = await POST(new Request("http://localhost/api/ai", {
        method: "POST",
        headers: { ...addressHeaders, "x-api-key": `key-addr-test-${i}` },
        body: JSON.stringify({ action: "rewrite", input: "Draft", provider: "gemini" }),
      }));
      expect(res.status).toBe(200);
    }

    const addrBlocked = await POST(new Request("http://localhost/api/ai", {
      method: "POST",
      headers: { ...addressHeaders, "x-api-key": "key-addr-test-new" },
      body: JSON.stringify({ action: "rewrite", input: "Draft", provider: "gemini" }),
    }));
    expect(addrBlocked.status).toBe(429);
    expect(addrBlocked.headers.get("retry-after")).toBeDefined();
  });
});
