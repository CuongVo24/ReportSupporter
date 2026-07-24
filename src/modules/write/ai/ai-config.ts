/**
 * AI feature flag — W11 Group A.
 *
 * Reads/writes the AiConfig flag from/to localStorage (browser-side only).
 * The API key itself is never persisted: it lives only in a module-scope
 * `volatileApiKey` variable for the lifetime of the tab. When flag is OFF
 * the gateway must NOT be called — this module provides the guard helpers
 * used by the gateway and any caller.
 *
 * Constraints:
 *   - Default: enabled=false (Locked #2).
 *   - Client-key strategy: provider key is held in memory only and sent
 *     only to the first-party `/api/ai` proxy through the `x-api-key`
 *     header; it is stripped before any write to localStorage and lost on
 *     reload by design.
 *   - Legacy scrub: a config previously persisted with an `apiKey` field is
 *     rescued into memory once, then rewritten without the key.
 *   - XSS risk is real: script execution in the origin can still read the
 *     in-memory key while the tab is open — see Design/Security/ThreatModel.md.
 *   - No network call here; purely config storage.
 *   - No AI SDK import.
 */

import { z } from "zod";
import type { AiConfig } from "@/types/ai";
import { aiConfigSchema } from "@/types/ai";

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = "rs:ai-config";
let volatileApiKey: string | undefined;

// ---------------------------------------------------------------------------
// Default — flag OFF
// ---------------------------------------------------------------------------

export const DEFAULT_AI_CONFIG: AiConfig = {
  enabled: false,
};

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Load AI config from localStorage (enabled/provider/model only) and merge
 * in the in-memory `apiKey`, if any. Falls back to DEFAULT_AI_CONFIG when
 * absent or malformed. Safe to call server-side (returns default when
 * `window` is unavailable).
 */
export function loadAiConfig(): AiConfig {
  if (typeof window === "undefined") return DEFAULT_AI_CONFIG;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_AI_CONFIG, apiKey: volatileApiKey };

  const parsed = z.string().safeParse(raw);
  if (!parsed.success) return DEFAULT_AI_CONFIG;

  let json: unknown;
  try {
    json = JSON.parse(parsed.data);
  } catch {
    return DEFAULT_AI_CONFIG;
  }

  const result = aiConfigSchema.safeParse(json);
  if (!result.success) return DEFAULT_AI_CONFIG;

  // One-time migration: rescue a legacy key into tab memory, then scrub it
  // from persistent storage immediately.
  if (!volatileApiKey && result.data.apiKey) {
    volatileApiKey = result.data.apiKey;
  }
  if (result.data.apiKey) {
    const { apiKey: _legacyKey, ...persistedConfig } = result.data;
    void _legacyKey;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedConfig));
  }
  return { ...result.data, apiKey: volatileApiKey };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Persist AI config to localStorage, excluding `apiKey` (kept in memory
 * only, see `volatileApiKey`). No-op when `window` is unavailable (SSR).
 */
export function saveAiConfig(config: AiConfig): void {
  if (typeof window === "undefined") return;
  volatileApiKey = config.apiKey?.trim() || undefined;
  const { apiKey: _apiKey, ...persistedConfig } = config;
  void _apiKey;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedConfig));
}

export function clearAiSessionApiKey(): void {
  volatileApiKey = undefined;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Returns true when AI features are enabled AND provider + local API key are set.
 * The gateway uses this to decide whether to proceed.
 */
export function isAiReady(config: AiConfig): boolean {
  return (
    config.enabled &&
    typeof config.provider === "string" &&
    config.provider.length > 0 &&
    typeof config.apiKey === "string" &&
    config.apiKey.length > 0
  );
}

/**
 * Returns true when the flag is enabled but no provider is configured.
 */
export function isAiUnconfigured(config: AiConfig): boolean {
  return config.enabled && !isAiReady(config);
}

/**
 * Returns true when AI is completely disabled (default state).
 */
export function isAiDisabled(config: AiConfig): boolean {
  return !config.enabled;
}
