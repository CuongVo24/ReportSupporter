// W25-K (S4): adversarial NDJSON framing for HttpAiAdapter. The line buffer
// is bounded by line, total response, event count and total suggestion size.
// These tests ensure adversarial framing cannot turn back into an unbounded
// client-side allocation.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { httpAdapter } from "../http-adapter";
import { loadAiConfig } from "../../ai-config";
import { mulberry32, pickInt } from "@/test/fuzz-utils";
import type { AiStreamEvent } from "@/types/ai";

vi.mock("../../ai-config", () => ({
  loadAiConfig: vi.fn(),
}));

function ndjsonResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return {
    ok: true,
    headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? "application/x-ndjson" : null) },
    body: stream,
  } as unknown as Response;
}

describe("HttpAiAdapter — adversarial NDJSON framing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(loadAiConfig).mockReturnValue({ enabled: true, provider: "openai", apiKey: "k" });
  });

  it("parses a line split into many tiny chunks with no newline until the very end (bounded, ~2000 fragments)", async () => {
    const payload = [
      JSON.stringify({ event: "meta", requestId: "r1", provider: "openai", model: "gpt-4" }),
      JSON.stringify({ event: "delta", text: "x".repeat(2000) }),
      JSON.stringify({ event: "done", requestId: "r1" }),
    ].join("\n");
    const chunks = payload.split(""); // one char per chunk — worst case for the buffer loop
    chunks.push("\n");
    vi.mocked(fetch).mockResolvedValue(ndjsonResponse(chunks));

    const events: AiStreamEvent[] = [];
    const result = await httpAdapter.request("rewrite", "in", { requestId: "r1", onEvent: (e) => events.push(e) });

    expect(result.suggestion).toHaveLength(2000);
    expect(events).toHaveLength(3);
  });

  it("rejects an oversized single line instead of buffering it as a successful suggestion", async () => {
    const bigText = "y".repeat(200_000);
    const payload = JSON.stringify({ event: "delta", requestId: "r2", text: bigText }) + "\n";
    vi.mocked(fetch).mockResolvedValue(ndjsonResponse([payload]));

    await expect(httpAdapter.request("rewrite", "in", { requestId: "r2" }))
      .rejects.toThrow(/maximum size/u);
  });

  it("rejects (does not hang) on a malformed JSON line", async () => {
    vi.mocked(fetch).mockResolvedValue(ndjsonResponse(["not json at all\n"]));
    await expect(httpAdapter.request("rewrite", "in", { requestId: "r3" }))
      .rejects.toThrow(/invalid JSON/u);
  });

  it("bounded fuzz: seeded random chunk-splitting of a valid multi-event stream always reassembles identically", async () => {
    const rand = mulberry32(20260724);
    const events = [
      { event: "meta", requestId: "r4", provider: "openai", model: "gpt-4" },
      { event: "delta", requestId: "r4", text: "Hello " },
      { event: "delta", requestId: "r4", text: "world" },
      { event: "done", requestId: "r4" },
    ];
    const full = events.map((e) => JSON.stringify(e)).join("\n") + "\n";

    for (let trial = 0; trial < 10; trial++) {
      const chunks: string[] = [];
      let rest = full;
      while (rest.length > 0) {
        const cut = pickInt(rand, 1, Math.min(15, rest.length));
        chunks.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      vi.mocked(fetch).mockResolvedValue(ndjsonResponse(chunks));
      const received: AiStreamEvent[] = [];
      const result = await httpAdapter.request("rewrite", "in", { requestId: "r4", onEvent: (e) => received.push(e) });
      expect(result.suggestion).toBe("Hello world");
      expect(received).toHaveLength(4);
    }
  });
});
