import React from "react";

type ErrorStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  title = "Có lỗi xảy ra",
  message = "Không thể tải hoặc xử lý dữ liệu.",
  actionLabel,
  onAction,
}: ErrorStateProps) {
  return (
    <div className="ws-state-container ws-state-error" role="alert">
      <div className="ws-state-icon" aria-hidden="true">
        ⚠️
      </div>
      <h4 className="ws-state-title">{title}</h4>
      <p className="ws-state-message">{message}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="ws-state-cta-btn ws-state-error-btn">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
