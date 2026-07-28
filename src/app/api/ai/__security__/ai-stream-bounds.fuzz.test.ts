import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { extractJsonObjects, parseGeminiChunk } from "../providers/gemini";
import { parseOpenAiLine } from "../providers/openai";
import { parseAnthropicLine } from "../providers/anthropic";

function aiRequest(body: unknown, apiKey = "test-client-key", extraHeaders?: Record<string, string>): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    ...extraHeaders,
  });

  return new Request("http://localhost/api/ai", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("AI Stream Resource Bounds & Parser Fuzzing (W25-D)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
  });

  describe("Correlation ID & Request ID Bounding", () => {
    it("always mints its own server-side UUID and never echoes a client-supplied requestId", async () => {
      const clientRequestId = "attacker-chosen-id-not-a-uuid";
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"choices": [{"delta": {"content": "hi"}}]}\n\n'));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "Content-Type": "text/event-stream" }),
        body: mockStream,
      } as Response));

      const response = await POST(aiRequest({
        action: "rewrite",
        input: "Hello",
        provider: "openai",
        requestId: clientRequestId,
      }));

      expect(response.status).toBe(200);
      const text = await response.text();
      const lines = text.trim().split("\n");
      const meta = JSON.parse(lines[0]);
      const delta = JSON.parse(lines[1]);

      expect(meta.event).toBe("meta");
      expect(meta.requestId).not.toBe(clientRequestId);
      expect(meta.requestId).toMatch(/^[0-9a-f-]{36}$/u);
      // delta events carry no requestId at all (only meta/terminal do).
      expect(delta).toEqual({ event: "delta", text: "hi" });
    });
  });

  describe("Pull-aware backpressure & greedy-read regression guard", () => {
    it("reads upstream incrementally (one chunk per outer read), not the whole stream up front", async () => {
      const encoder = new TextEncoder();
      let upstreamReadCalls = 0;
      const chunks = [
        'data: {"choices": [{"delta": {"content": "a"}}]}\n\n',
        'data: {"choices": [{"delta": {"content": "b"}}]}\n\n',
        'data: {"choices": [{"delta": {"content": "c"}}]}\n\n',
      ];
      let i = 0;
      const fakeReader = {
        read: async () => {
          upstreamReadCalls += 1;
          if (i >= chunks.length) return { done: true, value: undefined };
          return { done: false, value: encoder.encode(chunks[i++]) };
        },
        cancel: async () => undefined,
      };
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "Content-Type": "text/event-stream" }),
        body: { getReader: () => fakeReader },
      } as unknown as Response));

      const response = await POST(aiRequest({ action: "rewrite", input: "Hello", provider: "openai" }));
      expect(response.status).toBe(200);

      const reader = response.body!.getReader();
      // Read only the meta event, then check upstream hasn't been drained yet.
      await reader.read();
      // must not have drained the whole upstream just to emit the first (meta) chunk
      expect(upstreamReadCalls).toBeLessThan(chunks.length);

      // Drain the rest.
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
      expect(upstreamReadCalls).toBe(chunks.length + 1); // + the final `done` read
    });
  });

  describe("Provider Incremental Parser Bounds", () => {
    it("Gemini extractJsonObjects throws when buffer exceeds 128 KiB", () => {
      const hugeBuffer = "{" + "a".repeat(130 * 1024) + "}";
      expect(() => extractJsonObjects(hugeBuffer)).toThrow("Gemini stream buffer limit exceeded");
    });

    it("Gemini extractJsonObjects throws when nesting depth exceeds 32", () => {
      const nestedBuffer = "{".repeat(35) + "}".repeat(35);
      expect(() => extractJsonObjects(nestedBuffer)).toThrow("Gemini stream nesting depth exceeded");
    });

    it("Gemini parseGeminiChunk returns an explicit limit error for oversized JSON", () => {
      const hugeChunk = JSON.stringify({ candidates: [{ content: { parts: [{ text: "x".repeat(130 * 1024) }] } }] });
      expect(parseGeminiChunk(hugeChunk)).toEqual({ limitExceeded: true });
    });

    it("OpenAI parseOpenAiLine returns an explicit limit error for a line exceeding 64 KiB", () => {
      const hugeLine = "data: " + "x".repeat(70 * 1024);
      expect(parseOpenAiLine(hugeLine)).toEqual({ limitExceeded: true });
    });

    it("Anthropic parseAnthropicLine returns an explicit limit error for a line exceeding 64 KiB", () => {
      const hugeLine = "data: " + "x".repeat(70 * 1024);
      expect(parseAnthropicLine(hugeLine)).toEqual({ limitExceeded: true });
    });
  });

  describe("Malformed/incomplete frame handling (no silent drop)", () => {
    async function collectEvents(response: Response): Promise<Array<Record<string, unknown>>> {
      const text = await response.text();
      return text
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    }

    it("emits a typed AI_PROTOCOL_ERROR terminal event for a malformed data: frame instead of silently dropping it", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"choices": [{"delta": {"content": "ok"}}]}\n\n'));
          controller.enqueue(encoder.encode("data: {not valid json\n\n"));
          controller.close();
        },
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "Content-Type": "text/event-stream" }),
        body: mockStream,
      } as Response));

      const response = await POST(aiRequest({ action: "rewrite", input: "Hello", provider: "openai" }));
      const events = await collectEvents(response);
      const terminal = events[events.length - 1];

      expect(terminal.event).toBe("error");
      expect(terminal.code).toBe("AI_PROTOCOL_ERROR");
      // exactly one terminal event
      expect(events.filter((e) => e.event === "done" || e.event === "error")).toHaveLength(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[AI Stream Error]",
        expect.objectContaining({ code: "AI_PROTOCOL_ERROR" }),
      );
    });

    it("salvages a trailing data: line with no final newline instead of dropping it", async () => {
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          // No trailing \n on the last chunk.
          controller.enqueue(encoder.encode('data: {"choices": [{"delta": {"content": "tail"}}]}'));
          controller.close();
        },
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "Content-Type": "text/event-stream" }),
        body: mockStream,
      } as Response));

      const response = await POST(aiRequest({ action: "rewrite", input: "Hello", provider: "openai" }));
      const events = await collectEvents(response);
      const deltas = events.filter((e) => e.event === "delta");

      expect(deltas.map((e) => e.text)).toEqual(["tail"]);
      expect(events[events.length - 1].event).toBe("done");
    });

    it("aborts with AI_STREAM_EXCEEDED (not truncate-and-continue) when a single delta exceeds the per-event cap", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const encoder = new TextEncoder();
      const hugeDelta = "x".repeat(20_000); // > MAX_SINGLE_DELTA_CHARS (16,000)
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: {"choices": [{"delta": {"content": "${hugeDelta}"}}]}\n\n`));
          controller.close();
        },
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "Content-Type": "text/event-stream" }),
        body: mockStream,
      } as Response));

      const response = await POST(aiRequest({ action: "rewrite", input: "Hello", provider: "openai" }));
      const events = await collectEvents(response);

      // Must NOT contain a truncated 16,000-char delta emitted as a normal event.
      expect(events.some((e) => e.event === "delta")).toBe(false);
      const terminal = events[events.length - 1];
      expect(terminal.event).toBe("error");
      expect(terminal.code).toBe("AI_STREAM_EXCEEDED");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[AI Stream Error]",
        expect.objectContaining({ code: "AI_STREAM_EXCEEDED" }),
      );
    });
  });

  describe("Stream Budgets & Error Redaction", () => {
    it("redacts raw provider error messages and secret strings from public error event", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("SECRET_KEY_12345 leaked internal database connection failed")));

      const response = await POST(aiRequest({
        action: "rewrite",
        input: "Hello",
        provider: "openai",
      }));

      expect(response.status).toBe(502);
      const data = await response.json();
      expect(data.error).toBe("AI provider request failed. Please check your API key, quota, model, or provider status.");
      expect(JSON.stringify(data)).not.toContain("SECRET_KEY_12345");
      expect(JSON.stringify(data)).not.toContain("database connection failed");
    });
  });
});
