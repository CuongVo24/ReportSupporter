"use client";

import React, { useState } from "react";
import type { ReportProjectBundle, CheckResult, SlideOutline } from "@/types";
import { usePresent } from "./use-present";
import { SlideOutlineView } from "./SlideOutlineView";
import { ScriptView } from "./ScriptView";
import { DefenseQAView } from "./DefenseQAView";
import { getGatewayState, requestSuggestion } from "@/modules/write";
import { assistOutline } from "./ai/assist-outline";
import { AiOutlineButton } from "./ai/AiOutlineButton";

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
          const parsed = JSON.parse(suggestion.suggestion) as SlideOutline[];
          setAiSuggestion(parsed);
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
        <p className="ws-present-empty">
          Báo cáo chưa có nội dung hoặc chỉ có các chương rỗng. Vui lòng thêm nội dung để sinh slide.
        </p>
      </div>
    );
  }

  return (
    <div className="ws-present" aria-label="Thuyết trình">
      <h3 className="ws-present-panel-title">Thuyết trình</h3>

      {/* Navigation Tabs */}
      <div className="ws-present-tabs">
        <button
          className={`ws-present-tab-btn ${activeTab === "outline" ? "active" : ""}`}
          onClick={() => setActiveTab("outline")}
        >
          🗂️ Slides Outline
        </button>
        <button
          className={`ws-present-tab-btn ${activeTab === "script" ? "active" : ""}`}
          onClick={() => setActiveTab("script")}
        >
          🗣️ Kịch bản nói
        </button>
        <button
          className={`ws-present-tab-btn ${activeTab === "qa" ? "active" : ""}`}
          onClick={() => setActiveTab("qa")}
        >
          ❓ Hỏi đáp phản biện
        </button>
        <button
          className={`ws-present-tab-btn ${activeTab === "hints" ? "active" : ""}`}
          onClick={() => setActiveTab("hints")}
        >
          ⚠️ Gợi ý sửa lỗi
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
                ⚠️ Vượt giới hạn (Tối đa {limitMinutes} phút)
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
                ⚠️ {aiError}
              </span>
            )}
          </div>

          {aiSuggestion && (
            <div className="ws-present-ai-suggestion-box">
              <h4 className="ws-present-ai-suggestion-title">
                ✨ Đề xuất tối ưu Slide Outline từ AI
              </h4>
              <p className="ws-present-ai-suggestion-desc">
                AI đề xuất cập nhật các slide bên dưới. Vui lòng duyệt qua trước khi áp dụng.
              </p>

              <div className="ws-present-ai-suggestion-actions">
                <button
                  onClick={() => {
                    handleAcceptAiOutline(aiSuggestion);
                    setAiSuggestion(null);
                  }}
                  className="ws-present-ai-accept-btn"
                >
                  Áp dụng đề xuất
                </button>
                <button
                  onClick={() => setAiSuggestion(null)}
                  className="ws-present-ai-reject-btn"
                >
                  Từ chối
                </button>
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
              <p className="ws-present-hints-empty">
                🎉 Tuyệt vời! Không tìm thấy vấn đề yếu kém nào cần khắc phục trong các slide/section hiện tại.
              </p>
            ) : (
              <div className="ws-present-hints-list">
                {hints.map((hint, idx) => (
                  <div key={idx} className={`ws-present-hint-item severity-${hint.severity}`}>
                    <div className="ws-present-hint-header">
                      <span className={`ws-present-hint-badge severity-${hint.severity}`}>
                        {hint.severity === "error" ? "❌ Lỗi nặng" : hint.severity === "warning" ? "⚠️ Cảnh báo" : "ℹ️ Thông tin"}
                      </span>
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
