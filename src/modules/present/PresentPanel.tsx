"use client";

import React, { useState } from "react";
import { z } from "zod";
import type { ReportProjectBundle, CheckResult, SlideOutline } from "@/types";
import { slideOutlineSchema } from "@/types";
import { usePresent } from "./use-present";
import { SlideOutlineView } from "./SlideOutlineView";
import { ScriptView } from "./ScriptView";
import { DefenseQAView } from "./DefenseQAView";
import { getGatewayState, requestSuggestion } from "@/modules/write";
import { assistOutline } from "./ai/assist-outline";
import { AiOutlineButton } from "./ai/AiOutlineButton";
import { EmptyState, SuccessState } from "@/components/states";
import { Button, Badge } from "@/components/ui";
import { List, Mic, HelpCircle, AlertTriangle, Sparkles } from "lucide-react";

export interface PresentPanelProps {
  bundle: ReportProjectBundle;
  checkResult?: CheckResult;
}

export function PresentPanel({ bundle, checkResult }: PresentPanelProps) {
  const [activeTab, setActiveTab] = useState<"outline" | "script" | "qa" | "hints">("outline");

  const {
    slides,
    speakers,
    timeline,
    scripts,
    qas,
    hints,
    limitMinutes,
    setLimitMinutes,
    handleBulletChange,
    handleSpeakerChange,
    handleAddBullet,
    handleRemoveBullet,
    handleScriptChange,
    handleAcceptAiOutline,
  } = usePresent({ bundle, checkResult });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<SlideOutline[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiOutlineAssist = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const gateway = {
        requestSuggestion,
        getGatewayState,
      };
      const suggestion = await assistOutline(slides, gateway);
      if (suggestion.suggestion) {
        try {
          const json = JSON.parse(suggestion.suggestion);
          const result = z.array(slideOutlineSchema).safeParse(json);
          if (result.success) {
            setAiSuggestion(result.data);
          } else {
            setAiError("Không thể phân tích đề xuất từ AI.");
          }
        } catch {
          setAiError("Không thể phân tích đề xuất từ AI.");
        }
      } else {
        // If empty suggestion, verify if it was a no-op due to config state
        const state = getGatewayState();
        if (state === "disabled" || state === "unconfigured") {
          setAiError("Cấu hình AI chưa kích hoạt.");
        } else {
          setAiError("AI không trả về đề xuất nào.");
        }
      }
    } catch {
      setAiError("Lỗi kết nối AI gateway.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    if (s === 0) return `${mins} phút`;
    return `${mins} phút ${s} giây`;
  };

  if (slides.length === 0) {
    return (
      <div className="ws-present" aria-label="Thuyết trình">
        <h3 className="ws-present-panel-title">Thuyết trình</h3>
        <div className="ws-state-block">
          <EmptyState
            title="Chưa thể sinh slide"
            message="Báo cáo chưa có nội dung hoặc chỉ có các chương rỗng. Vui lòng thêm nội dung vào báo cáo để sinh slide thuyết trình tự động."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ws-present" aria-label="Thuyết trình">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--rs-space-4)", gap: "var(--rs-space-2)" }}>
        <h3 className="ws-present-panel-title" style={{ margin: 0 }}>Thuyết trình</h3>
        <Button
          disabled
          variant="secondary"
          size="sm"
          leadingIcon={
            <svg className="ws-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          title="Tính năng xuất PowerPoint (PPTX) hiện tại đang tạm hoãn (cần bật Phase 3)"
        >
          Xuất PPTX (Phase 3)
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="ws-present-tabs">
        <button
          className={`ws-present-tab-btn ${activeTab === "outline" ? "active" : ""}`}
          onClick={() => setActiveTab("outline")}
        >
          <List size={14} style={{ marginRight: "var(--rs-space-1)" }} /> Slides Outline
        </button>
        <button
          className={`ws-present-tab-btn ${activeTab === "script" ? "active" : ""}`}
          onClick={() => setActiveTab("script")}
        >
          <Mic size={14} style={{ marginRight: "var(--rs-space-1)" }} /> Kịch bản nói
        </button>
        <button
          className={`ws-present-tab-btn ${activeTab === "qa" ? "active" : ""}`}
          onClick={() => setActiveTab("qa")}
        >
          <HelpCircle size={14} style={{ marginRight: "var(--rs-space-1)" }} /> Hỏi đáp phản biện
        </button>
        <button
          className={`ws-present-tab-btn ${activeTab === "hints" ? "active" : ""}`}
          onClick={() => setActiveTab("hints")}
        >
          <AlertTriangle size={14} style={{ marginRight: "var(--rs-space-1)" }} /> Gợi ý sửa lỗi
          {hints.length > 0 && (
            <span className="ws-present-badge-count">{hints.length}</span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "outline" && (
        <div className="ws-present-tab-content">
          <div className="ws-present-timeline-summary">
            <div className="ws-present-duration">
              <strong>Tổng thời lượng:</strong> {formatTime(timeline.totalSeconds)}
            </div>

            <div className="ws-present-limit-selector">
              <label htmlFor="ws-timeline-limit-input" className="ws-present-limit-label">
                Giới hạn (phút):
              </label>
              <input
                id="ws-timeline-limit-input"
                type="number"
                min={1}
                max={120}
                value={limitMinutes}
                onChange={(e) => setLimitMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="ws-present-limit-input"
              />
            </div>

            {timeline.overLimit && (
              <div className="ws-present-timeline-badge overlimit" role="alert">
                <AlertTriangle size={12} /> Vượt giới hạn (Tối đa {limitMinutes} phút)
              </div>
            )}
          </div>

          <div className="ws-present-ai-controls">
            <AiOutlineButton
              state={getGatewayState()}
              isLoading={isAiLoading}
              onClick={handleAiOutlineAssist}
            />
            {aiError && (
              <span className="ws-present-ai-error">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--rs-space-1)" }}><AlertTriangle size={12} /> {aiError}</span>
              </span>
            )}
          </div>

          {aiSuggestion && (
            <div className="ws-present-ai-suggestion-box">
              <h4 className="ws-present-ai-suggestion-title">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--rs-space-1)" }}><Sparkles size={16} /> Đề xuất tối ưu Slide Outline từ AI</span>
              </h4>
              <p className="ws-present-ai-suggestion-desc">
                AI đề xuất cập nhật các slide bên dưới. Vui lòng duyệt qua trước khi áp dụng.
              </p>

              <div className="ws-present-ai-suggestion-actions" style={{ display: "flex", gap: "var(--rs-space-2)", marginTop: "var(--rs-space-2)" }}>
                <Button
                  onClick={() => {
                    handleAcceptAiOutline(aiSuggestion);
                    setAiSuggestion(null);
                  }}
                  variant="primary"
                  size="sm"
                  className="ws-present-ai-accept-btn"
                >
                  Áp dụng đề xuất
                </Button>
                <Button
                  onClick={() => setAiSuggestion(null)}
                  variant="ghost"
                  size="sm"
                  className="ws-present-ai-reject-btn"
                >
                  Từ chối
                </Button>
              </div>

              <div className="ws-present-ai-suggestion-preview-list">
                {aiSuggestion.map((s, idx) => {
                  const original = slides.find((orig) => orig.id === s.id);
                  const isTitleChanged = original && original.title !== s.title;
                  const isBulletsChanged = original && JSON.stringify(original.bullets) !== JSON.stringify(s.bullets);

                  if (!original) return null;

                  return (
                    <div key={s.id} className="ws-present-ai-suggestion-preview-item">
                      <div className="ws-present-ai-suggestion-preview-item-title">
                        Slide {idx + 1}: {isTitleChanged ? (
                          <>
                            <span className="ws-present-ai-suggestion-preview-item-original-title">{original.title}</span>
                            {" → "}
                            <span className="ws-present-ai-suggestion-preview-item-new-title">{s.title}</span>
                          </>
                        ) : s.title}
                      </div>

                      <div className="ws-present-ai-suggestion-bullets-container">
                        {isBulletsChanged ? (
                          <div className="ws-present-ai-suggestion-bullets-diff">
                            <div className="ws-present-ai-suggestion-bullets-label-original">Gốc:</div>
                            <ul className="ws-present-ai-suggestion-bullets-list-original">
                              {original.bullets.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                            <div className="ws-present-ai-suggestion-bullets-label-new">AI đề xuất:</div>
                            <ul className="ws-present-ai-suggestion-bullets-list-new">
                              {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                          </div>
                        ) : (
                          <ul className="ws-present-ai-suggestion-bullets-list-same">
                            {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="ws-present-slides-list">
            {slides.map((slide) => (
              <SlideOutlineView
                key={slide.id}
                slide={slide}
                speakers={speakers}
                onBulletChange={(idx, val) => handleBulletChange(slide.id, idx, val)}
                onSpeakerChange={(spId) => handleSpeakerChange(slide.id, spId)}
                onAddBullet={() => handleAddBullet(slide.id)}
                onRemoveBullet={(idx) => handleRemoveBullet(slide.id, idx)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "script" && (
        <div className="ws-present-tab-content">
          <ScriptView
            scripts={scripts}
            slides={slides}
            speakers={speakers}
            onScriptChange={handleScriptChange}
          />
        </div>
      )}

      {activeTab === "qa" && (
        <div className="ws-present-tab-content">
          <DefenseQAView qas={qas} sections={bundle.project.sections} />
        </div>
      )}

      {activeTab === "hints" && (
        <div className="ws-present-tab-content">
          <div className="ws-present-hints-view">
            <h4 className="ws-present-view-title">Các phần cần hoàn thiện (Weak Sections)</h4>
            {hints.length === 0 ? (
              <div className="ws-state-block">
                <SuccessState
                  title="Không có phần yếu kém"
                  message="Tuyệt vời! Không tìm thấy vấn đề yếu kém nào cần khắc phục trong các slide/section hiện tại."
                />
              </div>
            ) : (
              <div className="ws-present-hints-list">
                {hints.map((hint, idx) => (
                  <div key={idx} className={`ws-present-hint-item severity-${hint.severity}`}>
                    <div className="ws-present-hint-header">
                      <Badge
                        group="severity"
                        value={hint.severity}
                        label={hint.severity === "error" ? "Lỗi nặng" : undefined}
                      />
                      {hint.slideId && (
                        <span className="ws-present-hint-slide-link">
                          Trỏ tới slide: <strong>{slides.find((s) => s.id === hint.slideId)?.title ?? hint.slideId}</strong>
                        </span>
                      )}
                    </div>
                    <div className="ws-present-hint-body">
                      <div className="ws-present-hint-reason">
                        <strong>Lý do: </strong> {hint.reason}
                      </div>
                      <div className="ws-present-hint-suggestion">
                        <strong>Đề xuất khắc phục: </strong> {hint.suggestion}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
