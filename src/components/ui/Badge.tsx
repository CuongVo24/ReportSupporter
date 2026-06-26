"use client";

import React from "react";
import {
  XCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  CircleSlash,
  Circle,
  Eye,
  Check,
} from "lucide-react";
import "./Badge.css";

export type BadgeGroup = "severity" | "readiness" | "status";

export interface BadgeProps {
  group: BadgeGroup;
  value: string; // e.g. "error", "good", "draft"
  label?: string; // custom display label, defaults to value mapping
  clickable?: boolean;
  active?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLSpanElement>) => void;
  ariaLabel?: string;
}

const getBadgeConfig = (group: BadgeGroup, value: string) => {
  switch (group) {
    case "severity":
      switch (value) {
        case "error":
          return { label: "Lỗi", icon: XCircle, className: "ws-badge-severity-error" };
        case "warning":
          return { label: "Cảnh báo", icon: AlertTriangle, className: "ws-badge-severity-warning" };
        case "info":
        default:
          return { label: "Thông tin", icon: Info, className: "ws-badge-severity-info" };
      }
    case "readiness":
      switch (value) {
        case "good":
          return { label: "Đạt", icon: CheckCircle2, className: "ws-badge-readiness-good" };
        case "medium":
          return { label: "Cảnh báo", icon: AlertCircle, className: "ws-badge-readiness-medium" };
        case "low":
        default:
          return { label: "Yếu", icon: CircleSlash, className: "ws-badge-readiness-low" };
      }
    case "status":
    default:
      switch (value) {
        case "draft":
          return { label: "Nháp", icon: Circle, className: "ws-badge-status-draft" };
        case "review":
          return { label: "Xét duyệt", icon: Eye, className: "ws-badge-status-review" };
        case "done":
        default:
          return { label: "Hoàn thành", icon: Check, className: "ws-badge-status-done" };
      }
  }
};

export const Badge: React.FC<BadgeProps> = ({
  group,
  value,
  label,
  clickable = false,
  active = false,
  onClick,
  ariaLabel,
}) => {
  const config = getBadgeConfig(group, value);
  const displayLabel = label || config.label;
  const IconComponent = config.icon;

  const classNames = [
    "ws-badge",
    `ws-badge-group-${group}`,
    config.className,
    clickable ? "ws-badge-clickable" : "ws-badge-static",
    active ? "ws-badge-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const innerContent = (
    <>
      <IconComponent className="ws-badge-icon" aria-hidden="true" />
      <span className="ws-badge-text">{displayLabel}</span>
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        className={classNames}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        aria-label={ariaLabel || `Tới trạng thái: ${displayLabel}`}
      >
        {innerContent}
      </button>
    );
  }

  return <span className={classNames}>{innerContent}</span>;
};
