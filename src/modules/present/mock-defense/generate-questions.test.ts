import { describe, expect, it, vi } from "vitest";
import type { ReportProjectBundle } from "@/types";
import { DEFAULT_FORMAT_SETTINGS, SCHEMA_VERSION } from "@/types";
import { generateMockDefenseQuestions, parseDefenseQuestions, type MockDefenseGateway } from "./generate-questions";

function bundle(): ReportProjectBundle {
  return {
    project: {
      id: "p1",
      title: "Demo",
      templateId: "software-project",
      metadata: {},
      sections: [{ id: "s1", order: 0, title: "Tech", markdown: "Dự án dùng Next.js và có repo.", status: "draft",
      revision: 0 }],
      updatedAt: "2026-06-28T00:00:00.000Z",
    },
    assets: [],
    evidence: [],
    formatSettings: DEFAULT_FORMAT_SETTINGS,
    schemaVersion: SCHEMA_VERSION,
  };
}

describe("generate mock defense questions", () => {
  it("parses a JSON question list safely", () => {
    const parsed = parseDefenseQuestions(JSON.stringify([
      {
        id: "q1",
        personaId: "technical-reviewer",
        question: "Vì sao chọn Next.js?",
        sectionId: "s1",
        evidenceIds: [],
        risk: "technical",
      },
    ]));

    expect(parsed[0]?.question).toContain("Next.js");
  });

  it("does not call the gateway when AI is disabled", async () => {
    const gateway: MockDefenseGateway = {
      getGatewayState: () => "disabled",
      requestSuggestion: vi.fn(),
    };

    await expect(generateMockDefenseQuestions(bundle(), undefined, [], gateway)).resolves.toEqual([]);
    expect(gateway.requestSuggestion).not.toHaveBeenCalled();
  });

  it("falls back to grounded local questions when AI returns invalid JSON", async () => {
    const gateway: MockDefenseGateway = {
      getGatewayState: () => "ready",
      requestSuggestion: vi.fn(async () => ({ id: "a", action: "outline" as const, original: "", suggestion: "not json" })),
    };

    const questions = await generateMockDefenseQuestions(bundle(), undefined, [], gateway);

    expect(questions).toHaveLength(1);
    expect(questions[0].sectionId).toBe("s1");
  });
});
