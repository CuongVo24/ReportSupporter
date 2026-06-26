import React, { useState, useEffect } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
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
  // originalText is only set right before an AI request, not on section open.
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"rewrite" | "tone" | null>(null);

  // Reset AI states when the user switches sections
  useEffect(() => {
    setOriginalText(null);
    setAiSuggestion(null);
    setAiError(null);
    setShowDiff(false);
    setLoadingAction(null);
  }, [section.id]);

  const state = getGatewayState();
  const isDisabled = state === "disabled" || state === "unconfigured";

  const gateway = {
    requestSuggestion,
    getGatewayState,
  };

  const handleRewrite = async () => {
    setOriginalText(section.markdown); // snapshot right before request
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
    setOriginalText(section.markdown); // snapshot right before request
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

  // UserControlBar only shown when an AI interaction has occurred (originalText set)
  const showControlBar = originalText !== null;

  return (
    <div className="ws-ai-assist-bar-container">
      <div className="ws-ai-assist-buttons-row">
        <button
          type="button"
          disabled={isDisabled || isAiLoading}
          onClick={handleRewrite}
          className="ws-ai-rewrite-btn"
          title={isDisabled ? "Vui lòng bật AI trong Cài đặt để sử dụng" : "Viết lại đoạn văn bằng AI"}
        >
          {isAiLoading && loadingAction === "rewrite" ? "Đang viết lại..." : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Sparkles size={12} /> Viết lại đoạn (AI)
            </span>
          )}
        </button>

        <button
          type="button"
          disabled={isDisabled || isAiLoading}
          onClick={handleTone}
          className="ws-ai-tone-btn"
          title={isDisabled ? "Vui lòng bật AI trong Cài đặt để sử dụng" : "Cải thiện văn phong bằng AI"}
        >
          {isAiLoading && loadingAction === "tone" ? "Đang cải thiện..." : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Sparkles size={12} /> Cải thiện văn phong (AI)
            </span>
          )}
        </button>

        {isDisabled && (
          <span className="ws-ai-assist-note" style={{ display: "inline-flex", alignItems: "center", gap: 4 }} title="Vui lòng bật AI trong Cài đặt để sử dụng">
            <AlertTriangle size={12} style={{ color: "var(--rs-color-severity-warning)" }} /> Bật AI trong Cài đặt
          </span>
        )}

        {aiError && (
          <span className="ws-ai-assist-error" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <AlertTriangle size={12} style={{ color: "var(--rs-color-severity-error)" }} /> {aiError}
          </span>
        )}
      </div>

      {showControlBar && (
        <UserControlBar
          originalText={originalText}
          currentText={section.markdown}
          onUndo={() => onChange(originalText)}
          onViewDiff={aiSuggestion ? () => setShowDiff(true) : undefined}
          hasSuggestion={!!(aiSuggestion && aiSuggestion.suggestion)}
        />
      )}

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

