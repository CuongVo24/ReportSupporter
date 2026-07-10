import React, { useState, useEffect, useRef } from "react";
import { Sparkles, AlertTriangle, ChevronDown } from "lucide-react";
import type { ReportSection, AiSuggestion } from "@/types";
import {
  getGatewayState,
  requestSuggestion,
  rewriteSection,
  improveTone,
  translateSection,
  improveTerminology,
  SuggestionDiff,
  UserControlBar,
} from "@/modules/write";

interface AiAssistBarProps {
  section: ReportSection;
  onChange: (newText: string) => void;
  onOpenSettings?: () => void;
}

export function AiAssistBar({ section, onChange, onOpenSettings }: AiAssistBarProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  // originalText is only set right before an AI request, not on section open.
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"rewrite" | "tone" | "translate" | "terminology" | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset AI states when the user switches sections
  useEffect(() => {
    setOriginalText(null);
    setAiSuggestion(null);
    setAiError(null);
    setShowDiff(false);
    setLoadingAction(null);
    setIsDropdownOpen(false);
  }, [section.id]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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

  const handleTranslate = async () => {
    setOriginalText(section.markdown);
    setIsAiLoading(true);
    setLoadingAction("translate");
    setAiError(null);
    try {
      const suggestion = await translateSection(section, gateway);
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

  const handleTerminology = async () => {
    setOriginalText(section.markdown);
    setIsAiLoading(true);
    setLoadingAction("terminology");
    setAiError(null);
    try {
      const suggestion = await improveTerminology(section.markdown, gateway);
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

  const getTriggerLabel = () => {
    if (isAiLoading) {
      if (loadingAction === "rewrite") return "Đang viết lại...";
      if (loadingAction === "tone") return "Đang cải thiện...";
      if (loadingAction === "translate") return "Đang dịch...";
      if (loadingAction === "terminology") return "Đang chuẩn hóa...";
      return "Đang xử lý...";
    }
    return "Trợ lý AI";
  };

  // UserControlBar only shown when an AI interaction has occurred (originalText set)
  const showControlBar = originalText !== null;

  return (
    <div className="ws-ai-assist-bar-container">
      <div className="ws-ai-assist-buttons-row">
        <div className="ws-ai-dropdown-container" ref={dropdownRef}>
          <button
            type="button"
            disabled={isDisabled || isAiLoading}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="ws-ai-dropdown-trigger"
            title={isDisabled ? "Vui lòng bật AI trong Cài đặt để sử dụng" : "Mở các tác vụ Trợ lý AI"}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <Sparkles size={12} aria-hidden="true" />
            <span>{getTriggerLabel()}</span>
            <ChevronDown size={12} aria-hidden="true" />
          </button>
          
          {isDropdownOpen && !isAiLoading && (
            <div className="ws-ai-dropdown-menu" role="listbox">
              <button
                type="button"
                onClick={() => {
                  handleRewrite();
                  setIsDropdownOpen(false);
                }}
                role="option"
                aria-selected="false"
              >
                <Sparkles size={12} aria-hidden="true" /> Viết lại đoạn (AI)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTone();
                  setIsDropdownOpen(false);
                }}
                role="option"
                aria-selected="false"
              >
                <Sparkles size={12} aria-hidden="true" /> Cải thiện văn phong (AI)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTranslate();
                  setIsDropdownOpen(false);
                }}
                role="option"
                aria-selected="false"
              >
                <Sparkles size={12} aria-hidden="true" /> Dịch Anh/Việt (AI)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTerminology();
                  setIsDropdownOpen(false);
                }}
                role="option"
                aria-selected="false"
              >
                <Sparkles size={12} aria-hidden="true" /> Chuẩn thuật ngữ (AI)
              </button>
            </div>
          )}
        </div>

        {isDisabled && (
          <button
            type="button"
            className="ws-ai-assist-note rs-state-warning-btn"
            onClick={onOpenSettings}
            title="Vui lòng bật AI trong Cài đặt để sử dụng"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "var(--rs-radius-sm)",
              color: "var(--rs-color-severity-warning)",
              fontSize: "var(--rs-font-size-xs)",
              fontWeight: "var(--rs-font-weight-medium)",
              textDecoration: "underline",
            }}
          >
            <AlertTriangle size={12} aria-hidden="true" /> Bật AI trong Cài đặt
          </button>
        )}

        {aiError && (
          <span className="ws-ai-assist-error">
            <AlertTriangle size={12} aria-hidden="true" /> {aiError}
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

