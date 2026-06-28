import type {
  AnswerVerdict,
  CheckResult,
  DefenseQuestion,
  MockDefenseSession,
  ReportProjectBundle,
} from "@/types";
import { buildReadinessScorecard } from "./scorecard";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `mock-defense-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createMockDefenseSession(questions: DefenseQuestion[]): MockDefenseSession {
  return {
    id: createId(),
    startedAt: new Date().toISOString(),
    currentTurnIndex: 0,
    turns: questions.map((question) => ({ question })),
  };
}

export function answerCurrentTurn(
  session: MockDefenseSession,
  answer: string,
  verdict: AnswerVerdict,
): MockDefenseSession {
  const turns = session.turns.map((turn, index) =>
    index === session.currentTurnIndex ? { ...turn, answer, verdict } : turn,
  );
  const nextIndex = Math.min(session.currentTurnIndex + 1, Math.max(0, turns.length - 1));

  return {
    ...session,
    turns,
    currentTurnIndex: nextIndex,
  };
}

export function finishMockDefenseSession(
  bundle: ReportProjectBundle,
  session: MockDefenseSession,
  checkResult?: CheckResult,
): MockDefenseSession {
  return {
    ...session,
    scorecard: buildReadinessScorecard(bundle, session, checkResult),
  };
}
