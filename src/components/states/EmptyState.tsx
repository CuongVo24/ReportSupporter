import React from "react";

type EmptyStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title = "Không có dữ liệu",
  message = "Chưa có thông tin hiển thị tại phần này.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="ws-state-container ws-state-empty">
      <div className="ws-state-icon" aria-hidden="true">
        📁
      </div>
      <h4 className="ws-state-title">{title}</h4>
      <p className="ws-state-message">{message}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="ws-state-cta-btn">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
