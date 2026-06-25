import React from "react";

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

  const barStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--rs-space-2) var(--rs-space-3)",
    backgroundColor: "var(--rs-color-surface-muted)",
    border: "1px solid var(--rs-color-border)",
    borderRadius: "var(--rs-radius-sm)",
    marginBlock: "var(--rs-space-2)",
    fontSize: "var(--rs-font-size-xs)",
    flexWrap: "wrap",
    gap: "var(--rs-space-2)",
  };

  const sectionStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--rs-space-3)",
    flexWrap: "wrap",
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "var(--rs-color-surface)",
    border: "1px solid var(--rs-color-border)",
    borderRadius: "var(--rs-radius-sm)",
    padding: "var(--rs-space-1) var(--rs-space-2)",
    cursor: "pointer",
    fontSize: "var(--rs-font-size-xs)",
    fontWeight: "var(--rs-font-weight-medium)",
    color: "var(--rs-color-text)",
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--rs-space-1)",
    outline: "none",
    transition: "background-color 0.2s",
  };

  const linkStyle: React.CSSProperties = {
    color: "var(--rs-color-primary)",
    cursor: "pointer",
    textDecoration: "underline",
    fontWeight: "var(--rs-font-weight-bold)",
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--rs-space-1)",
  };

  const textPreview = originalText ? originalText.trim().replace(/\s+/g, " ") : "";
  const slicedPreview = textPreview.length > 30 ? `${textPreview.slice(0, 30)}...` : textPreview;

  return (
    <div style={barStyle} className="ws-user-control-bar">
      <div style={sectionStyle} className="ws-user-control-bar-left">
        <span style={{ color: "var(--rs-color-text-muted)" }}>
          Bản gốc: <strong>{slicedPreview || "(Trống)"}</strong>
        </span>
        {isChanged && (
          <button
            type="button"
            style={buttonStyle}
            onClick={onUndo}
            className="ws-user-control-bar-undo-btn"
            title="Khôi phục về văn bản gốc ban đầu"
          >
            ↩️ Hoàn tác (Undo)
          </button>
        )}
      </div>

      <div style={sectionStyle} className="ws-user-control-bar-right">
        {hasSuggestion && onViewDiff && (
          <span style={{ display: "flex", gap: "var(--rs-space-1)", alignItems: "center" }}>
            ✨ Có đề xuất AI đang chờ:
            <span style={linkStyle} onClick={onViewDiff} className="ws-user-control-bar-diff-btn">
              Xem khác biệt (Diff)
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
