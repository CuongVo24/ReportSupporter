import { describe, it, expect } from "vitest";
import type { SlideOutline } from "@/types";
import { buildTimeline } from "./timeline";

describe("buildTimeline", () => {
  it("should calculate slide durations with min per slide and content weight", () => {
    const outline: SlideOutline[] = [
      {
        id: "slide-1",
        fromSectionId: "sec-1",
        order: 0,
        title: "Introduction",
        bullets: [], // empty bullets -> base 60s
        evidenceRefs: [],
      },
      {
        id: "slide-2",
        fromSectionId: "sec-1",
        order: 1,
        title: "Overview",
        bullets: ["Short bullet."], // bullet char length = 13. base 60s + ceil(13 * 0.5) = 67s
        evidenceRefs: [],
      },
      {
        id: "slide-3",
        fromSectionId: "sec-2",
        order: 2,
        title: "Details",
        bullets: ["This is a much longer bullet point explaining things in detail."], // char length = 61. base 60s + ceil(61 * 0.5) = 91s
        evidenceRefs: ["ev-1"], // +15s -> 91 + 15 = 106s
      },
    ];

    const timeline = buildTimeline(outline);

    expect(timeline.slots).toHaveLength(3);
    expect(timeline.slots[0]).toEqual({
      slideId: "slide-1",
      speakerId: undefined,
      seconds: 60,
    });
    expect(timeline.slots[1].seconds).toBe(67);
    expect(timeline.slots[2].seconds).toBe(107);

    expect(timeline.totalSeconds).toBe(60 + 67 + 107);
    expect(timeline.overLimit).toBe(false);
  });

  it("should detect overLimit correctly when sum exceeds limitSeconds", () => {
    const outline: SlideOutline[] = [
      {
        id: "slide-1",
        fromSectionId: "sec-1",
        order: 0,
        title: "Slide",
        bullets: [],
        evidenceRefs: [],
      },
    ];

    // Slide 1 takes 60 seconds
    const timeline1 = buildTimeline(outline, 100);
    expect(timeline1.overLimit).toBe(false);

    const timeline2 = buildTimeline(outline, 50);
    expect(timeline2.overLimit).toBe(true);
  });

  it("should handle empty outline gracefully without crashing", () => {
    const timeline = buildTimeline([], 120);
    expect(timeline).toEqual({
      totalSeconds: 0,
      slots: [],
      overLimit: false,
    });
  });

  it("should be deterministic and immutable", () => {
    const outline: SlideOutline[] = [
      {
        id: "slide-1",
        fromSectionId: "sec-1",
        order: 0,
        title: "Slide",
        bullets: ["Test"],
        evidenceRefs: [],
      },
    ];

    const originalJson = JSON.stringify(outline);

    const timeline1 = buildTimeline(outline);
    const timeline2 = buildTimeline(outline);

    expect(timeline1).toEqual(timeline2);
    // Verify no mutation on original outline
    expect(JSON.stringify(outline)).toBe(originalJson);
  });
});
