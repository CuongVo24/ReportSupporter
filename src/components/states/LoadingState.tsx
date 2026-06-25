import React from "react";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Đang tải dữ liệu..." }: LoadingStateProps) {
  return (
    <div className="ws-state-container ws-state-loading" role="status">
      <div className="ws-state-spinner" aria-hidden="true" />
      <p className="ws-state-message">{message}</p>
    </div>
  );
}
