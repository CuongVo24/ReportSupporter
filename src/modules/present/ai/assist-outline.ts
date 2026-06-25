import type { SlideOutline, AiSuggestion, GatewayState, AiAction } from "@/types";

export interface OutlineGateway {
  requestSuggestion: (action: AiAction, input: string) => Promise<AiSuggestion>;
  getGatewayState: () => GatewayState;
}

/**
 * AI-assisted outline optimization.
 * Runs only after explicit user action.
 *
 * - When off/unconfigured: returns a no-op suggestion immediately (no fetch).
 * - When ready: serializes outline to JSON and requests optimization from the gateway.
 */
export async function assistOutline(
  outline: SlideOutline[],
  gateway: OutlineGateway,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return {
      id: crypto.randomUUID(),
      action: "outline",
      original: JSON.stringify(outline),
      suggestion: "",
    };
  }

  const input = JSON.stringify(outline);
  return gateway.requestSuggestion("outline", input);
}
