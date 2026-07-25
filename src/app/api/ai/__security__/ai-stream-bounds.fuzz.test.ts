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
    it("fallbacks to canonical UUID when client sends an oversized requestId (>64 chars)", async () => {
      const hugeRequestId = "a".repeat(10_000);
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
        body: mockStream,
      } as Response));

      const response = await POST(aiRequest({
        action: "rewrite",
        input: "Hello",
        provider: "openai",
        requestId: hugeRequestId,
      }));

      expect(response.status).toBe(200);
      const text = await response.text();
      const firstLine = text.split("\n")[0];
      const meta = JSON.parse(firstLine);

      expect(meta.event).toBe("meta");
      expect(meta.requestId).not.toBe(hugeRequestId);
      expect(meta.requestId.length).toBeLessThanOrEqual(64);
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

    it("Gemini parseGeminiChunk returns null for oversized JSON string", () => {
      const hugeChunk = JSON.stringify({ candidates: [{ content: { parts: [{ text: "x".repeat(130 * 1024) }] } }] });
      expect(parseGeminiChunk(hugeChunk)).toBeNull();
    });

    it("OpenAI parseOpenAiLine returns null for line exceeding 64 KiB", () => {
      const hugeLine = "data: " + "x".repeat(70 * 1024);
      expect(parseOpenAiLine(hugeLine)).toBeNull();
    });

    it("Anthropic parseAnthropicLine returns null for line exceeding 64 KiB", () => {
      const hugeLine = "data: " + "x".repeat(70 * 1024);
      expect(parseAnthropicLine(hugeLine)).toBeNull();
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
