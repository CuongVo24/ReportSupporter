import { describe, it, expect } from "vitest";
import { prepareExport } from "./prepare-export";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";
import type { ReportProjectBundle } from "@/types";

describe("prepareExport Optimization Parity", () => {
  const baseBundle = createProjectFromTemplate(softwareProjectTemplate);

  const mockBundle: ReportProjectBundle = {
    ...baseBundle,
    project: {
      ...baseBundle.project,
      sections: [
        {
          id: "sec-1",
          order: 1,
          title: "Introduction",
          markdown: "# Chapter 1\n\nSome text with an image:\n\n![My Figure](asset:img1)\n\n## Sub Heading 1.1\n\nSome text.",
          status: "draft",
        },
        {
          id: "sec-2",
          order: 2,
          title: "Body",
          markdown: "# Chapter 2\n\nHere is a table:\n\n| Col 1 | Col 2 |\n|---|---|\n| A | B |\n\nBảng 2.1: My Table Caption\n\n## Sub Heading 2.1\n\nMore text.",
          status: "draft",
        },
      ],
    },
    assets: [
      {
        id: "img1",
        kind: "image",
        fileName: "test-image.png",
        mimeType: "image/png",
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        insertedAt: new Date().toISOString(),
      },
    ],
  };

  it("extracts all headings and generates TOC with correct numbers", () => {
    const result = prepareExport(mockBundle);

    // Verify TOC structure is hierarchical
    expect(result.formatted.toc).toHaveLength(2);
    expect(result.formatted.toc[0]).toEqual({
      id: expect.any(String),
      level: 1,
      text: "Chapter 1",
      number: "1",
      sectionId: "sec-1",
      children: [
        {
          id: expect.any(String),
          level: 2,
          text: "Sub Heading 1.1",
          number: "1.1",
          sectionId: "sec-1",
          children: [],
        }
      ],
    });
    expect(result.formatted.toc[1]).toEqual({
      id: expect.any(String),
      level: 1,
      text: "Chapter 2",
      number: "2",
      sectionId: "sec-2",
      children: [
        {
          id: expect.any(String),
          level: 2,
          text: "Sub Heading 2.1",
          number: "2.1",
          sectionId: "sec-2",
          children: [],
        }
      ],
    });
  });

  it("extracts figures and tables captions correctly with matching labels", () => {
    const result = prepareExport(mockBundle);

    // Verify figures list
    expect(result.formatted.figures).toHaveLength(1);
    expect(result.formatted.figures[0]).toEqual({
      id: "fig-1",
      kind: "figure",
      number: 1,
      label: "Hình 1",
      text: "My Figure",
      sectionId: "sec-1",
    });

    // Verify tables list
    expect(result.formatted.tables).toHaveLength(1);
    expect(result.formatted.tables[0]).toEqual({
      id: "table-1",
      kind: "table",
      number: 1,
      label: "Bảng 1",
      text: "My Table Caption",
      sectionId: "sec-2",
    });
  });

  it("verifies the number of children in mdast is exactly as compiled", () => {
    const result = prepareExport(mockBundle);
    
    // Check that we have all blocks from both sections (5 from sec-1 + 6 from sec-2 + 1 injected figure caption = 12)
    expect(result.formatted.mdast.children).toHaveLength(12);
    
    // Verify first heading has the number prefix injected into MDAST
    const firstHeading = result.formatted.mdast.children[0];
    expect(firstHeading.type).toBe("heading");
    if (firstHeading.type === "heading") {
      const child0 = firstHeading.children[0];
      expect(child0.type).toBe("text");
      if ("value" in child0) {
        expect(child0.value).toBe("1 ");
      }
      
      const child1 = firstHeading.children[1];
      expect(child1.type).toBe("text");
      if ("value" in child1) {
        expect(child1.value).toBe("Chapter 1");
      }
    }
  });
});
