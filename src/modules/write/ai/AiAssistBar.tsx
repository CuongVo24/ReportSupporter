import React, { useState, useEffect, useRef } from "react";
import { Sparkles, AlertTriangle, ChevronDown } from "lucide-react";
import type { AiAction, AiRequestOptions, ReportSection, AiSuggestion } from "@/types";
import { contentHash } from "@/lib/content-hash";
import { getGatewayState, requestSuggestion } from "./ai-gateway";
import { rewriteSection } from "./rewrite-section";
import { improveTone } from "./improve-tone";
import { translateSection } from "./translate-section";
import { improveTerminology } from "./improve-terminology";
import { SuggestionDiff } from "./SuggestionDiff";
import { UserControlBar } from "./UserControlBar";

interface AiAssistBarProps {
  projectId: string;
  section: ReportSection;
  onChange: (newText: string) => void;
  onBeforeApply?: () => Promise<void>;
  onOpenSettings?: () => void;
}

type LoadingAction = Extract<AiAction, "rewrite" | "tone" | "translate" | "terminology">;

export function AiAssistBar({ projectId, section, onChange, onBeforeApply, onOpenSettings }: AiAssistBarProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  // originalText is only set right before an AI request, not on section open.
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);
  const [staleReason, setStaleReason] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const latestSectionRef = useRef(section);
  const activeRequestRef = useRef<{ requestId: string; controller: AbortController } | null>(null);

  latestSectionRef.current = section;

  // Reset AI states when the user switches sections
  useEffect(() => {
    activeRequestRef.current?.controller.abort();
    activeRequestRef.current = null;
    setOriginalText(null);
    setAiSuggestion(null);
    setAiError(null);
    setShowDiff(false);
    setLoadingAction(null);
    setIsAiLoading(false);
    setStaleReason(null);
    setIsDropdownOpen(false);
  }, [section.id]);

  useEffect(() => () => activeRequestRef.current?.controller.abort(), []);

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
  const tooltipMessage = state === "disabled"
    ? "Vui lòng bật AI trong Cài đặt để sử dụng"
    : "AI đã bật — thêm khóa API trong Cài đặt để sử dụng";
  const buttonText = state === "disabled" ? "Bật AI trong Cài đặt" : "Cài đặt khóa API";

  const gateway = {
    requestSuggestion,
    getGatewayState,
  };

  const runAction = async (
    action: LoadingAction,
    request: (options: AiRequestOptions) => Promise<AiSuggestion>,
  ) => {
    activeRequestRef.current?.controller.abort();

    const baseSection = section;
    const requestId = crypto.randomUUID();
    const controller = new AbortController();
    const baseHash = contentHash(baseSection.markdown);
    activeRequestRef.current = { requestId, controller };

    setOriginalText(baseSection.markdown);
    setIsAiLoading(true);
    setLoadingAction(action);
    setAiError(null);
    setAiSuggestion(null);
    setShowDiff(false);
    setStaleReason(null);

    try {
      const suggestion = await request({
        signal: controller.signal,
        requestId,
        context: {
          projectId,
          sectionId: baseSection.id,
          revision: baseSection.revision,
          contentHash: baseHash,
        },
      });

      if (activeRequestRef.current?.requestId !== requestId) return;
      const current = latestSectionRef.current;
      if (current.id !== baseSection.id) return;

      if (!suggestion.suggestion) {
        setAiError("AI không trả về kết quả.");
        return;
      }

      const stale = current.revision !== baseSection.revision || contentHash(current.markdown) !== baseHash;
      setAiSuggestion(suggestion);
      setStaleReason(stale
        ? "Nội dung đã thay đổi trong khi AI xử lý. Đề xuất này không thể áp dụng; hãy tạo lại từ bản hiện tại."
        : null);
      setShowDiff(true);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAiError("Lỗi kết nối AI gateway.");
    } finally {
      if (activeRequestRef.current?.requestId === requestId) {
        activeRequestRef.current = null;
        setIsAiLoading(false);
        setLoadingAction(null);
      }
    }
  };

  const handleRewrite = () => runAction("rewrite", (options) => rewriteSection(section, gateway, options));
  const handleTone = () => runAction("tone", (options) => improveTone(section.markdown, gateway, options));
  const handleTranslate = () => runAction("translate", (options) => translateSection(section, gateway, options));
  const handleTerminology = () => runAction("terminology", (options) => improveTerminology(section.markdown, gateway, options));

  const regenerate = () => {
    const action = aiSuggestion?.action;
    if (action === "rewrite") void handleRewrite();
    if (action === "tone") void handleTone();
    if (action === "translate") void handleTranslate();
    if (action === "terminology") void handleTerminology();
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
  const showControlBar = originalText !== null && staleReason === null;

  return (
    <div className="ws-ai-assist-bar-container">
      <div className="ws-ai-assist-buttons-row">
        <div className="ws-ai-dropdown-container" ref={dropdownRef}>
          <button
            type="button"
            disabled={isDisabled || isAiLoading}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="ws-ai-dropdown-trigger"
            title={isDisabled ? tooltipMessage : "Mở các tác vụ Trợ lý AI"}
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
            title={tooltipMessage}
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
            <AlertTriangle size={12} aria-hidden="true" /> {buttonText}
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
          acceptDisabled={staleReason !== null}
          disabledReason={staleReason ?? undefined}
          onRegenerate={staleReason ? regenerate : undefined}
          onAccept={async (newVal) => {
            const current = latestSectionRef.current;
            const isStillCurrent =
              current.id === aiSuggestion.sectionId &&
              current.revision === aiSuggestion.baseRevision &&
              contentHash(current.markdown) === aiSuggestion.baseHash;
            if (!isStillCurrent) {
              setStaleReason("Nội dung đã thay đổi. Hãy tạo lại đề xuất trước khi áp dụng.");
              return;
            }
            try {
              await onBeforeApply?.();
            } catch {
              setAiError("Không thể tạo bản lưu an toàn nên đề xuất chưa được áp dụng.");
              return;
            }
            onChange(newVal);
            setAiSuggestion(null);
            setShowDiff(false);
            setStaleReason(null);
          }}
          onReject={() => {
            setShowDiff(false);
            setAiSuggestion(null);
            setStaleReason(null);
          }}
        />
      )}
    </div>
  );
}

