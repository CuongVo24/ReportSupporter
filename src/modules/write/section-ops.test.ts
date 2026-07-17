import { describe, expect, it } from "vitest";
import {
  addSection,
  duplicateSection,
  renameSection,
  deleteSection,
  moveSection,
  moveSectionToIndex,
  renumberSections,
} from "./section-ops";
import type { ReportSection } from "@/types";

describe("section-ops helpers", () => {
  const createMockSections = (): ReportSection[] => [
    { id: "1", order: 0, title: "Mục 1", markdown: "# Mục 1\nNội dung 1", status: "done",
    revision: 0 },
    { id: "2", order: 1, title: "Mục 2", markdown: "# Mục 2\nNội dung 2", status: "draft",
    revision: 0 },
  ];

  it("renumbers sections sequentially starting from 0", () => {
    const sections = [
      { id: "1", order: 5, title: "Mục 1", markdown: "", status: "draft" as const,
      revision: 0 },
      { id: "2", order: 10, title: "Mục 2", markdown: "", status: "draft" as const,
      revision: 0 },
    ];
    const result = renumberSections(sections);
    expect(result[0].order).toBe(0);
    expect(result[1].order).toBe(1);
  });

  it("addSection appends a section by default and renumbers", () => {
    const initial = createMockSections();
    const { sections, newSection } = addSection(initial);

    expect(sections).toHaveLength(3);
    expect(sections[2].title).toBe("Mục 3");
    expect(sections[2].order).toBe(2);
    expect(newSection.id).toBe(sections[2].id);
    expect(sections[2].markdown).toBe("# Mục 3\n\n");
  });

  it("addSection inserts at index and renumbers", () => {
    const initial = createMockSections();
    const { sections } = addSection(initial, 1, "Mục chèn");

    expect(sections).toHaveLength(3);
    expect(sections[1].title).toBe("Mục chèn");
    expect(sections[1].order).toBe(1);
    expect(sections[2].title).toBe("Mục 2");
    expect(sections[2].order).toBe(2);
  });

  it("duplicateSection duplicates next to current section", () => {
    const initial = createMockSections();
    const { sections, duplicate } = duplicateSection(initial, initial[0]);

    expect(sections).toHaveLength(3);
    expect(sections[1].title).toBe("Mục 1 (bản sao)");
    expect(sections[1].order).toBe(1);
    expect(sections[1].id).toBe(duplicate.id);
    expect(sections[2].title).toBe("Mục 2");
    expect(sections[2].order).toBe(2);
  });

  it("renameSection renames and keeps markdown synced if matching heading", () => {
    const initial = createMockSections();
    
    // Exact matching heading
    const renamed = renameSection(initial, "1", "Tiêu đề mới");
    expect(renamed[0].title).toBe("Tiêu đề mới");
    expect(renamed[0].markdown).toBe("# Tiêu đề mới\nNội dung 1");

    // Non-matching heading inside markdown shouldn't update markdown
    const withNoHeading = [
      { id: "3", order: 0, title: "Mục 3", markdown: "Nội dung không có heading", status: "draft" as const,
      revision: 0 },
    ];
    const renamed2 = renameSection(withNoHeading, "3", "Tiêu đề mới");
    expect(renamed2[0].title).toBe("Tiêu đề mới");
    expect(renamed2[0].markdown).toBe("Nội dung không có heading");
  });

  it("deleteSection deletes and renumbers", () => {
    const initial = createMockSections();
    const result = deleteSection(initial, "1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
    expect(result[0].order).toBe(0);
  });

  it("moveSection moves section up and down", () => {
    const initial = createMockSections();

    // Move first section down
    const movedDown = moveSection(initial, "1", "down");
    expect(movedDown[0].id).toBe("2");
    expect(movedDown[0].order).toBe(0);
    expect(movedDown[1].id).toBe("1");
    expect(movedDown[1].order).toBe(1);

    // Move second section up
    const movedUp = moveSection(initial, "2", "up");
    expect(movedUp[0].id).toBe("2");
    expect(movedUp[0].order).toBe(0);
    expect(movedUp[1].id).toBe("1");
    expect(movedUp[1].order).toBe(1);
  });

  it("moveSectionToIndex moves any section to a target index and renumbers", () => {
    const initial = [
      ...createMockSections(),
      { id: "3", order: 2, title: "Mục 3", markdown: "# Mục 3", status: "review" as const,
      revision: 0 },
    ];

    const movedToStart = moveSectionToIndex(initial, "3", 0);

    expect(movedToStart.map((section) => section.id)).toEqual(["3", "1", "2"]);
    expect(movedToStart.map((section) => section.order)).toEqual([0, 1, 2]);

    const unchanged = moveSectionToIndex(initial, "missing", 0);
    expect(unchanged).toBe(initial);
  });
});
