import type { AiActionGateway, ReportSection } from "@/types";
import { importReadme } from "../readme-import";

export async function generateOutline(
  prompt: string,
  gateway: Pick<AiActionGateway, "requestSuggestion">
): Promise<ReportSection[]> {
  const suggestion = await gateway.requestSuggestion("outline", prompt);
  if (!suggestion.suggestion) return [];
  return importReadme(suggestion.suggestion);
}
