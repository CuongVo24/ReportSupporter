import type { AiAction, AiActionGateway, AiSuggestion, AiTaskStatus, ReportSection } from "@/types";
import { contentHash } from "@/lib/content-hash";
import { improveTerminology } from "./improve-terminology";
import { translateSection } from "./translate-section";

export type WholeReportAiAction = Extract<AiAction, "translate" | "terminology">;

export type SectionAiSuggestion = {
  sectionId: string;
  sectionTitle: string;
  suggestion: AiSuggestion;
};

export type SectionAiTask = {
  sectionId: string;
  sectionTitle: string;
  status: AiTaskStatus;
  suggestion?: AiSuggestion;
  error?: string;
};

export async function suggestWholeReportSections(
  sections: ReportSection[],
  action: WholeReportAiAction,
  gateway: AiActionGateway,
  options?: {
    projectId?: string;
    signal?: AbortSignal;
    onTask?: (task: SectionAiTask) => void;
  },
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
    options?.onTask?.({ sectionId: section.id, sectionTitle: section.title, status: "pending" });
  }

  for (const section of sortedSections) {
    if (options?.signal?.aborted) {
      options.onTask?.({ sectionId: section.id, sectionTitle: section.title, status: "cancelled" });
      continue;
    }
    options?.onTask?.({ sectionId: section.id, sectionTitle: section.title, status: "running" });
    try {
      const requestOptions = options ? {
        signal: options.signal,
        requestId: crypto.randomUUID(),
        context: {
          projectId: options.projectId,
          sectionId: section.id,
          revision: section.revision,
          contentHash: contentHash(section.markdown),
        },
      } : undefined;
      const suggestion = action === "translate"
        ? await translateSection(section, gateway, requestOptions)
        : await improveTerminology(section.markdown, gateway, requestOptions);

      if (suggestion.suggestion.trim() && suggestion.suggestion !== section.markdown) {
        const complete = { sectionId: section.id, sectionTitle: section.title, suggestion };
        suggestions.push(complete);
        options?.onTask?.({ ...complete, status: "done" });
      } else {
        options?.onTask?.({ sectionId: section.id, sectionTitle: section.title, status: "done", suggestion });
      }
    } catch (error: unknown) {
      const cancelled = options?.signal?.aborted || (error instanceof DOMException && error.name === "AbortError");
      options?.onTask?.({
        sectionId: section.id,
        sectionTitle: section.title,
        status: cancelled ? "cancelled" : "failed",
        error: cancelled ? undefined : error instanceof Error ? error.message : "AI request failed.",
      });
    }
  }

  return suggestions;
}
