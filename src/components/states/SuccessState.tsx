import React from "react";
import { CheckCircle2 } from "lucide-react";

type SuccessStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SuccessState({
  title = "Thành công",
  message = "Thao tác đã được thực hiện thành công.",
  actionLabel,
  onAction,
}: SuccessStateProps) {
  return (
    <div className="ws-state-container ws-state-success">
      <div className="ws-state-icon" aria-hidden="true" style={{ display: "inline-flex", color: "var(--rs-color-success)" }}>
        <CheckCircle2 size={40} strokeWidth={1.5} />
      </div>
      <h4 className="ws-state-title">{title}</h4>
      <p className="ws-state-message">{message}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="ws-state-cta-btn ws-state-success-btn">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
