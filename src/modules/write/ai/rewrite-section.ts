import type { ReportSection, AiSuggestion, AiActionGateway, AiRequestOptions } from "@/types";
import { buildNoopSuggestion } from "./ai-gateway";

/**
 * AI-assisted section rewrite suggestions.
 * Returns suggestions without mutating the original section content.
 *
 * - When off/unconfigured: returns a no-op suggestion immediately (no fetch).
 * - When ready: requests content rewrite from the gateway.
 */
export async function rewriteSection(
  section: ReportSection,
  gateway: AiActionGateway,
  options?: AiRequestOptions,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return buildNoopSuggestion("rewrite", section.markdown, options);
  }

  return options
    ? gateway.requestSuggestion("rewrite", section.markdown, options)
    : gateway.requestSuggestion("rewrite", section.markdown);
}
