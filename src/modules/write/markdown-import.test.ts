import { describe, expect, it } from "vitest";
import {
  buildMarkdownImportDraft,
  inferMarkdownTitle,
  isMarkdownFileName,
  titleFromMarkdownFileName,
  appendSections,
  replaceSections,
} from "./markdown-import";
import type { ReportProjectBundle, ReportSection } from "@/types";

describe("markdown import helpers", () => {
  it("accepts common Markdown extensions only", () => {
    expect(isMarkdownFileName("report.md")).toBe(true);
    expect(isMarkdownFileName("README.markdown")).toBe(true);
    expect(isMarkdownFileName("notes.txt")).toBe(false);
  });

  it("infers title from the first top-level heading", () => {
    const markdown = "# Báo cáo đồ án\n\nNội dung mở đầu.";
    expect(inferMarkdownTitle(markdown, "fallback.md")).toBe("Báo cáo đồ án");
  });

  it("falls back to a readable file name when no heading exists", () => {
    expect(titleFromMarkdownFileName("project_report-final.md")).toBe("Project report final");
    expect(inferMarkdownTitle("Nội dung không có heading.", "project_report-final.md")).toBe(
      "Project report final",
    );
  });

  it("builds an import draft with parsed section count", () => {
    const draft = buildMarkdownImportDraft(
      "project.md",
      "# Tổng quan\n\nNội dung.\n\n## Cài đặt\n\nnpm install",
    );

    expect(draft.title).toBe("Tổng quan");
    expect(draft.markdown.endsWith("\n")).toBe(true);
    expect(draft.sectionCount).toBe(2);
  });

  const createMockBundle = (sections: ReportSection[]): ReportProjectBundle => ({
    project: {
      id: "proj-1",
      title: "Test Project",
      templateId: "template-1",
      metadata: {},
      sections,
      updatedAt: new Date().toISOString(),
    },
    assets: [],
    evidence: [],
    formatSettings: {
      presetId: "academic-default",
      includeToc: true,
      includeListOfFigures: false,
      includeListOfTables: false,
      captionNumbering: "continuous",
    },
    schemaVersion: 1,
  });

  it("appendSections appends sections and updates order and IDs", () => {
    const initialSections: ReportSection[] = [
      { id: "sec-1", order: 1, title: "Mục 1", markdown: "Nội dung 1", status: "done" },
    ];
    const bundle = createMockBundle(initialSections);

    const newSections: ReportSection[] = [
      { id: "import-sec-0", order: 0, title: "Mục mới 1", markdown: "Nội dung mới 1", status: "draft" },
      { id: "import-sec-1", order: 1, title: "Mục mới 2", markdown: "Nội dung mới 2", status: "draft" },
    ];

    const result = appendSections(bundle, newSections);
    expect(result.project.sections).toHaveLength(3);
    expect(result.project.sections[0]).toEqual(initialSections[0]);
    expect(result.project.sections[1].title).toBe("Mục mới 1");
    expect(result.project.sections[1].order).toBe(2);
    expect(result.project.sections[1].id).not.toBe("import-sec-0");
    expect(result.project.sections[2].title).toBe("Mục mới 2");
    expect(result.project.sections[2].order).toBe(3);
    expect(result.project.sections[2].id).not.toBe("import-sec-1");
  });

  it("replaceSections replaces sections and updates order and IDs", () => {
    const initialSections: ReportSection[] = [
      { id: "sec-1", order: 1, title: "Mục 1", markdown: "Nội dung 1", status: "done" },
    ];
    const bundle = createMockBundle(initialSections);

    const newSections: ReportSection[] = [
      { id: "import-sec-0", order: 0, title: "Mục mới 1", markdown: "Nội dung mới 1", status: "draft" },
    ];

    const result = replaceSections(bundle, newSections);
    expect(result.project.sections).toHaveLength(1);
    expect(result.project.sections[0].title).toBe("Mục mới 1");
    expect(result.project.sections[0].order).toBe(1);
    expect(result.project.sections[0].id).not.toBe("import-sec-0");
  });
});
