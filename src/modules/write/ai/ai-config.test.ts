// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAiConfig,
  saveAiConfig,
  isAiReady,
  isAiUnconfigured,
  isAiDisabled,
  DEFAULT_AI_CONFIG,
} from "./ai-config";
import type { AiConfig } from "@/types";

describe("ai-config unit tests", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("should have enabled=false in DEFAULT_AI_CONFIG", () => {
    expect(DEFAULT_AI_CONFIG.enabled).toBe(false);
    expect(DEFAULT_AI_CONFIG.provider).toBeUndefined();
  });

  it("should load DEFAULT_AI_CONFIG when localStorage is empty", () => {
    const config = loadAiConfig();
    expect(config).toEqual(DEFAULT_AI_CONFIG);
  });

  it("should persist and load valid AI configuration", () => {
    const validConfig: AiConfig = {
      enabled: true,
      provider: "openai",
    };

    saveAiConfig(validConfig);
    const loaded = loadAiConfig();

    expect(loaded).toEqual(validConfig);
  });

  it("should load DEFAULT_AI_CONFIG when localStorage has malformed config JSON", () => {
    window.localStorage.setItem("rs:ai-config", "{invalid-json}");
    const config = loadAiConfig();
    expect(config).toEqual(DEFAULT_AI_CONFIG);
  });

  it("should load DEFAULT_AI_CONFIG when localStorage config schema is invalid", () => {
    // missing enabled boolean, or wrong types
    window.localStorage.setItem("rs:ai-config", JSON.stringify({ enabled: "yes", provider: 123 }));
    const config = loadAiConfig();
    expect(config).toEqual(DEFAULT_AI_CONFIG);
  });

  it("should identify isAiReady correctly", () => {
    expect(isAiReady({ enabled: false })).toBe(false);
    expect(isAiReady({ enabled: true })).toBe(false); // missing provider
    expect(isAiReady({ enabled: true, provider: "" })).toBe(false); // empty provider
    expect(isAiReady({ enabled: true, provider: "gemini" })).toBe(true);
  });

  it("should identify isAiUnconfigured correctly", () => {
    expect(isAiUnconfigured({ enabled: false })).toBe(false);
    expect(isAiUnconfigured({ enabled: true })).toBe(true); // missing provider
    expect(isAiUnconfigured({ enabled: true, provider: "" })).toBe(true); // empty provider
    expect(isAiUnconfigured({ enabled: true, provider: "gemini" })).toBe(false); // ready, not unconfigured
  });

  it("should identify isAiDisabled correctly", () => {
    expect(isAiDisabled({ enabled: false })).toBe(true);
    expect(isAiDisabled({ enabled: true })).toBe(false);
    expect(isAiDisabled({ enabled: true, provider: "openai" })).toBe(false);
  });
});
