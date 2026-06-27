import type { AiActionGateway, AiSuggestion } from "@/types";
import { buildNoopSuggestion } from "./ai-gateway";

/**
 * AI-assisted academic terminology normalization.
 * Returns a suggestion only; callers must show a diff before applying it.
 */
export async function improveTerminology(
  text: string,
  gateway: AiActionGateway,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return buildNoopSuggestion("terminology", text);
  }

  return gateway.requestSuggestion("terminology", text);
}
