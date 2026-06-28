import type { AnswerVerdict, DefenseQuestion, ReportProjectBundle } from "@/types";
import { answerVerdictSchema } from "@/types";
import type { MockDefenseGateway } from "./generate-questions";

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return text;
  return text.slice(start, end + 1);
}

export function parseAnswerVerdict(raw: string): AnswerVerdict | null {
  try {
    const parsed = JSON.parse(extractJsonObject(raw));
    const result = answerVerdictSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function sectionContext(bundle: ReportProjectBundle, sectionId?: string) {
  const sections = sectionId
    ? bundle.project.sections.filter((section) => section.id === sectionId)
    : bundle.project.sections;
  return sections
    .filter((section) => section.markdown.trim())
    .slice(0, 4)
    .map((section) => ({
      id: section.id,
      title: section.title,
      excerpt: section.markdown.replace(/\s+/g, " ").slice(0, 1000),
    }));
}

function fallbackVerdict(question: DefenseQuestion, answer: string): AnswerVerdict {
  const trimmed = answer.trim();
  if (trimmed.length < 20) {
    return {
      verdict: "evaded",
      rationale: "Câu trả lời quá ngắn nên chưa đối chiếu được với báo cáo.",
      supportingSectionId: question.sectionId,
      supportExcerpt: question.supportExcerpt,
      followUp: "Bạn có thể nêu luận điểm chính và minh chứng cụ thể hơn không?",
    };
  }

  return {
    verdict: "answered",
    rationale: "Câu trả lời có nội dung để bảo vệ luận điểm; cần kiểm tra thêm minh chứng khi phản biện thật.",
    supportingSectionId: question.sectionId,
    supportExcerpt: question.supportExcerpt,
    followUp: question.evidenceIds.length === 0 ? "Minh chứng nào chứng minh phần trả lời này?" : undefined,
  };
}

export async function evaluateMockDefenseAnswer(
  bundle: ReportProjectBundle,
  question: DefenseQuestion,
  answer: string,
  gateway: MockDefenseGateway,
): Promise<AnswerVerdict> {
  const state = gateway.getGatewayState();
  if (state === "disabled" || state === "unconfigured") {
    return fallbackVerdict(question, answer);
  }

  const prompt = JSON.stringify({
    task: "Evaluate a Vietnamese mock-defense answer against the provided report context. Return JSON object only.",
    question,
    answer,
    reportContext: sectionContext(bundle, question.sectionId),
    evidence: bundle.evidence.map((item) => ({ id: item.id, kind: item.kind, title: item.title, url: item.url })),
    schema: {
      verdict: "answered|evaded|incorrect",
      rationale: "string",
      supportingSectionId: "string optional",
      supportExcerpt: "string optional",
      followUp: "string optional",
    },
  });

  const suggestion = await gateway.requestSuggestion("outline", prompt);
  return parseAnswerVerdict(suggestion.suggestion) ?? fallbackVerdict(question, answer);
}
