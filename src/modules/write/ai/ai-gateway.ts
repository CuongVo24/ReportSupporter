/**
 * AI gateway — W11 Group A.
 *
 * Provider-agnostic interface. No SDK is imported here; when a real
 * provider adapter is approved it will be registered via `registerAdapter`.
 *
 * Behaviour table (Locked #2 / #3):
 *   - Flag OFF    → GatewayState "disabled"; returns immediately, no fetch.
 *   - No adapter  → GatewayState "unconfigured"; returns immediately, no fetch.
 *   - Adapter set → GatewayState "ready"; delegates to adapter.
 *
 * Constraints:
 *   - No hard-coded key/secret.
 *   - No fetch / network call when disabled or unconfigured.
 *   - Adapter injection replaces direct SDK usage (approve before cài SDK).
 */

import type { AiAction, AiRequestOptions, AiSuggestion, GatewayState } from "@/types/ai";
import { loadAiConfig, isAiReady } from "./ai-config";

// ---------------------------------------------------------------------------
// Adapter interface (provider-agnostic contract)
// ---------------------------------------------------------------------------

/**
 * Minimal contract every provider adapter must satisfy.
 * Approved adapters are registered via `registerAdapter`.
 */
export interface AiAdapter {
  /**
   * Send a request to the underlying provider and return a suggestion.
   * The adapter owns network/SDK details; the gateway only orchestrates.
   */
  request(action: AiAction, input: string, options?: AiRequestOptions): Promise<string | {
    suggestion: string;
    usage?: AiSuggestion["usage"];
  }>;
}

// ---------------------------------------------------------------------------
// Internal adapter registry (singleton)
// ---------------------------------------------------------------------------

let _adapter: AiAdapter | null = null;

/**
 * Register a provider adapter.
 * Only call this after user approval + install of the provider SDK.
 * Calling with `null` removes the current adapter (resets to unconfigured).
 */
export function registerAdapter(adapter: AiAdapter | null): void {
  _adapter = adapter;
}

// ---------------------------------------------------------------------------
// Gateway state query
// ---------------------------------------------------------------------------

/**
 * Returns the current operational state of the gateway without making
 * any network call. Useful for UI to show correct state label.
 */
export function getGatewayState(): GatewayState {
  const config = loadAiConfig();
  if (!config.enabled) return "disabled";
  if (isAiReady(config) && _adapter !== null) return "ready";
  return "unconfigured";
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Request an AI suggestion.
 *
 * - Disabled or unconfigured → returns immediately with a no-op suggestion
 *   (no fetch, no throw). Callers can inspect `accepted` state but should
 *   check `getGatewayState()` to decide whether to show result in UI.
 * - Ready → delegates to the registered adapter.
 */
export async function requestSuggestion(
  action: AiAction,
  input: string,
  options?: AiRequestOptions,
): Promise<AiSuggestion> {
  const requestOptions = options ?? {};
  const config = loadAiConfig();

  // Guard: not ready (disabled, no provider, or no adapter) — no network
  if (!isAiReady(config) || _adapter === null) {
    return buildNoopSuggestion(action, input, requestOptions);
  }

  // Ready path — delegate to adapter
  const response = options
    ? await _adapter.request(action, input, options)
    : await _adapter.request(action, input);
  const suggestion = typeof response === "string" ? response : response.suggestion;
  const usage = typeof response === "string" ? undefined : response.usage;
  return {
    id: requestOptions.requestId ?? crypto.randomUUID(),
    action,
    original: input,
    suggestion,
    requestId: requestOptions.requestId,
    projectId: requestOptions.context?.projectId,
    sectionId: requestOptions.context?.sectionId,
    baseRevision: requestOptions.context?.revision,
    baseHash: requestOptions.context?.contentHash,
    createdAt: new Date().toISOString(),
    usage,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function buildNoopSuggestion(
  action: AiAction,
  original: string,
  options: AiRequestOptions = {},
): AiSuggestion {
  return {
    id: options.requestId ?? crypto.randomUUID(),
    action,
    original,
    // Empty suggestion signals no-op; UI should guard on GatewayState instead.
    suggestion: "",
    requestId: options.requestId,
    projectId: options.context?.projectId,
    sectionId: options.context?.sectionId,
    baseRevision: options.context?.revision,
    baseHash: options.context?.contentHash,
    createdAt: new Date().toISOString(),
  };
}
