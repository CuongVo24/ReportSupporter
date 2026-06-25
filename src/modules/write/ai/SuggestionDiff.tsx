import React from "react";
import type { AiAction } from "@/types";

export interface SuggestionDiffProps {
  original: string;
  suggestion: string;
  onAccept: (suggestion: string) => void;
  onReject: () => void;
  title?: string;
  action?: AiAction;
}

export function SuggestionDiff({
  original,
  suggestion,
  onAccept,
  onReject,
  title = "So sánh đề xuất thay đổi",
  action,
}: SuggestionDiffProps) {
  const displayTitle = action === "tone"
    ? "Cải thiện văn phong học thuật"
    : (action === "rewrite" ? "So sánh đề xuất viết lại" : title);

  const canAccept = suggestion.trim().length > 0 && suggestion !== original;

  return (
    <div className="ws-suggestion-diff-container">
      <div className="ws-suggestion-diff-header">
        <h4 className="ws-suggestion-diff-title">{displayTitle}</h4>
      </div>

      <div className="ws-suggestion-diff-grid">
        <div className="ws-suggestion-diff-column-original">
          <h5 className="ws-suggestion-diff-column-title-original">VĂN BẢN GỐC</h5>
          <pre className="ws-suggestion-diff-text">{original || "(Trống)"}</pre>
        </div>

        <div className="ws-suggestion-diff-column-suggestion">
          <h5 className="ws-suggestion-diff-column-title-suggestion">ĐỀ XUẤT CỦA AI</h5>
          <pre className="ws-suggestion-diff-text">{suggestion || "(AI không trả về kết quả)"}</pre>
        </div>
      </div>

      <div className="ws-suggestion-diff-actions">
        <button
          type="button"
          disabled={!canAccept}
          onClick={() => canAccept && onAccept(suggestion)}
          className="ws-suggestion-diff-accept-btn"
        >
          Áp dụng đề xuất
        </button>
        <button
          type="button"
          onClick={onReject}
          className="ws-suggestion-diff-reject-btn"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  );
}
