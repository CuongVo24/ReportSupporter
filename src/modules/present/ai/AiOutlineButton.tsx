import React from "react";
import type { GatewayState } from "@/types";
import { Button } from "@/components/ui";
import { Sparkles, AlertTriangle } from "lucide-react";

export interface AiOutlineButtonProps {
  onClick: () => void;
  isLoading: boolean;
  state: GatewayState;
}

export function AiOutlineButton({ onClick, isLoading, state }: AiOutlineButtonProps) {
  const isDisabled = state === "disabled" || state === "unconfigured";

  return (
    <div className="ws-present-ai-outline-btn-container" style={{ display: "flex", alignItems: "center", gap: "var(--rs-space-2)" }}>
      <Button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        loading={isLoading}
        className="ws-present-ai-outline-action"
        title={isDisabled ? "Vui lòng cấu hình AI để sử dụng tính năng này" : "Tối ưu hóa Outline bằng AI"}
        variant="primary"
        size="sm"
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={14} /> Tối ưu Outline bằng AI
        </span>
      </Button>
      {isDisabled && (
        <span className="ws-present-ai-note" style={{ fontSize: "var(--rs-font-size-xs)", color: "var(--rs-color-text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <AlertTriangle size={12} style={{ color: "var(--rs-color-severity-warning)" }} /> Bật AI trong cấu hình
        </span>
      )}
    </div>
  );
}
