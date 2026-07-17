import type { AiActionGateway, AiRequestOptions, AiSuggestion } from "@/types";
import { buildNoopSuggestion } from "./ai-gateway";

/**
 * AI-assisted academic terminology normalization.
 * Returns a suggestion only; callers must show a diff before applying it.
 */
export async function improveTerminology(
  text: string,
  gateway: AiActionGateway,
  options?: AiRequestOptions,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return buildNoopSuggestion("terminology", text, options);
  }

  return options
    ? gateway.requestSuggestion("terminology", text, options)
    : gateway.requestSuggestion("terminology", text);
}
