import { describe, expect, it, vi, beforeEach } from "vitest";
import { httpAdapter } from "./http-adapter";
import { loadAiConfig } from "../ai-config";

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

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestion: "improved text" }),
    } as Response);

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

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Failed to connect to OpenAI" }),
    } as Response);

    await expect(httpAdapter.request("rewrite", "input text")).rejects.toThrow("Failed to connect to OpenAI");
  });
});
