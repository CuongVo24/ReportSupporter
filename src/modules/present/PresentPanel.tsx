"use client";

import React, { useMemo, useState } from "react";
import type { ReportProjectBundle } from "@/types";
import { generateSlideOutline } from "./generate-outline";
import { buildTimeline } from "./timeline";
import { buildSpeakers, assignSlides } from "./speakers";
import { SlideOutlineView } from "./SlideOutlineView";

export interface PresentPanelProps {
  bundle: ReportProjectBundle;
}

export function PresentPanel({ bundle }: PresentPanelProps) {
  const [editedBullets, setEditedBullets] = useState<Record<string, string[]>>({});
  const [editedSpeakers, setEditedSpeakers] = useState<Record<string, string | undefined>>({});
  const [limitMinutes, setLimitMinutes] = useState<number>(10); // default limit 10 minutes

  // 1. Generate slides and speakers from bundle
  const rawSlides = useMemo(() => {
    return generateSlideOutline(bundle.project.sections, bundle.evidence);
  }, [bundle.project.sections, bundle.evidence]);

  const rawSpeakers = useMemo(() => {
    return buildSpeakers(bundle.project);
  }, [bundle.project]);

  // 2. Compute base assignments (speakers & slides)
  const baseAssignment = useMemo(() => {
    return assignSlides(rawSpeakers, rawSlides);
  }, [rawSpeakers, rawSlides]);

  // 3. Apply user local state overrides (bullets, speakerId)
  const slides = useMemo(() => {
    return baseAssignment.outline.map((slide) => {
      const userBullets = editedBullets[slide.id];
      const userSpeaker = editedSpeakers[slide.id];
      return {
        ...slide,
        bullets: userBullets !== undefined ? userBullets : slide.bullets,
        speakerId: userSpeaker !== undefined ? userSpeaker : slide.speakerId,
      };
    });
  }, [baseAssignment.outline, editedBullets, editedSpeakers]);

  const speakers = useMemo(() => {
    return baseAssignment.speakers.map((sp) => {
      const assignedIds = slides
        .filter((slide) => slide.speakerId === sp.id)
        .map((slide) => slide.id);
      return {
        ...sp,
        assignedSlideIds: assignedIds,
      };
    });
  }, [baseAssignment.speakers, slides]);

  // 4. Calculate timeline
  const timeline = useMemo(() => {
    return buildTimeline(slides, limitMinutes * 60);
  }, [slides, limitMinutes]);

  // Handlers
  const handleBulletChange = (slideId: string, index: number, val: string) => {
    const current = slides.find((s) => s.id === slideId);
    if (!current) return;
    const nextBullets = [...current.bullets];
    nextBullets[index] = val;
    setEditedBullets((prev) => ({ ...prev, [slideId]: nextBullets }));
  };

  const handleSpeakerChange = (slideId: string, speakerId: string | undefined) => {
    setEditedSpeakers((prev) => ({ ...prev, [slideId]: speakerId }));
  };

  const handleAddBullet = (slideId: string) => {
    const current = slides.find((s) => s.id === slideId);
    if (!current || current.bullets.length >= 5) return;
    const nextBullets = [...current.bullets, "Ý chính mới"];
    setEditedBullets((prev) => ({ ...prev, [slideId]: nextBullets }));
  };

  const handleRemoveBullet = (slideId: string, index: number) => {
    const current = slides.find((s) => s.id === slideId);
    if (!current) return;
    const nextBullets = current.bullets.filter((_, idx) => idx !== index);
    setEditedBullets((prev) => ({ ...prev, [slideId]: nextBullets }));
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
  );
}
