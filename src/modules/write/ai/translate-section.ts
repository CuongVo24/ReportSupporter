import type { AiActionGateway, AiSuggestion, ReportSection } from "@/types";
import { buildNoopSuggestion } from "./ai-gateway";

/**
 * AI-assisted Vietnamese/English translation for one report section.
 * Returns a suggestion only; callers must show a diff before applying it.
 */
export async function translateSection(
  section: ReportSection,
  gateway: AiActionGateway,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return buildNoopSuggestion("translate", section.markdown);
  }

  return gateway.requestSuggestion("translate", section.markdown);
}
