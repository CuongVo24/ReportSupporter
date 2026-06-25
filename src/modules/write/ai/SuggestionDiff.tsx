import React from "react";

export interface SuggestionDiffProps {
  original: string;
  suggestion: string;
  onAccept: (suggestion: string) => void;
  onReject: () => void;
  title?: string;
}

export function SuggestionDiff({
  original,
  suggestion,
  onAccept,
  onReject,
  title = "So sánh đề xuất thay đổi",
}: SuggestionDiffProps) {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--rs-space-3)",
    padding: "var(--rs-space-4)",
    backgroundColor: "var(--rs-color-surface-muted)",
    border: "1px solid var(--rs-color-border)",
    borderRadius: "var(--rs-radius-md)",
    marginBlock: "var(--rs-space-3)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--rs-color-border)",
    paddingBottom: "var(--rs-space-2)",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "var(--rs-font-size-md)",
    fontWeight: "var(--rs-font-weight-bold)",
    color: "var(--rs-color-primary)",
  };

  const diffContainerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--rs-space-3)",
  };

  const columnStyle = (isSuggestion: boolean): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    gap: "var(--rs-space-2)",
    padding: "var(--rs-space-3)",
    borderRadius: "var(--rs-radius-sm)",
    border: `1px solid ${isSuggestion ? "var(--rs-color-success)" : "var(--rs-color-severity-error)"}`,
    backgroundColor: isSuggestion ? "rgba(22, 163, 74, 0.05)" : "rgba(220, 38, 38, 0.05)",
  });

  const columnTitleStyle = (isSuggestion: boolean): React.CSSProperties => ({
    margin: 0,
    fontSize: "var(--rs-font-size-xs)",
    fontWeight: "var(--rs-font-weight-bold)",
    color: isSuggestion ? "var(--rs-color-success)" : "var(--rs-color-severity-error)",
  });

  const textStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "var(--rs-font-size-sm)",
    fontFamily: "var(--rs-font-family-ui)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: "var(--rs-color-text)",
    lineHeight: "var(--rs-font-lh-ui)",
  };

  const actionStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--rs-space-2)",
    marginTop: "var(--rs-space-1)",
  };

  const acceptBtnStyle: React.CSSProperties = {
    backgroundColor: "var(--rs-color-primary)",
    color: "var(--rs-white)",
    border: "none",
    borderRadius: "var(--rs-radius-sm)",
    padding: "var(--rs-space-2) var(--rs-space-4)",
    fontSize: "var(--rs-font-size-sm)",
    fontWeight: "var(--rs-font-weight-bold)",
    cursor: "pointer",
    transition: "background-color 0.2s",
  };

  const rejectBtnStyle: React.CSSProperties = {
    backgroundColor: "var(--rs-color-surface)",
    color: "var(--rs-color-text)",
    border: "1px solid var(--rs-color-border)",
    borderRadius: "var(--rs-radius-sm)",
    padding: "var(--rs-space-2) var(--rs-space-4)",
    fontSize: "var(--rs-font-size-sm)",
    cursor: "pointer",
    transition: "background-color 0.2s",
  };

  return (
    <div style={containerStyle} className="ws-suggestion-diff-container">
      <div style={headerStyle} className="ws-suggestion-diff-header">
        <h4 style={titleStyle}>{title}</h4>
      </div>

      <div style={diffContainerStyle} className="ws-suggestion-diff-grid">
        <div style={columnStyle(false)} className="ws-suggestion-diff-column-original">
          <h5 style={columnTitleStyle(false)}>VĂN BẢN GỐC</h5>
          <pre style={textStyle}>{original || "(Trống)"}</pre>
        </div>

        <div style={columnStyle(true)} className="ws-suggestion-diff-column-suggestion">
          <h5 style={columnTitleStyle(true)}>ĐỀ XUẤT CỦA AI</h5>
          <pre style={textStyle}>{suggestion || "(AI không trả về kết quả)"}</pre>
        </div>
      </div>

      <div style={actionStyle} className="ws-suggestion-diff-actions">
        <button
          type="button"
          style={acceptBtnStyle}
          onClick={() => onAccept(suggestion)}
          className="ws-suggestion-diff-accept-btn"
        >
          Áp dụng đề xuất
        </button>
        <button
          type="button"
          style={rejectBtnStyle}
          onClick={onReject}
          className="ws-suggestion-diff-reject-btn"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  );
}
