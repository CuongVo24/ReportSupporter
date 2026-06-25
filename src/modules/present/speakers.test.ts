import { describe, it, expect } from "vitest";
import type { ReportProject, SlideOutline, Speaker } from "@/types";
import { buildSpeakers, assignSlides } from "./speakers";

describe("speakers & assignment logic", () => {
  const mockProject = (members?: string | string[]): ReportProject => ({
    id: "proj-1",
    title: "Test Project",
    templateId: "software-project",
    metadata: members !== undefined ? { members } : {},
    sections: [],
    updatedAt: "2026-06-25T00:00:00Z",
  });

  const mockOutline: SlideOutline[] = [
    { id: "slide-1", fromSectionId: "sec-1", order: 0, title: "S1", bullets: [], evidenceRefs: [] },
    { id: "slide-2", fromSectionId: "sec-1", order: 1, title: "S2", bullets: [], evidenceRefs: [] },
    { id: "slide-3", fromSectionId: "sec-2", order: 2, title: "S3", bullets: [], evidenceRefs: [] },
    { id: "slide-4", fromSectionId: "sec-2", order: 3, title: "S4", bullets: [], evidenceRefs: [] },
    { id: "slide-5", fromSectionId: "sec-3", order: 4, title: "S5", bullets: [], evidenceRefs: [] },
    { id: "slide-6", fromSectionId: "sec-3", order: 5, title: "S6", bullets: [], evidenceRefs: [] },
  ];

  describe("buildSpeakers", () => {
    it("should build Speaker[] from string array members", () => {
      const proj = mockProject(["  An ", "Bình", "Châu"]);
      const speakers = buildSpeakers(proj);

      expect(speakers).toEqual([
        { id: "sp-1", name: "An", assignedSlideIds: [] },
        { id: "sp-2", name: "Bình", assignedSlideIds: [] },
        { id: "sp-3", name: "Châu", assignedSlideIds: [] },
      ]);
    });

    it("should build 1 speaker from a single string value", () => {
      const proj = mockProject("  Single Author  ");
      const speakers = buildSpeakers(proj);

      expect(speakers).toEqual([
        { id: "sp-1", name: "Single Author", assignedSlideIds: [] },
      ]);
    });

    it("should return empty array if members metadata is missing or invalid", () => {
      const proj1 = mockProject(undefined);
      expect(buildSpeakers(proj1)).toEqual([]);

      const proj2 = mockProject([]);
      expect(buildSpeakers(proj2)).toEqual([]);

      const proj3 = mockProject("   ");
      expect(buildSpeakers(proj3)).toEqual([]);
    });
  });

  describe("assignSlides", () => {
    it("should distribute slides contiguously as evenly as possible", () => {
      const speakers: Speaker[] = [
        { id: "sp-1", name: "An", assignedSlideIds: [] },
        { id: "sp-2", name: "Bình", assignedSlideIds: [] },
        { id: "sp-3", name: "Châu", assignedSlideIds: [] },
      ];

      const res = assignSlides(speakers, mockOutline);

      // 6 slides, 3 speakers -> 2 slides each contiguously
      expect(res.speakers[0].assignedSlideIds).toEqual(["slide-1", "slide-2"]);
      expect(res.speakers[1].assignedSlideIds).toEqual(["slide-3", "slide-4"]);
      expect(res.speakers[2].assignedSlideIds).toEqual(["slide-5", "slide-6"]);

      expect(res.outline[0].speakerId).toBe("sp-1");
      expect(res.outline[1].speakerId).toBe("sp-1");
      expect(res.outline[2].speakerId).toBe("sp-2");
      expect(res.outline[3].speakerId).toBe("sp-2");
      expect(res.outline[4].speakerId).toBe("sp-3");
      expect(res.outline[5].speakerId).toBe("sp-3");
    });

    it("should handle uneven distribution cleanly", () => {
      const speakers: Speaker[] = [
        { id: "sp-1", name: "An", assignedSlideIds: [] },
        { id: "sp-2", name: "Bình", assignedSlideIds: [] },
      ];
      // 5 slides, 2 speakers -> base 2 slides each, remainder 1 goes to speaker 0 -> 3 slides & 2 slides
      const unevenOutline = mockOutline.slice(0, 5);
      const res = assignSlides(speakers, unevenOutline);

      expect(res.speakers[0].assignedSlideIds).toEqual(["slide-1", "slide-2", "slide-3"]);
      expect(res.speakers[1].assignedSlideIds).toEqual(["slide-4", "slide-5"]);
    });

    it("should handle empty speakers gracefully by setting speakerId to undefined", () => {
      const res = assignSlides([], mockOutline);
      expect(res.speakers).toEqual([]);
      expect(res.outline.every((slide) => slide.speakerId === undefined)).toBe(true);
    });

    it("should handle empty outline gracefully", () => {
      const speakers: Speaker[] = [{ id: "sp-1", name: "An", assignedSlideIds: [] }];
      const res = assignSlides(speakers, []);
      expect(res.speakers[0].assignedSlideIds).toEqual([]);
      expect(res.outline).toEqual([]);
    });

    it("should be deterministic and immutable", () => {
      const speakers: Speaker[] = [
        { id: "sp-1", name: "An", assignedSlideIds: [] },
      ];

      const originalSpeakersJson = JSON.stringify(speakers);
      const originalOutlineJson = JSON.stringify(mockOutline);

      const res1 = assignSlides(speakers, mockOutline);
      const res2 = assignSlides(speakers, mockOutline);

      expect(res1).toEqual(res2);
      expect(JSON.stringify(speakers)).toBe(originalSpeakersJson);
      expect(JSON.stringify(mockOutline)).toBe(originalOutlineJson);
    });
  });
});
