import React from "react";
import { RotateCcw, Sparkles } from "lucide-react";

export interface UserControlBarProps {
  originalText: string;
  currentText: string;
  onUndo: () => void;
  onViewDiff?: () => void;
  hasSuggestion?: boolean;
}

export function UserControlBar({
  originalText,
  currentText,
  onUndo,
  onViewDiff,
  hasSuggestion = false,
}: UserControlBarProps) {
  const isChanged = originalText !== currentText;

  const textPreview = originalText ? originalText.trim().replace(/\s+/g, " ") : "";
  const slicedPreview = textPreview.length > 30 ? `${textPreview.slice(0, 30)}...` : textPreview;

  return (
    <div className="ws-user-control-bar">
      <div className="ws-user-control-bar-left">
        <span className="ws-user-control-bar-label">
          Bản gốc: <strong>{slicedPreview || "(Trống)"}</strong>
        </span>
        {isChanged && (
          <button
            type="button"
            onClick={onUndo}
            className="ws-user-control-bar-undo-btn"
            title="Khôi phục về văn bản gốc ban đầu"
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><RotateCcw size={12} /> Hoàn tác (Undo)</span>
          </button>
        )}
      </div>

      <div className="ws-user-control-bar-right">
        {hasSuggestion && onViewDiff && (
          <span className="ws-user-control-bar-suggestion-label" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={12} /> Có đề xuất AI đang chờ:
            <button
              type="button"
              onClick={onViewDiff}
              className="ws-user-control-bar-diff-btn"
            >
              Xem khác biệt (Diff)
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
