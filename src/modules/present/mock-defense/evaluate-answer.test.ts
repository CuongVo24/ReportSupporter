import { describe, expect, it, vi } from "vitest";
import type { DefenseQuestion, ReportProjectBundle } from "@/types";
import { DEFAULT_FORMAT_SETTINGS, SCHEMA_VERSION } from "@/types";
import { evaluateMockDefenseAnswer, parseAnswerVerdict } from "./evaluate-answer";
import type { MockDefenseGateway } from "./generate-questions";

const question: DefenseQuestion = {
  id: "q1",
  personaId: "technical-reviewer",
  question: "Vì sao chọn kiến trúc này?",
  sectionId: "s1",
  evidenceIds: [],
  risk: "technical",
};

const bundle: ReportProjectBundle = {
  project: {
    id: "p1",
    title: "Demo",
    templateId: "software-project",
    metadata: {},
    sections: [{ id: "s1", order: 0, title: "Tech", markdown: "Kiến trúc dùng Next.js.", status: "draft" }],
    updatedAt: "2026-06-28T00:00:00.000Z",
  },
  assets: [],
  evidence: [],
  formatSettings: DEFAULT_FORMAT_SETTINGS,
  schemaVersion: SCHEMA_VERSION,
};

describe("evaluate mock defense answer", () => {
  it("parses verdict JSON safely", () => {
    expect(parseAnswerVerdict('{"verdict":"evaded","rationale":"Chưa trả lời trọng tâm"}')?.verdict).toBe("evaded");
  });

  it("uses fallback verdict without calling gateway when AI is disabled", async () => {
    const gateway: MockDefenseGateway = {
      getGatewayState: () => "disabled",
      requestSuggestion: vi.fn(),
    };

    const verdict = await evaluateMockDefenseAnswer(bundle, question, "ngắn", gateway);

    expect(verdict.verdict).toBe("evaded");
    expect(gateway.requestSuggestion).not.toHaveBeenCalled();
  });
});
