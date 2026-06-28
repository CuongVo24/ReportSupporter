import { z } from "zod";
import type { AiActionGateway, CheckResult, DefenseQuestion, ReportProjectBundle, SlideOutline } from "@/types";
import { defenseQuestionSchema } from "@/types";
import { buildWeakSectionHints } from "../weak-sections";
import { MOCK_DEFENSE_PERSONAS } from "./personas";

export type MockDefenseGateway = Pick<AiActionGateway, "requestSuggestion" | "getGatewayState">;

const questionListSchema = z.array(defenseQuestionSchema);

function extractJsonArray(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) return text;
  return text.slice(start, end + 1);
}

export function parseDefenseQuestions(raw: string): DefenseQuestion[] {
  try {
    const parsed = JSON.parse(extractJsonArray(raw));
    const result = questionListSchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

function summarizeBundle(bundle: ReportProjectBundle) {
  return bundle.project.sections
    .filter((section) => section.markdown.trim())
    .slice(0, 8)
    .map((section) => ({
      id: section.id,
      title: section.title,
      excerpt: section.markdown.replace(/\s+/g, " ").slice(0, 900),
    }));
}

function fallbackQuestions(bundle: ReportProjectBundle, checkResult?: CheckResult, slides: SlideOutline[] = []): DefenseQuestion[] {
  const weak = checkResult ? buildWeakSectionHints(checkResult, slides) : [];
  const targetSections = [...bundle.project.sections]
    .filter((section) => section.markdown.trim())
    .sort((a, b) => {
      const weakA = weak.some((hint) => hint.sectionId === a.id) ? 0 : 1;
      const weakB = weak.some((hint) => hint.sectionId === b.id) ? 0 : 1;
      return weakA - weakB || a.order - b.order;
    })
    .slice(0, 3);

  return targetSections.map((section, index) => {
    const persona = MOCK_DEFENSE_PERSONAS[index % MOCK_DEFENSE_PERSONAS.length];
    return {
      id: `mock-defense-${section.id}-${persona.id}`,
      personaId: persona.id,
      question: `Trong mục "${section.title}", luận điểm nào có minh chứng mạnh nhất và điểm nào hội đồng có thể hỏi tiếp?`,
      sectionId: section.id,
      evidenceIds: [],
      supportExcerpt: section.markdown.replace(/\s+/g, " ").slice(0, 220),
      risk: persona.id === "evidence-secretary" ? "evidence" : persona.id === "technical-reviewer" ? "technical" : "scope",
    };
  });
}

export async function generateMockDefenseQuestions(
  bundle: ReportProjectBundle,
  checkResult: CheckResult | undefined,
  slides: SlideOutline[],
  gateway: MockDefenseGateway,
): Promise<DefenseQuestion[]> {
  const state = gateway.getGatewayState();
  if (state === "disabled" || state === "unconfigured") {
    return [];
  }

  const prompt = JSON.stringify({
    task: "Generate grounded Vietnamese mock-defense questions. Return JSON array only.",
    personas: MOCK_DEFENSE_PERSONAS,
    sections: summarizeBundle(bundle),
    evidence: bundle.evidence.map((item) => ({ id: item.id, kind: item.kind, title: item.title, url: item.url })),
    weakSections: checkResult ? buildWeakSectionHints(checkResult, slides) : [],
    schema: {
      id: "string",
      personaId: "technical-reviewer|scope-reviewer|evidence-secretary",
      question: "string",
      sectionId: "string optional",
      evidenceIds: "string[]",
      supportExcerpt: "string optional, quote or paraphrase from report",
      risk: "scope|technical|evidence|result|limitation",
    },
  });

  const suggestion = await gateway.requestSuggestion("outline", prompt);
  const parsed = parseDefenseQuestions(suggestion.suggestion);
  return parsed.length > 0 ? parsed : fallbackQuestions(bundle, checkResult, slides);
}
