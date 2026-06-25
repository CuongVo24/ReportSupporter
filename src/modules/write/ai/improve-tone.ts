import type { AiSuggestion, AiActionGateway } from "@/types";
import { buildNoopSuggestion } from "./ai-gateway";

/**
 * AI-assisted academic tone improvements.
 * Returns suggestion for formatting/academic corrections.
 *
 * - When off/unconfigured: returns a no-op suggestion immediately (no fetch).
 * - When ready: requests tone improvements from the gateway.
 */
export async function improveTone(
  text: string,
  gateway: AiActionGateway,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return buildNoopSuggestion("tone", text);
  }

  return gateway.requestSuggestion("tone", text);
}
