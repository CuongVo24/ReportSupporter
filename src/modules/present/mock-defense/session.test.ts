import { describe, expect, it } from "vitest";
import type { AnswerVerdict, DefenseQuestion, ReportProjectBundle } from "@/types";
import { DEFAULT_FORMAT_SETTINGS, SCHEMA_VERSION } from "@/types";
import { answerCurrentTurn, createMockDefenseSession, finishMockDefenseSession } from "./session";

const questions: DefenseQuestion[] = [
  { id: "q1", personaId: "technical-reviewer", question: "Q1", evidenceIds: [], risk: "technical" },
  { id: "q2", personaId: "scope-reviewer", question: "Q2", evidenceIds: [], risk: "scope" },
];

const verdict: AnswerVerdict = { verdict: "answered", rationale: "OK" };

const bundle: ReportProjectBundle = {
  project: {
    id: "p1",
    title: "Demo",
    templateId: "software-project",
    metadata: {},
    sections: [{ id: "s1", order: 0, title: "Intro", markdown: "Content", status: "draft",
    revision: 0 }],
    updatedAt: "2026-06-28T00:00:00.000Z",
  },
  assets: [],
  evidence: [],
  formatSettings: DEFAULT_FORMAT_SETTINGS,
  schemaVersion: SCHEMA_VERSION,
};

describe("mock defense session", () => {
  it("records a turn answer and advances", () => {
    const session = answerCurrentTurn(createMockDefenseSession(questions), "Answer", verdict);

    expect(session.turns[0].answer).toBe("Answer");
    expect(session.currentTurnIndex).toBe(1);
  });

  it("builds a finish scorecard", () => {
    const answered = answerCurrentTurn(createMockDefenseSession(questions), "Answer", verdict);
    const finished = finishMockDefenseSession(bundle, answered);

    expect(finished.scorecard?.readiness).toBeGreaterThanOrEqual(0);
    expect(finished.scorecard?.perPersona).toHaveLength(3);
  });
});
