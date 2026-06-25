import type { SlideOutline, AiSuggestion, AiActionGateway } from "@/types";
import { buildNoopSuggestion } from "@/modules/write/ai/ai-gateway";

/**
 * AI-assisted outline optimization.
 * Runs only after explicit user action.
 *
 * - When off/unconfigured: returns a no-op suggestion immediately (no fetch).
 * - When ready: serializes outline to JSON and requests optimization from the gateway.
 */
export async function assistOutline(
  outline: SlideOutline[],
  gateway: AiActionGateway,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return buildNoopSuggestion("outline", JSON.stringify(outline));
  }

  const input = JSON.stringify(outline);
  return gateway.requestSuggestion("outline", input);
}
