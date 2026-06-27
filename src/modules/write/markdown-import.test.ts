import { describe, expect, it } from "vitest";
import {
  buildMarkdownImportDraft,
  inferMarkdownTitle,
  isMarkdownFileName,
  titleFromMarkdownFileName,
} from "./markdown-import";

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
});
