import { contentHash } from "@/lib/content-hash";
import type { AiSuggestion, ReportSection } from "@/types";

export function canApplyAiSuggestion(section: ReportSection, suggestion: AiSuggestion): boolean {
  return section.id === suggestion.sectionId
    && section.revision === suggestion.baseRevision
    && contentHash(section.markdown) === suggestion.baseHash;
}
