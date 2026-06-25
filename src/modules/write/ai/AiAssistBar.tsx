import React, { useState, useEffect } from "react";
import type { ReportSection, AiSuggestion } from "@/types";
import {
  getGatewayState,
  requestSuggestion,
  rewriteSection,
  improveTone,
  SuggestionDiff,
  UserControlBar,
} from "@/modules/write";

interface AiAssistBarProps {
  section: ReportSection;
  onChange: (newText: string) => void;
}

export function AiAssistBar({ section, onChange }: AiAssistBarProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [originalText, setOriginalText] = useState(section.markdown);
  const [loadingAction, setLoadingAction] = useState<"rewrite" | "tone" | null>(null);

  // Reset states and set new original text when the user switches sections
  useEffect(() => {
    setOriginalText(section.markdown);
    setAiSuggestion(null);
    setAiError(null);
    setShowDiff(false);
    setLoadingAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  const state = getGatewayState();
  const isDisabled = state === "disabled" || state === "unconfigured";

  const gateway = {
    requestSuggestion,
    getGatewayState,
  };

  const handleRewrite = async () => {
    setIsAiLoading(true);
    setLoadingAction("rewrite");
    setAiError(null);
    try {
      const suggestion = await rewriteSection(section, gateway);
      if (suggestion.suggestion) {
        setAiSuggestion(suggestion);
        setShowDiff(true);
      } else {
        setAiError("AI không trả về kết quả.");
      }
    } catch {
      setAiError("Lỗi kết nối AI gateway.");
    } finally {
      setIsAiLoading(false);
      setLoadingAction(null);
    }
  };

  const handleTone = async () => {
    setIsAiLoading(true);
    setLoadingAction("tone");
    setAiError(null);
    try {
      const suggestion = await improveTone(section.markdown, gateway);
      if (suggestion.suggestion) {
        setAiSuggestion(suggestion);
        setShowDiff(true);
      } else {
        setAiError("AI không trả về kết quả.");
      }
    } catch {
      setAiError("Lỗi kết nối AI gateway.");
    } finally {
      setIsAiLoading(false);
      setLoadingAction(null);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--rs-space-2)",
    padding: "var(--rs-space-3)",
    backgroundColor: "var(--rs-color-surface)",
    border: "1px solid var(--rs-color-border)",
    borderRadius: "var(--rs-radius-md)",
    marginBottom: "var(--rs-space-2)",
  };

  const buttonsRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--rs-space-2)",
    flexWrap: "wrap",
  };

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    backgroundColor: disabled ? "var(--rs-color-surface-muted)" : "var(--rs-color-primary)",
    color: disabled ? "var(--rs-color-text-muted)" : "var(--rs-white)",
    border: "1px solid var(--rs-color-border)",
    borderRadius: "var(--rs-radius-sm)",
    padding: "var(--rs-space-1) var(--rs-space-3)",
    fontSize: "var(--rs-font-size-xs)",
    fontWeight: "var(--rs-font-weight-medium)",
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    transition: "background-color 0.2s",
  });

  return (
    <div style={containerStyle} className="ws-ai-assist-bar-container">
      <div style={buttonsRowStyle} className="ws-ai-assist-buttons-row">
        <button
          type="button"
          disabled={isDisabled || isAiLoading}
          style={btnStyle(isDisabled || isAiLoading)}
          onClick={handleRewrite}
          className="ws-ai-rewrite-btn"
        >
          {isAiLoading && loadingAction === "rewrite" ? "⏳ Đang viết lại..." : "✨ Viết lại đoạn (AI)"}
        </button>

        <button
          type="button"
          disabled={isDisabled || isAiLoading}
          style={btnStyle(isDisabled || isAiLoading)}
          onClick={handleTone}
          className="ws-ai-tone-btn"
        >
          {isAiLoading && loadingAction === "tone" ? "⏳ Đang cải thiện..." : "✨ Cải thiện văn phong (AI)"}
        </button>

        {isDisabled && (
          <span style={{ fontSize: "var(--rs-font-size-xs)", color: "var(--rs-color-severity-warning)" }} className="ws-ai-assist-note">
            ⚠️ Bật AI trong cấu hình
          </span>
        )}

        {aiError && (
          <span style={{ fontSize: "var(--rs-font-size-xs)", color: "var(--rs-color-severity-error)" }} className="ws-ai-assist-error">
            ⚠️ {aiError}
          </span>
        )}
      </div>

      <UserControlBar
        originalText={originalText}
        currentText={section.markdown}
        onUndo={() => onChange(originalText)}
        onViewDiff={aiSuggestion ? () => setShowDiff(true) : undefined}
        hasSuggestion={!!(aiSuggestion && aiSuggestion.suggestion)}
      />

      {showDiff && aiSuggestion && (
        <SuggestionDiff
          original={aiSuggestion.original}
          suggestion={aiSuggestion.suggestion}
          action={aiSuggestion.action}
          onAccept={(newVal) => {
            onChange(newVal);
            setAiSuggestion(null);
            setShowDiff(false);
          }}
          onReject={() => {
            setShowDiff(false);
          }}
        />
      )}
    </div>
  );
}
