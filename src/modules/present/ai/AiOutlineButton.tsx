import React from "react";
import type { GatewayState } from "@/types";

export interface AiOutlineButtonProps {
  onClick: () => void;
  isLoading: boolean;
  state: GatewayState;
}

export function AiOutlineButton({ onClick, isLoading, state }: AiOutlineButtonProps) {
  const isDisabled = state === "disabled" || state === "unconfigured";

  return (
    <div className="ws-present-ai-outline-btn-container">
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled || isLoading}
        aria-busy={isLoading}
        className="ws-present-ai-outline-action"
        title={isDisabled ? "Vui lòng cấu hình AI để sử dụng tính năng này" : "Tối ưu hóa Outline bằng AI"}
      >
        <span>{isLoading ? "⏳ Đang tối ưu..." : "✨ Tối ưu Outline bằng AI"}</span>
      </button>
      {isDisabled && (
        <span className="ws-present-ai-note">
          ⚠️ Bật AI trong cấu hình
        </span>
      )}
    </div>
  );
}
