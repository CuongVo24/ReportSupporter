import { describe, expect, it, vi, beforeEach } from "vitest";
import { httpAdapter } from "./http-adapter";
import { loadAiConfig } from "../ai-config";
import type { AiStreamEvent } from "@/types/ai";

vi.mock("../ai-config", () => ({
  loadAiConfig: vi.fn(),
}));

describe("HttpAiAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns empty suggestion immediately if AI is disabled", async () => {
    vi.mocked(loadAiConfig).mockReturnValue({ enabled: false });

    const suggestion = await httpAdapter.request("rewrite", "input text");
    expect(suggestion).toEqual({ suggestion: "" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns empty suggestion immediately if local client key is missing", async () => {
    vi.mocked(loadAiConfig).mockReturnValue({
      enabled: true,
      provider: "gemini",
    });

    const suggestion = await httpAdapter.request("rewrite", "input text");

    expect(suggestion).toEqual({ suggestion: "" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls fetch with correct payloads and headers", async () => {
    vi.mocked(loadAiConfig).mockReturnValue({
      enabled: true,
      provider: "gemini",
      apiKey: "my-client-key",
      model: "gemini-1.5-pro",
    });

    vi.mocked(fetch).mockResolvedValue(new Response(
      JSON.stringify({ suggestion: "improved text" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));

    const suggestion = await httpAdapter.request("rewrite", "input text");
    
    expect(suggestion).toEqual({
      suggestion: "improved text",
      usage: {
        inputTokens: 3,
        outputTokens: 4,
        estimated: true,
        catalogUpdatedAt: "2026-07-17",
      },
    });
    expect(fetch).toHaveBeenCalledWith("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "my-client-key",
      },
      body: JSON.stringify({
        action: "rewrite",
        input: "input text",
        provider: "gemini",
        model: "gemini-1.5-pro",
      }),
      signal: undefined,
    });
  });

  it("throws error when response is not ok", async () => {
    vi.mocked(loadAiConfig).mockReturnValue({
      enabled: true,
      provider: "openai",
      apiKey: "client-key",
    });

    vi.mocked(fetch).mockResolvedValue(new Response(
      JSON.stringify({ error: "Failed to connect to OpenAI" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    ));

    await expect(httpAdapter.request("rewrite", "input text")).rejects.toThrow("Failed to connect to OpenAI");
  });

  it("reads chunks incrementally and triggers onEvent immediately", async () => {
    vi.mocked(loadAiConfig).mockReturnValue({
      enabled: true,
      provider: "openai",
      apiKey: "client-key",
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ event: "meta", requestId: "123", provider: "openai", model: "gpt-4" }) + "\n"));
        controller.enqueue(encoder.encode(JSON.stringify({ event: "delta", requestId: "123", text: "Hello " }) + "\n"));
        controller.enqueue(encoder.encode(JSON.stringify({ event: "delta", requestId: "123", text: "world!" }) + "\n"));
        controller.enqueue(encoder.encode(JSON.stringify({ event: "done", requestId: "123" }) + "\n"));
        controller.close();
      }
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => name.toLowerCase() === "content-type" ? "application/x-ndjson" : null,
      },
      body: stream,
    } as unknown as Response);

    const events: AiStreamEvent[] = [];
    const result = await httpAdapter.request("rewrite", "input text", {
      requestId: "123",
      onEvent: (ev) => events.push(ev),
    });

    expect(result.suggestion).toBe("Hello world!");
    expect(events).toHaveLength(4);
    expect(events[0]).toEqual({ event: "meta", requestId: "123", provider: "openai", model: "gpt-4" });
    expect(events[1]).toEqual({ event: "delta", text: "Hello " });
    expect(events[2]).toEqual({ event: "delta", text: "world!" });
    expect(events[3]).toEqual({ event: "done", requestId: "123" });
  });

  it("correctly decodes fragmented JSON lines across chunk boundaries", async () => {
    vi.mocked(loadAiConfig).mockReturnValue({
      enabled: true,
      provider: "openai",
      apiKey: "client-key",
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Enqueue fragmented parts of a JSON line
        const part1 = '{"event":"meta","requestId":"123","provider":"openai","model":"gpt-4"}\n{"event":"del';
        const part2 = 'ta","requestId":"123","text":"Hello"}'; // missing newline at end initially
        const part3 = '\n{"event":"done","requestId":"123"}\n';

        controller.enqueue(encoder.encode(part1));
        controller.enqueue(encoder.encode(part2));
        controller.enqueue(encoder.encode(part3));
        controller.close();
      }
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => name.toLowerCase() === "content-type" ? "application/x-ndjson" : null,
      },
      body: stream,
    } as unknown as Response);

    const events: AiStreamEvent[] = [];
    const result = await httpAdapter.request("rewrite", "input text", {
      requestId: "123",
      onEvent: (ev) => events.push(ev),
    });

    expect(result.suggestion).toBe("Hello");
    expect(events).toHaveLength(3);
  });
});
