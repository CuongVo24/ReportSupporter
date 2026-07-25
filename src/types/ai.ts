/**
 * AI canonical types — W11 Group A.
 * Single Source of Truth: Design/Modules/Other/CanonicalTypes.md §10.
 *
 * Design constraints (VibeCode §4 / W11 Locked):
 *   - Flag default OFF → no fetch when disabled.
 *   - Provider-agnostic: no SDK import here; gateway is an interface.
 *   - Client-key strategy: user key lives only in an in-memory tab variable
 *     (never written to localStorage/sessionStorage) and is sent to the
 *     first-party proxy via `x-api-key`; lost on reload by design. Any
 *     legacy persisted key is scrubbed on load. Same-origin XSS can still
 *     read the key while the tab is open — see Design/Security/ThreatModel.md.
 *   - No server-env fallback in `/api/ai`.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitive unions
// ---------------------------------------------------------------------------

export type AiAction = "outline" | "rewrite" | "tone" | "translate" | "terminology";
export type AiTaskStatus = "pending" | "running" | "done" | "failed" | "cancelled" | "stale";

export const aiActionSchema = z.enum(["outline", "rewrite", "tone", "translate", "terminology"]);

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
  requestId?: string;
  projectId?: string;
  sectionId?: string;
  baseRevision?: number;
  baseHash?: string;
  createdAt?: string;
  usage?: AiUsage;
  /** Undefined until the user explicitly accepts or rejects. */
  accepted?: boolean;
};

export type AiUsage = {
  inputTokens?: number;
  outputTokens?: number;
  estimated: boolean;
  estimatedCostUsd?: number;
  catalogUpdatedAt?: string;
};

// Correlation ID is only carried on the meta (first) and terminal
// (done/error, exactly one) events — not repeated on every delta, where it
// would be pure overhead with no consumer (see w25_fix-all-bugs.md §D).
export type AiStreamEvent =
  | { event: "meta"; requestId: string; provider: string; model: string }
  | { event: "delta"; text: string }
  | { event: "done"; requestId: string; usage?: AiUsage }
  | { event: "error"; requestId: string; code?: string; message: string };

export type AiRequestContext = {
  projectId?: string;
  sectionId?: string;
  revision?: number;
  contentHash?: string;
};

export type AiRequestOptions = {
  signal?: AbortSignal;
  requestId?: string;
  context?: AiRequestContext;
  onEvent?: (event: AiStreamEvent) => void;
};

export const aiSuggestionSchema = z.object({
  id: z.string(),
  action: aiActionSchema,
  original: z.string(),
  suggestion: z.string(),
  requestId: z.string().optional(),
  projectId: z.string().optional(),
  sectionId: z.string().optional(),
  baseRevision: z.number().int().nonnegative().optional(),
  baseHash: z.string().optional(),
  createdAt: z.string().optional(),
  usage: z.object({
    inputTokens: z.number().int().nonnegative().optional(),
    outputTokens: z.number().int().nonnegative().optional(),
    estimated: z.boolean(),
    estimatedCostUsd: z.number().nonnegative().optional(),
    catalogUpdatedAt: z.string().optional(),
  }).optional(),
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
  /** API key held only in memory for the current tab; required when enabled. Never persisted. */
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
  requestSuggestion: (action: AiAction, input: string, options?: AiRequestOptions) => Promise<AiSuggestion>;
  getGatewayState: () => GatewayState;
}
