"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import type { ReportSection } from "@/types";
import { getGatewayState, requestSuggestion } from "./ai-gateway";
import { SuggestionDiff } from "./SuggestionDiff";
import {
  suggestWholeReportSections,
  type SectionAiSuggestion,
  type WholeReportAiAction,
} from "./whole-report-ai";

type AiWholeReportPanelProps = {
  sections: ReportSection[];
  onApplySection: (sectionId: string, markdown: string) => void;
  onOpenSettings?: () => void;
};

const LONG_REPORT_CHAR_THRESHOLD = 12000;

function actionLabel(action: WholeReportAiAction): string {
  return action === "translate" ? "dịch" : "chuẩn hóa thuật ngữ";
}

export function AiWholeReportPanel({
  sections,
  onApplySection,
  onOpenSettings,
}: AiWholeReportPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState<WholeReportAiAction | null>(null);
  const [suggestions, setSuggestions] = useState<SectionAiSuggestion[]>([]);
  const [error, setError] = useState("");

  const state = getGatewayState();
  const isDisabled = state === "disabled" || state === "unconfigured";

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections],
  );

  const totalChars = useMemo(
    () => sortedSections.reduce((sum, section) => sum + section.markdown.length, 0),
    [sortedSections],
  );

  const hasLongReport = totalChars > LONG_REPORT_CHAR_THRESHOLD;
  const nonEmptyCount = sortedSections.filter((section) => section.markdown.trim()).length;

  const gateway = {
    requestSuggestion,
    getGatewayState,
  };

  const handleRun = async (action: WholeReportAiAction) => {
    if (isDisabled) {
      setError("Bật AI trong Cài đặt trước khi chạy trên toàn báo cáo.");
      return;
    }

    if (nonEmptyCount === 0) {
      setError("Báo cáo chưa có nội dung để xử lý.");
      return;
    }

    setIsRunning(true);
    setRunningAction(action);
    setError("");
    setSuggestions([]);

    try {
      const nextSuggestions = await suggestWholeReportSections(sortedSections, action, gateway);
      setSuggestions(nextSuggestions);
      if (nextSuggestions.length === 0) {
        setError("AI không trả về thay đổi nào khác nội dung hiện tại.");
      }
    } catch {
      setError("Lỗi kết nối AI gateway khi xử lý toàn báo cáo.");
    } finally {
      setIsRunning(false);
      setRunningAction(null);
    }
  };

  const removeSuggestion = (sectionId: string) => {
    setSuggestions((current) => current.filter((item) => item.sectionId !== sectionId));
  };

  return (
    <section className="ws-ai-whole-panel" aria-label="AI toàn báo cáo">
      <div className="ws-ai-whole-header">
        <div className="ws-ai-whole-title-row">
          <Sparkles size={14} aria-hidden="true" />
          <span className="ws-ai-whole-title">AI toàn báo cáo</span>
        </div>
        <span className="ws-ai-whole-meta">{nonEmptyCount} mục có nội dung</span>
      </div>

      <p className="ws-ai-whole-privacy">
        Chỉ chạy khi bạn chủ động bấm. Nội dung các mục sẽ được gửi qua provider AI đã cấu hình.
      </p>

      {hasLongReport && (
        <div className="ws-ai-whole-warning" role="status">
          <AlertTriangle size={14} aria-hidden="true" />
          Báo cáo dài, thao tác này có thể tốn token và mất thêm thời gian.
        </div>
      )}

      <div className="ws-ai-whole-actions">
        <button
          type="button"
          className="ws-ai-whole-action"
          disabled={isDisabled || isRunning}
          onClick={() => void handleRun("translate")}
        >
          {isRunning && runningAction === "translate" ? "Đang dịch..." : "Dịch Anh/Việt"}
        </button>
        <button
          type="button"
          className="ws-ai-whole-action"
          disabled={isDisabled || isRunning}
          onClick={() => void handleRun("terminology")}
        >
          {isRunning && runningAction === "terminology" ? "Đang chuẩn hóa..." : "Chuẩn thuật ngữ"}
        </button>
        {isDisabled && (
          <button
            type="button"
            className="ws-ai-whole-settings"
            onClick={onOpenSettings}
          >
            Bật AI
          </button>
        )}
      </div>

      {error && (
        <div className="ws-ai-whole-error" role="alert">
          <AlertTriangle size={14} aria-hidden="true" />
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="ws-ai-whole-results">
          <div className="ws-ai-whole-results-header">
            {suggestions.length} đề xuất {actionLabel(suggestions[0].suggestion.action as WholeReportAiAction)} đang chờ duyệt
          </div>
          {suggestions.map((item) => (
            <article className="ws-ai-whole-result-card" key={item.sectionId}>
              <h4 className="ws-ai-whole-section-title">{item.sectionTitle}</h4>
              <SuggestionDiff
                original={item.suggestion.original}
                suggestion={item.suggestion.suggestion}
                action={item.suggestion.action}
                onAccept={(markdown) => {
                  onApplySection(item.sectionId, markdown);
                  removeSuggestion(item.sectionId);
                }}
                onReject={() => removeSuggestion(item.sectionId)}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
