import { describe, it, expect } from "vitest";
import { ALL_TEMPLATES, buildInitialSections } from "@/modules/write";
import { generateSlideOutline, buildTimeline, buildSpeakers, assignSlides } from "./index";
import type { ReportProjectBundle } from "@/types";

describe("Present Module Integration Tests (multi-template)", () => {
  ALL_TEMPLATES.forEach((template) => {
    it(`should run end-to-end present pipeline successfully for template: ${template.id}`, () => {
      // 1. Setup metadata and build initial sections
      const metadata: Record<string, string | string[]> = {
        school: "Đại học Bách Khoa",
        members: ["Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Châu"],
        readmeContent: "# Readme Title\n\nSome readme content with a [GitHub Link](https://github.com/CuongVo24/ReportSupporter).\n",
      };

      const sections = buildInitialSections(template, metadata);
      expect(sections).toBeInstanceOf(Array);
      expect(sections.length).toBeGreaterThan(0);

      // 2. Build mock bundle
      const bundle: ReportProjectBundle = {
        project: {
          id: `proj-${template.id}`,
          title: `Báo cáo mẫu ${template.name}`,
          templateId: template.id,
          metadata,
          sections,
          updatedAt: new Date().toISOString(),
        },
        assets: [],
        evidence: [
          {
            id: "ev-git",
            kind: "github",
            title: "Mã nguồn dự án",
            url: "https://github.com/CuongVo24/ReportSupporter",
            qrEnabled: true,
            createdAt: new Date().toISOString(),
          },
        ],
        formatSettings: {
          presetId: "academic-default",
          includeToc: true,
          includeListOfFigures: true,
          includeListOfTables: true,
          captionNumbering: "continuous",
        },
        schemaVersion: 1,
      };

      // 3. Generate Slide Outline
      const slides = generateSlideOutline(bundle.project.sections, bundle.evidence);
      expect(slides).toBeInstanceOf(Array);
      expect(slides.length).toBeGreaterThan(0);

      // Verify slides order increments from 0
      slides.forEach((slide, idx) => {
        expect(slide.order).toBe(idx);
        expect(slide.id).toBeDefined();
        expect(slide.title).toBeDefined();
        expect(slide.title.trim()).not.toBe("");
        expect(slide.bullets).toBeInstanceOf(Array);
        // Assert no warnings are mixed in bullets
        slide.bullets.forEach((b) => {
          expect(b).not.toContain("[Cảnh báo:");
        });
      });
      // Assert at least one slide has numbered heading format (e.g. 1. Intro)
      const numberedSlides = slides.filter((s) => /^\d+(\.\d+)*\.\s/.test(s.title));
      expect(numberedSlides.length).toBeGreaterThan(0);

      // 4. Build Timeline
      const timeline = buildTimeline(slides, 600); // 10 minutes limit
      expect(timeline.totalSeconds).toBeGreaterThan(0);
      expect(timeline.slots).toHaveLength(slides.length);
      
      const sumSeconds = timeline.slots.reduce((sum, s) => sum + s.seconds, 0);
      expect(timeline.totalSeconds).toBe(sumSeconds);

      // Verify overLimit triggers correctly
      const timelineTight = buildTimeline(slides, 10); // tight 10 seconds limit
      expect(timelineTight.overLimit).toBe(true);

      // 5. Build Speakers & Assign Slides
      const speakers = buildSpeakers(bundle.project);
      expect(speakers).toHaveLength(3); // 3 members

      const assignment = assignSlides(speakers, slides);
      expect(assignment.speakers).toHaveLength(3);
      expect(assignment.outline).toHaveLength(slides.length);

      // Verify that all slides are assigned to sp-1, sp-2, sp-3 contiguously
      assignment.outline.forEach((slide) => {
        expect(slide.speakerId).toBeDefined();
        expect(["sp-1", "sp-2", "sp-3"]).toContain(slide.speakerId);
      });

      // Verify that slideIds are correctly tracked in speaker assignedSlideIds
      const allAssignedIds = assignment.speakers.flatMap((s) => s.assignedSlideIds);
      expect(allAssignedIds).toHaveLength(slides.length);
      expect(new Set(allAssignedIds).size).toBe(slides.length);
    });
  });

  it("should handle broken evidence references and generate warning notes correctly", () => {
    // Setup a section with a markdown link pointing to a github URL that is NOT in the evidence list
    const sections = [
      {
        id: "sec-1",
        order: 1,
        title: "Minh chứng",
        status: "draft" as const,
        markdown: "# Chương 1\n\nXem thêm link source code của chúng tôi tại [Mã nguồn](https://github.com/CuongVo24/ReportSupporter-deleted).\n",
      },
    ];

    const slides = generateSlideOutline(sections, []); // Empty evidence list
    expect(slides).toHaveLength(1);
    expect(slides[0].evidenceRefs).toHaveLength(0); // Omitted from evidenceRefs
    expect(slides[0].bullets).not.toContain("[Cảnh báo: Minh chứng đã bị xóa]");
    expect(slides[0].brokenEvidenceNotes).toEqual(["[Cảnh báo: Minh chứng đã bị xóa]"]);
  });
});
