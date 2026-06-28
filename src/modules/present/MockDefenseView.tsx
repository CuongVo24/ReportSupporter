"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui";
import type { CheckResult, MockDefenseSession, ReportProjectBundle, SlideOutline } from "@/types";
import { getGatewayState, requestSuggestion } from "@/modules/write";
import { evaluateMockDefenseAnswer } from "./mock-defense/evaluate-answer";
import { findPersonaName } from "./mock-defense/personas";
import { generateMockDefenseQuestions } from "./mock-defense/generate-questions";
import { answerCurrentTurn, createMockDefenseSession, finishMockDefenseSession } from "./mock-defense/session";

type MockDefenseViewProps = {
  bundle: ReportProjectBundle;
  checkResult?: CheckResult;
  slides: SlideOutline[];
  onOpenSettings?: () => void;
};

export function MockDefenseView({ bundle, checkResult, slides, onOpenSettings }: MockDefenseViewProps) {
  const [session, setSession] = useState<MockDefenseSession | null>(null);
  const [answer, setAnswer] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  const gateway = useMemo(() => ({ requestSuggestion, getGatewayState }), []);
  const gatewayState = getGatewayState();
  const currentTurn = session?.turns[session.currentTurnIndex];
  const answeredTurns = session?.turns.filter((turn) => turn.verdict).length ?? 0;

  const startSession = async () => {
    if (gatewayState === "disabled" || gatewayState === "unconfigured") {
      setError("Bật và cấu hình AI trước khi bắt đầu phiên luyện phản biện.");
      return;
    }

    setIsRunning(true);
    setError("");
    try {
      const questions = await generateMockDefenseQuestions(bundle, checkResult, slides, gateway);
      if (questions.length === 0) {
        setError("AI chưa tạo được câu hỏi phản biện từ báo cáo hiện tại.");
        return;
      }
      setSession(createMockDefenseSession(questions));
      setAnswer("");
    } catch {
      setError("Lỗi kết nối AI gateway khi tạo phiên phản biện.");
    } finally {
      setIsRunning(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !currentTurn || !answer.trim()) return;
    setIsRunning(true);
    setError("");
    try {
      const verdict = await evaluateMockDefenseAnswer(bundle, currentTurn.question, answer, gateway);
      setSession(answerCurrentTurn(session, answer, verdict));
      setAnswer("");
    } catch {
      setError("Lỗi kết nối AI gateway khi chấm câu trả lời.");
    } finally {
      setIsRunning(false);
    }
  };

  const finishSession = () => {
    if (!session) return;
    setSession(finishMockDefenseSession(bundle, session, checkResult));
  };

  return (
    <section className="ws-mock-defense" aria-label="Luyện phản biện AI">
      <div className="ws-mock-defense-header">
        <div>
          <h4 className="ws-present-view-title">Luyện phản biện</h4>
          <p className="ws-mock-defense-note">
            Chỉ gửi nội dung khi bạn chủ động bắt đầu phiên và AI đã được cấu hình.
          </p>
        </div>
        {!session && (
          <Button
            variant="primary"
            size="sm"
            disabled={isRunning || gatewayState !== "ready"}
            onClick={() => void startSession()}
            leadingIcon={isRunning ? <Loader2 size={14} className="ws-export-spinner" /> : <ShieldQuestion size={14} />}
          >
            Bắt đầu phiên
          </Button>
        )}
      </div>

      {gatewayState !== "ready" && (
        <div className="ws-mock-defense-warning" role="status">
          <AlertTriangle size={14} aria-hidden="true" />
          Tính năng này cần mạng và AI opt-in. Nội dung báo cáo chỉ rời máy sau khi bạn bật AI và bắt đầu phiên.
          <Button variant="secondary" size="sm" onClick={onOpenSettings}>
            Cài đặt AI
          </Button>
        </div>
      )}

      {error && (
        <div className="ws-mock-defense-error" role="alert">
          <AlertTriangle size={14} aria-hidden="true" />
          {error}
        </div>
      )}

      {session && currentTurn && !session.scorecard && (
        <div className="ws-mock-defense-session">
          <div className="ws-mock-defense-progress">
            Câu {session.currentTurnIndex + 1}/{session.turns.length} · Đã chấm {answeredTurns}
          </div>
          <article className="ws-mock-defense-card">
            <div className="ws-mock-defense-persona">{findPersonaName(currentTurn.question.personaId)}</div>
            <p className="ws-mock-defense-question">{currentTurn.question.question}</p>
            {currentTurn.question.supportExcerpt && (
              <blockquote className="ws-mock-defense-excerpt">{currentTurn.question.supportExcerpt}</blockquote>
            )}
          </article>

          <label className="ws-mock-defense-answer-label" htmlFor="ws-mock-defense-answer">
            Câu trả lời của bạn
          </label>
          <textarea
            id="ws-mock-defense-answer"
            className="ws-mock-defense-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={5}
          />
          <div className="ws-mock-defense-actions">
            <Button variant="primary" disabled={isRunning || !answer.trim()} onClick={() => void submitAnswer()}>
              {isRunning ? "Đang chấm..." : "Gửi trả lời"}
            </Button>
            <Button variant="secondary" disabled={answeredTurns === 0} onClick={finishSession}>
              Kết thúc phiên
            </Button>
          </div>
        </div>
      )}

      {session && session.turns.some((turn) => turn.verdict) && (
        <div className="ws-mock-defense-history">
          {session.turns.filter((turn) => turn.verdict).map((turn) => (
            <article key={turn.question.id} className={`ws-mock-defense-verdict verdict-${turn.verdict?.verdict}`}>
              <strong>{findPersonaName(turn.question.personaId)} · {turn.verdict?.verdict}</strong>
              <p>{turn.verdict?.rationale}</p>
              {turn.verdict?.followUp && <small>Hỏi tiếp: {turn.verdict.followUp}</small>}
            </article>
          ))}
        </div>
      )}

      {session?.scorecard && (
        <div className="ws-mock-defense-scorecard">
          <strong>Sẵn sàng bảo vệ: {session.scorecard.readiness}%</strong>
          {session.scorecard.hotQuestions.length > 0 && (
            <ul>
              {session.scorecard.hotQuestions.map((question) => <li key={question}>{question}</li>)}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
