import type { AiSuggestion, GatewayState, AiAction } from "@/types";

export interface ToneGateway {
  requestSuggestion: (action: AiAction, input: string) => Promise<AiSuggestion>;
  getGatewayState: () => GatewayState;
}

/**
 * AI-assisted academic tone improvements.
 * Returns suggestion for formatting/academic corrections.
 *
 * - When off/unconfigured: returns a no-op suggestion immediately (no fetch).
 * - When ready: requests tone improvements from the gateway.
 */
export async function improveTone(
  text: string,
  gateway: ToneGateway,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return {
      id: crypto.randomUUID(),
      action: "tone",
      original: text,
      suggestion: "",
    };
  }

  return gateway.requestSuggestion("tone", text);
}
