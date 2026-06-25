import React from "react";
import type { GatewayState } from "@/types";

export interface AiOutlineButtonProps {
  onClick: () => void;
  isLoading: boolean;
  state: GatewayState;
}

export function AiOutlineButton({ onClick, isLoading, state }: AiOutlineButtonProps) {
  const isDisabled = state === "disabled" || state === "unconfigured";

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "var(--rs-space-1)",
    marginBlock: "var(--rs-space-3)",
  };

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--rs-space-2)",
    padding: "var(--rs-space-2) var(--rs-space-4)",
    backgroundColor: isDisabled ? "var(--rs-color-surface-muted)" : "var(--rs-color-primary)",
    color: isDisabled ? "var(--rs-color-text-muted)" : "var(--rs-white)",
    border: `1px solid var(--rs-color-border)`,
    borderRadius: "var(--rs-radius-md)",
    cursor: isDisabled ? "not-allowed" : "pointer",
    fontSize: "var(--rs-font-size-sm)",
    fontWeight: "var(--rs-font-weight-medium)",
    outline: "none",
    transition: "background-color 0.2s, opacity 0.2s",
  };

  const noteStyle: React.CSSProperties = {
    fontSize: "var(--rs-font-size-xs)",
    color: "var(--rs-color-severity-warning)",
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--rs-space-1)",
  };

  return (
    <div style={containerStyle} className="ws-present-ai-outline-btn-container">
      <button
        type="button"
        style={buttonStyle}
        onClick={onClick}
        disabled={isDisabled || isLoading}
        aria-busy={isLoading}
        className="ws-present-ai-btn"
        title={isDisabled ? "Vui lòng cấu hình AI để sử dụng tính năng này" : "Tối ưu hóa Outline bằng AI"}
      >
        <span>{isLoading ? "⏳ Đang tối ưu..." : "✨ Tối ưu Outline bằng AI"}</span>
      </button>
      {isDisabled && (
        <span style={noteStyle} className="ws-present-ai-note">
          ⚠️ Bật AI trong cấu hình
        </span>
      )}
    </div>
  );
}
