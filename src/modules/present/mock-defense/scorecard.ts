import { computeReportHealth } from "@/modules/check/report-health";
import type { CheckResult, MockDefenseSession, ReadinessScorecard, ReportProjectBundle } from "@/types";
import { MOCK_DEFENSE_PERSONAS } from "./personas";

export function buildReadinessScorecard(
  bundle: ReportProjectBundle,
  session: MockDefenseSession,
  checkResult?: CheckResult,
): ReadinessScorecard {
  const answered = session.turns.filter((turn) => turn.verdict?.verdict === "answered").length;
  const evaded = session.turns.filter((turn) => turn.verdict?.verdict === "evaded").length;
  const incorrect = session.turns.filter((turn) => turn.verdict?.verdict === "incorrect").length;
  const total = Math.max(1, session.turns.filter((turn) => turn.verdict).length);
  const defenseScore = Math.max(0, Math.round(((answered * 100) - (evaded * 25) - (incorrect * 45)) / total));
  const healthScore = computeReportHealth(bundle, checkResult).score;

  return {
    readiness: Math.max(0, Math.min(100, Math.round(healthScore * 0.45 + defenseScore * 0.55))),
    perPersona: MOCK_DEFENSE_PERSONAS.map((persona) => {
      const turns = session.turns.filter((turn) => turn.question.personaId === persona.id);
      return {
        personaId: persona.id,
        answered: turns.filter((turn) => turn.verdict?.verdict === "answered").length,
        evaded: turns.filter((turn) => turn.verdict?.verdict === "evaded").length,
        incorrect: turns.filter((turn) => turn.verdict?.verdict === "incorrect").length,
      };
    }),
    hotQuestions: session.turns
      .filter((turn) => turn.verdict?.verdict !== "answered")
      .map((turn) => turn.question.question)
      .slice(0, 5),
    weakClaims: session.turns
      .filter((turn) => turn.verdict?.followUp)
      .map((turn) => turn.verdict?.followUp ?? "")
      .slice(0, 5),
  };
}
