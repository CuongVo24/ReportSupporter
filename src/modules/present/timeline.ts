import type { SlideOutline, PresentationTimeline } from "@/types";

/**
 * Calculates the presentation timeline from a list of slide outlines.
 * Each slide is assigned an estimated duration in seconds based on its content weight.
 */
export function buildTimeline(
  outline: SlideOutline[],
  limitSeconds?: number
): PresentationTimeline {
  const slots = outline.map((slide) => {
    const baseSeconds = 60; // minimum base of 60 seconds per slide
    const bulletChars = slide.bullets.reduce((sum, bullet) => sum + bullet.length, 0);
    const bulletSeconds = Math.ceil(bulletChars * 0.5);
    const evidenceSeconds = (slide.evidenceRefs || []).length * 15;

    const seconds = baseSeconds + bulletSeconds + evidenceSeconds;

    return {
      slideId: slide.id,
      speakerId: slide.speakerId,
      seconds,
    };
  });

  const totalSeconds = slots.reduce((sum, slot) => sum + slot.seconds, 0);
  const overLimit = limitSeconds !== undefined && totalSeconds > limitSeconds;

  return {
    totalSeconds,
    slots,
    overLimit,
  };
}
