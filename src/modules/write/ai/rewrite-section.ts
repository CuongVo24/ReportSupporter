import type { ReportSection, AiSuggestion, GatewayState, AiAction } from "@/types";

export interface RewriteGateway {
  requestSuggestion: (action: AiAction, input: string) => Promise<AiSuggestion>;
  getGatewayState: () => GatewayState;
}

/**
 * AI-assisted section rewrite suggestions.
 * Returns suggestions without mutating the original section content.
 *
 * - When off/unconfigured: returns a no-op suggestion immediately (no fetch).
 * - When ready: requests content rewrite from the gateway.
 */
export async function rewriteSection(
  section: ReportSection,
  gateway: RewriteGateway,
): Promise<AiSuggestion> {
  const state = gateway.getGatewayState();

  if (state === "disabled" || state === "unconfigured") {
    return {
      id: crypto.randomUUID(),
      action: "rewrite",
      original: section.markdown,
      suggestion: "",
    };
  }

  return gateway.requestSuggestion("rewrite", section.markdown);
}
