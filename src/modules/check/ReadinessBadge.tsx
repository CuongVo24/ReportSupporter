import { Badge } from "@/components/ui";
import { scoreBand } from "./readiness-score";

type ReadinessBadgeProps = {
  score: number;
};

const LABELS = {
  green: "Sẵn sàng",
  yellow: "Cần xem lại",
  red: "Chưa nên nộp",
};

const BADGE_VALUES = {
  green: "good",
  yellow: "medium",
  red: "low",
} as const;

/**
 * ReadinessBadge component displaying the readiness score and color band status.
 * Styled purely using CSS classes referencing design system tokens.
 */
export function ReadinessBadge({ score }: ReadinessBadgeProps) {
  const band = scoreBand(score);
  const label = LABELS[band];
  const badgeVal = BADGE_VALUES[band];

  return (
    <div className={`ws-readiness-badge ws-readiness-badge-${band}`} role="status" aria-live="polite">
      <div className="ws-readiness-badge-header">
        <span className="ws-readiness-badge-title">Độ sẵn sàng</span>
        <span className="ws-readiness-badge-draft">DRAFT</span>
      </div>
      <div className="ws-readiness-badge-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--rs-space-2)", width: "100%" }}>
        <span className="ws-readiness-badge-score">{score}</span>
        <Badge group="readiness" value={badgeVal} label={label} />
      </div>
    </div>
  );
}
