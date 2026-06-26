import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui";

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
      <div className="ws-state-icon" aria-hidden="true" style={{ display: "inline-flex", color: "var(--rs-color-text-muted)" }}>
        <FileText size={40} strokeWidth={1.5} />
      </div>
      <h4 className="ws-state-title">{title}</h4>
      <p className="ws-state-message">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
