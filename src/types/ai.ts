/**
 * AI canonical types — W11 Group A.
 * Single Source of Truth: Design/Modules/Other/CanonicalTypes.md §10.
 *
 * Design constraints (VibeCode §4 / W11 Locked):
 *   - Flag default OFF → no fetch when disabled.
 *   - Provider-agnostic: no SDK import here; gateway is an interface.
 *   - No secret/key in code.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitive unions
// ---------------------------------------------------------------------------

export type AiAction = "outline" | "rewrite" | "tone";

export const aiActionSchema = z.enum(["outline", "rewrite", "tone"]);

// ---------------------------------------------------------------------------
// AiSuggestion
// ---------------------------------------------------------------------------

export type AiSuggestion = {
  id: string;
  action: AiAction;
  /** The original text that was sent for improvement. */
  original: string;
  /** The AI-generated suggestion text. */
  suggestion: string;
  /** Undefined until the user explicitly accepts or rejects. */
  accepted?: boolean;
};

export const aiSuggestionSchema = z.object({
  id: z.string(),
  action: aiActionSchema,
  original: z.string(),
  suggestion: z.string(),
  accepted: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// AiConfig — feature flag (default OFF)
// ---------------------------------------------------------------------------

export type AiConfig = {
  /** Master switch. Default: false. When false, no gateway call is made. */
  enabled: boolean;
  /**
   * Optional provider identifier chosen by the user (e.g. "openai", "gemini").
   * Only meaningful when enabled === true.
   * No SDK is bundled; the provider adapter is loaded separately after approval.
   */
  provider?: string;
  /** API Key for the chosen provider (optional) */
  apiKey?: string;
  /** Custom model identifier chosen by the user (optional) */
  model?: string;
};

export const aiConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.string().optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

// ---------------------------------------------------------------------------
// GatewayState
// ---------------------------------------------------------------------------

/**
 * Describes the operational state of the AI gateway at call time.
 *
 * - "ready"        → configured and enabled, ready to send.
 * - "unconfigured" → enabled flag is true but no provider/adapter present.
 * - "disabled"     → flag is OFF; no network call is made.
 */
export type GatewayState = "ready" | "unconfigured" | "disabled";

export interface AiActionGateway {
  requestSuggestion: (action: AiAction, input: string) => Promise<AiSuggestion>;
  getGatewayState: () => GatewayState;
}
