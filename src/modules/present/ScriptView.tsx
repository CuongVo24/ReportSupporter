import React from "react";
import type { SpeakerScript, SlideOutline, Speaker } from "@/types";
import { User, Sparkles, Lightbulb } from "lucide-react";

interface ScriptViewProps {
  scripts: SpeakerScript[];
  slides: SlideOutline[];
  speakers: Speaker[];
  onScriptChange: (slideId: string, val: string) => void;
}

export function ScriptView({ scripts, slides, speakers, onScriptChange }: ScriptViewProps) {
  return (
    <div className="ws-present-script-view" aria-label="Kịch bản nói">
      <h4 className="ws-present-view-title">Kịch bản nói (Speaker Script)</h4>
      <div className="ws-present-script-list">
        {scripts.map((item) => {
          const slide = slides.find((s) => s.id === item.slideId);
          if (!slide) return null;

          return (
            <div key={item.slideId} className="ws-present-script-item">
              <div className="ws-present-script-header">
                <span className="ws-present-slide-title">{slide.title}</span>
                {item.speakerId && (
                  <span className="ws-present-slide-speaker">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><User size={12} /> Người nói: {speakers.find((s) => s.id === item.speakerId)?.name ?? item.speakerId}</span>
                  </span>
                )}
              </div>

              <div className="ws-present-script-body">
                <label
                  htmlFor={`script-textarea-${item.slideId}`}
                  className="ws-present-script-label"
                >
                  Lời thuyết trình:
                </label>
                <textarea
                  id={`script-textarea-${item.slideId}`}
                  className="ws-present-script-textarea"
                  value={item.script}
                  onChange={(e) => onScriptChange(item.slideId, e.target.value)}
                  placeholder="Nhập lời thoại thuyết trình tại đây..."
                />
                
                <div className="ws-present-ai-container">
                  <button
                    disabled
                    className="ws-present-ai-btn"
                    title="Tính năng tự động tối ưu bằng AI sẽ khả dụng ở tuần 11"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Sparkles size={12} /> Tối ưu kịch bản bằng AI (W11)
                    </span>
                  </button>
                </div>
              </div>

              {item.cues && item.cues.length > 0 && (
                <div className="ws-present-script-cues">
                  <div className="ws-present-cues-title">Cues hành động:</div>
                  <div className="ws-present-cues-list">
                    {item.cues.map((cue, idx) => (
                      <span key={idx} className="ws-present-cue-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Lightbulb size={12} /> {cue}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
