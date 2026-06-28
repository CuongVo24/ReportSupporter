import type { MockDefensePersona } from "@/types";

export const MOCK_DEFENSE_PERSONAS: MockDefensePersona[] = [
  {
    id: "technical-reviewer",
    name: "Phản biện kỹ thuật",
    stance: "Hỏi sâu về kiến trúc, công nghệ, triển khai và rủi ro kỹ thuật.",
  },
  {
    id: "scope-reviewer",
    name: "Phản biện phạm vi",
    stance: "Bắt lỗi mục tiêu, phạm vi, yêu cầu và giới hạn của đề tài.",
  },
  {
    id: "evidence-secretary",
    name: "Thư ký minh chứng",
    stance: "Đối chiếu tuyên bố trong báo cáo với minh chứng, link và phụ lục.",
  },
];

export function findPersonaName(personaId: string) {
  return MOCK_DEFENSE_PERSONAS.find((persona) => persona.id === personaId)?.name ?? personaId;
}
