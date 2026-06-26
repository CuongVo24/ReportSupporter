import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";

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
      <div className="ws-state-icon" aria-hidden="true" style={{ display: "inline-flex", color: "var(--rs-color-severity-error)" }}>
        <AlertCircle size={40} strokeWidth={1.5} />
      </div>
      <h4 className="ws-state-title">{title}</h4>
      <p className="ws-state-message">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="danger" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
