"use client";

import { Activity } from "lucide-react";
import type { ReportHealth } from "@/modules/check";

type ReportHealthBadgeProps = {
  health: ReportHealth;
  onOpenDetails: () => void;
};

const STATUS_LABELS = {
  green: "Ổn định",
  yellow: "Cần xem lại",
  red: "Cần xử lý",
} as const;

export function ReportHealthBadge({ health, onOpenDetails }: ReportHealthBadgeProps) {
  const tooltip = health.breakdown
    .map((item) => `${item.label}: ${item.score}% - ${item.detail}`)
    .join("\n");

  return (
    <div className="ws-report-health" title={tooltip}>
      <button
        type="button"
        className={`ws-report-health-button ws-report-health-${health.status}`}
        onClick={onOpenDetails}
        aria-label={`Sức khỏe báo cáo ${health.score} phần trăm, ${STATUS_LABELS[health.status]}`}
      >
        <Activity size={15} aria-hidden="true" />
        <span className="ws-report-health-copy">
          <span className="ws-report-health-label">Sức khỏe</span>
          <span className="ws-report-health-score">{health.score}%</span>
        </span>
        <span className="ws-report-health-status">{STATUS_LABELS[health.status]}</span>
      </button>
      <div className="ws-report-health-tooltip" role="tooltip">
        {health.breakdown.map((item) => (
          <div key={item.id} className="ws-report-health-row">
            <span>{item.label}</span>
            <strong>{item.score}%</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
