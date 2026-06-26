import React from "react";
import type { SlideOutline, Speaker } from "@/types";
import { AlertTriangle } from "lucide-react";

export interface SlideOutlineViewProps {
  slide: SlideOutline;
  speakers: Speaker[];
  onBulletChange: (index: number, val: string) => void;
  onSpeakerChange: (speakerId: string | undefined) => void;
  onAddBullet: () => void;
  onRemoveBullet: (index: number) => void;
}

export function SlideOutlineView({
  slide,
  speakers,
  onBulletChange,
  onSpeakerChange,
  onAddBullet,
  onRemoveBullet,
}: SlideOutlineViewProps) {
  return (
    <div className="ws-present-slide-card" aria-label={`Slide: ${slide.title}`}>
      <div className="ws-present-slide-header">
        <h4 className="ws-present-slide-title">{slide.title}</h4>
        <div className="ws-present-slide-speaker">
          <label htmlFor={`sp-select-${slide.id}`} className="ws-present-speaker-label">
            Người nói:
          </label>
          <select
            id={`sp-select-${slide.id}`}
            value={slide.speakerId || ""}
            onChange={(e) => onSpeakerChange(e.target.value || undefined)}
            className="ws-present-speaker-select"
          >
            <option value="">Không gán</option>
            {speakers.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {slide.evidenceRefs.length > 0 && (
        <div className="ws-present-evidence-refs">
          <span className="ws-present-evidence-label">Minh chứng:</span>
          {slide.evidenceRefs.map((ref) => (
            <span key={ref} className="ws-present-evidence-badge">
              {ref}
            </span>
          ))}
        </div>
      )}

      {slide.brokenEvidenceNotes && slide.brokenEvidenceNotes.length > 0 && (
        <div className="ws-present-slide-warnings" role="alert">
          {slide.brokenEvidenceNotes.map((warning, index) => (
            <div key={index} className="ws-present-slide-warning-item" style={{ display: "inline-flex", alignItems: "center", gap: "var(--rs-space-1)" }}>
              <AlertTriangle size={12} className="ws-present-slide-warning-icon" style={{ color: "var(--rs-color-readiness-medium)", flexShrink: 0 }} /> {warning}
            </div>
          ))}
        </div>
      )}

      <div className="ws-present-bullets-list">
        {slide.bullets.map((bullet, index) => (
          <div key={index} className="ws-present-bullet-row">
            <span className="ws-present-bullet-dot" aria-hidden="true">•</span>
            <input
              type="text"
              value={bullet}
              onChange={(e) => onBulletChange(index, e.target.value)}
              className="ws-present-bullet-input"
              aria-label={`Ý chính ${index + 1} của slide ${slide.title}`}
            />
            <button
              onClick={() => onRemoveBullet(index)}
              className="ws-present-bullet-remove-btn"
              aria-label={`Xóa ý chính ${index + 1} của slide ${slide.title}`}
              title="Xóa ý chính"
            >
              ×
            </button>
          </div>
        ))}

        {slide.bullets.length < 5 && (
          <button
            onClick={onAddBullet}
            className="ws-present-add-bullet-btn"
            aria-label={`Thêm ý chính mới cho slide ${slide.title}`}
          >
            + Thêm ý chính
          </button>
        )}
      </div>
    </div>
  );
}
