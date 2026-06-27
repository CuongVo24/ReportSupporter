// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerAdapter,
  getGatewayState,
  requestSuggestion,
  AiAdapter,
} from "./ai-gateway";
import { saveAiConfig } from "./ai-config";

describe("ai-gateway unit tests", () => {
  beforeEach(() => {
    window.localStorage.clear();
    registerAdapter(null); // Reset adapter
  });

  it("should return correct gateway states", () => {
    // 1. Default (disabled)
    expect(getGatewayState()).toBe("disabled");

    // 2. Enabled but incomplete local client-key config (unconfigured)
    saveAiConfig({ enabled: true, provider: "openai" });
    expect(getGatewayState()).toBe("unconfigured");

    // 3. Ready (enabled + provider + local API key + adapter registered)
    saveAiConfig({ enabled: true, provider: "openai", apiKey: "client-key" });
    const mockAdapter: AiAdapter = {
      request: vi.fn(),
    };
    registerAdapter(mockAdapter);
    expect(getGatewayState()).toBe("ready");
  });

  it("should return no-op suggestion and not delegate when AI is disabled", async () => {
    saveAiConfig({ enabled: false });
    const mockAdapter = {
      request: vi.fn(),
    };
    registerAdapter(mockAdapter);

    const result = await requestSuggestion("rewrite", "Original Input");

    expect(mockAdapter.request).not.toHaveBeenCalled();
    expect(result.suggestion).toBe("");
    expect(result.action).toBe("rewrite");
    expect(result.original).toBe("Original Input");
    expect(result.id).toBeDefined();
  });

  it("should return no-op suggestion and not delegate when AI is enabled but unconfigured (no adapter)", async () => {
    saveAiConfig({ enabled: true, provider: "openai", apiKey: "client-key" });
    // No registerAdapter called, so adapter is null

    const result = await requestSuggestion("rewrite", "Original Input");

    expect(result.suggestion).toBe("");
    expect(result.action).toBe("rewrite");
    expect(result.original).toBe("Original Input");
    expect(result.id).toBeDefined();
  });

  it("should delegate to adapter and return suggestion when ready", async () => {
    saveAiConfig({ enabled: true, provider: "openai", apiKey: "client-key" });
    
    const mockAdapter: AiAdapter = {
      request: vi.fn().mockResolvedValue("Rewritten AI suggestion"),
    };
    registerAdapter(mockAdapter);

    const result = await requestSuggestion("rewrite", "Original Input");

    expect(mockAdapter.request).toHaveBeenCalledWith("rewrite", "Original Input");
    expect(result.suggestion).toBe("Rewritten AI suggestion");
    expect(result.action).toBe("rewrite");
    expect(result.original).toBe("Original Input");
    expect(result.id).toBeDefined();
  });

  it("should return no-op when enabled without provider even if adapter is registered", async () => {
    saveAiConfig({ enabled: true }); // no provider field
    const mockAdapter: AiAdapter = {
      request: vi.fn().mockResolvedValue("Should not be called"),
    };
    registerAdapter(mockAdapter);

    const result = await requestSuggestion("rewrite", "Input text");

    expect(mockAdapter.request).not.toHaveBeenCalled();
    expect(result.suggestion).toBe("");
    expect(result.action).toBe("rewrite");
    expect(result.original).toBe("Input text");
  });

  it("should return no-op when enabled with provider but without local API key", async () => {
    saveAiConfig({ enabled: true, provider: "openai" });
    const mockAdapter: AiAdapter = {
      request: vi.fn().mockResolvedValue("Should not be called"),
    };
    registerAdapter(mockAdapter);

    const result = await requestSuggestion("rewrite", "Input text");

    expect(mockAdapter.request).not.toHaveBeenCalled();
    expect(result.suggestion).toBe("");
    expect(result.action).toBe("rewrite");
  });
});
