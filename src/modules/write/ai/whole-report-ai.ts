import type { AiAction, AiActionGateway, AiSuggestion, ReportSection } from "@/types";
import { improveTerminology } from "./improve-terminology";
import { translateSection } from "./translate-section";

export type WholeReportAiAction = Extract<AiAction, "translate" | "terminology">;

export type SectionAiSuggestion = {
  sectionId: string;
  sectionTitle: string;
  suggestion: AiSuggestion;
};

export async function suggestWholeReportSections(
  sections: ReportSection[],
  action: WholeReportAiAction,
  gateway: AiActionGateway,
): Promise<SectionAiSuggestion[]> {
  const state = gateway.getGatewayState();
  if (state === "disabled" || state === "unconfigured") {
    return [];
  }

  const sortedSections = [...sections]
    .filter((section) => section.markdown.trim().length > 0)
    .sort((a, b) => a.order - b.order);

  const suggestions: SectionAiSuggestion[] = [];

  for (const section of sortedSections) {
    const suggestion =
      action === "translate"
        ? await translateSection(section, gateway)
        : await improveTerminology(section.markdown, gateway);

    if (suggestion.suggestion.trim() && suggestion.suggestion !== section.markdown) {
      suggestions.push({
        sectionId: section.id,
        sectionTitle: section.title,
        suggestion,
      });
    }
  }

  return suggestions;
}
