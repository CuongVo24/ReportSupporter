import { scoreBand } from "./readiness-score";

type ReadinessBadgeProps = {
  score: number;
};

const LABELS = {
  green: "Sẵn sàng",
  yellow: "Cần xem lại",
  red: "Chưa nên nộp",
};

/**
 * ReadinessBadge component displaying the readiness score and color band status.
 * Styled purely using CSS classes referencing design system tokens.
 */
export function ReadinessBadge({ score }: ReadinessBadgeProps) {
  const band = scoreBand(score);
  const label = LABELS[band];

  return (
    <div className={`ws-readiness-badge ws-readiness-badge-${band}`} role="status" aria-live="polite">
      <div className="ws-readiness-badge-header">
        <span className="ws-readiness-badge-title">Độ sẵn sàng</span>
        <span className="ws-readiness-badge-draft">DRAFT</span>
      </div>
      <div className="ws-readiness-badge-content">
        <span className="ws-readiness-badge-score">{score}</span>
        <span className="ws-readiness-badge-status">{label}</span>
      </div>
    </div>
  );
}
