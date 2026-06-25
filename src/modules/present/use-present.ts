import { useState, useMemo } from "react";
import type { ReportProjectBundle, CheckResult } from "@/types";
import { generateSlideOutline } from "./generate-outline";
import { buildTimeline } from "./timeline";
import { buildSpeakers, assignSlides } from "./speakers";
import { generateSpeakerScript } from "./generate-script";
import { generateDefenseQA } from "./generate-qa";
import { buildWeakSectionHints } from "./weak-sections";

interface UsePresentProps {
  bundle: ReportProjectBundle;
  checkResult?: CheckResult;
}

export function usePresent({ bundle, checkResult }: UsePresentProps) {
  const [editedBullets, setEditedBullets] = useState<Record<string, string[]>>({});
  const [editedSpeakers, setEditedSpeakers] = useState<Record<string, string | undefined>>({});
  const [editedScripts, setEditedScripts] = useState<Record<string, string>>({});
  const [limitMinutes, setLimitMinutes] = useState<number>(10);

  const rawSlides = useMemo(() => {
    return generateSlideOutline(bundle.project.sections, bundle.evidence);
  }, [bundle.project.sections, bundle.evidence]);

  const rawSpeakers = useMemo(() => {
    return buildSpeakers(bundle.project);
  }, [bundle.project]);

  const baseAssignment = useMemo(() => {
    return assignSlides(rawSpeakers, rawSlides);
  }, [rawSpeakers, rawSlides]);

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

  const timeline = useMemo(() => {
    return buildTimeline(slides, limitMinutes * 60);
  }, [slides, limitMinutes]);

  const baseScripts = useMemo(() => {
    return generateSpeakerScript(slides, bundle.evidence);
  }, [slides, bundle.evidence]);

  const scripts = useMemo(() => {
    return baseScripts.map((s) => ({
      ...s,
      script: editedScripts[s.slideId] !== undefined ? editedScripts[s.slideId] : s.script,
    }));
  }, [baseScripts, editedScripts]);

  const qas = useMemo(() => {
    return generateDefenseQA(bundle.project.sections, bundle.evidence);
  }, [bundle.project.sections, bundle.evidence]);

  const hints = useMemo(() => {
    if (!checkResult) return [];
    return buildWeakSectionHints(checkResult, slides);
  }, [checkResult, slides]);

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

  const handleScriptChange = (slideId: string, val: string) => {
    setEditedScripts((prev) => ({ ...prev, [slideId]: val }));
  };

  return {
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
  };
}
