import type { AiActionGateway, AiRequestOptions, AiSuggestion, ReportSection } from "@/types";
import { buildNoopSuggestion } from "./ai-gateway";

/**
 * AI-assisted Vietnamese/English translation for one report section.
 * Returns a suggestion only; callers must show a diff before applying it.
 */
export async function translateSection(
  section: ReportSection,
  gateway: AiActionGateway,
  options?: AiRequestOptions,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return buildNoopSuggestion("translate", section.markdown, options);
  }

  return options
    ? gateway.requestSuggestion("translate", section.markdown, options)
    : gateway.requestSuggestion("translate", section.markdown);
}
