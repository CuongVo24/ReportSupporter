import { describe, it, expect } from "vitest";
import type { Image as MdastImage, Paragraph as MdastParagraph, Table as MdastTable, Text as MdastText } from "mdast";
import { buildCaptionRegistry } from "./caption-registry";
import { normalizeCaptions } from "./captions";
import { parseMarkdown } from "@/lib/markdown-pipeline";

describe("Caption Normalization & Registry", () => {
  const mockSections = [
    {
      id: "sec-1",
      markdown: `
# Chương 1: Giới thiệu

Đây là hình ảnh thứ nhất:
![Hình ảnh demo](asset:demo1)

Dưới đây là bảng mô tả dữ liệu:

| Cột A | Cột B |
|---|---|
| 1 | 2 |

Bảng 1: Dữ liệu mẫu 1
      `.trim(),
    },
    {
      id: "sec-2",
      markdown: `
# Chương 2: Nội dung chính

Đây là hình ảnh thứ hai trong chương 2:
![Hình ảnh kết quả](asset:result2)

Một bảng khác ở đây:

Bảng 2: Dữ liệu mẫu 2
| Cột C | Cột D |
|---|---|
| 3 | 4 |
      `.trim(),
    },
  ];

  it("should generate continuous numbering for figures and tables independently", () => {
    const parsedSections = mockSections.map((s) => ({
      id: s.id,
      ast: parseMarkdown(s.markdown),
    }));

    const registry = buildCaptionRegistry(parsedSections, {
      captionNumbering: "continuous",
    });

    // We have 2 figures and 2 tables globally
    const figures = registry.filter((r) => r.kind === "figure");
    const tables = registry.filter((r) => r.kind === "table");

    expect(figures).toHaveLength(2);
    expect(tables).toHaveLength(2);

    // Continuous figure numbering check
    expect(figures[0]).toEqual({
      id: "fig-1",
      kind: "figure",
      number: 1,
      label: "Hình 1",
      text: "Hình ảnh demo",
      sectionId: "sec-1",
    });
    expect(figures[1]).toEqual({
      id: "fig-2",
      kind: "figure",
      number: 2,
      label: "Hình 2",
      text: "Hình ảnh kết quả",
      sectionId: "sec-2",
    });

    // Continuous table numbering check
    expect(tables[0]).toEqual({
      id: "table-1",
      kind: "table",
      number: 1,
      label: "Bảng 1",
      text: "Dữ liệu mẫu 1",
      sectionId: "sec-1",
    });
    expect(tables[1]).toEqual({
      id: "table-2",
      kind: "table",
      number: 2,
      label: "Bảng 2",
      text: "Dữ liệu mẫu 2",
      sectionId: "sec-2",
    });
  });

  it("should generate per-chapter numbering resetting figures and tables counters at H1 headings", () => {
    const parsedSections = mockSections.map((s) => ({
      id: s.id,
      ast: parseMarkdown(s.markdown),
    }));

    const registry = buildCaptionRegistry(parsedSections, {
      captionNumbering: "per-chapter",
    });

    const figures = registry.filter((r) => r.kind === "figure");
    const tables = registry.filter((r) => r.kind === "table");

    expect(figures).toHaveLength(2);
    expect(tables).toHaveLength(2);

    // Figure 1 (Chương 1) -> Hình 1.1
    expect(figures[0]).toEqual({
      id: "fig-1",
      kind: "figure",
      number: 1,
      label: "Hình 1.1",
      text: "Hình ảnh demo",
      sectionId: "sec-1",
    });
    // Figure 2 (Chương 2) -> Hình 2.1
    expect(figures[1]).toEqual({
      id: "fig-2",
      kind: "figure",
      number: 1,
      label: "Hình 2.1",
      text: "Hình ảnh kết quả",
      sectionId: "sec-2",
    });

    // Table 1 (Chương 1) -> Bảng 1.1
    expect(tables[0]).toEqual({
      id: "table-1",
      kind: "table",
      number: 1,
      label: "Bảng 1.1",
      text: "Dữ liệu mẫu 1",
      sectionId: "sec-1",
    });
    // Table 2 (Chương 2) -> Bảng 2.1
    expect(tables[1]).toEqual({
      id: "table-2",
      kind: "table",
      number: 1,
      label: "Bảng 2.1",
      text: "Dữ liệu mẫu 2",
      sectionId: "sec-2",
    });
  });

  it("should be deterministic when calling buildCaptionRegistry multiple times", () => {
    const parsedSections = mockSections.map((s) => ({
      id: s.id,
      ast: parseMarkdown(s.markdown),
    }));

    const registry1 = buildCaptionRegistry(parsedSections, {
      captionNumbering: "per-chapter",
    });
    const registry2 = buildCaptionRegistry(parsedSections, {
      captionNumbering: "per-chapter",
    });

    expect(registry1).toEqual(registry2);
  });

  it("should mutate AST correctly in-place for figures and tables during normalizeCaptions", () => {
    const parsedSections = mockSections.map((s) => ({
      id: s.id,
      ast: parseMarkdown(s.markdown),
    }));

    const registry = buildCaptionRegistry(parsedSections, {
      captionNumbering: "per-chapter",
    });

    normalizeCaptions(parsedSections, registry);

    // 1. Verify Figure mutation
    const sec1Children = parsedSections[0].ast.children;
    // Find the paragraph with the image in section 1
    const imgParaIdx = sec1Children.findIndex(
      (c) => c.type === "paragraph" && "children" in c && Array.isArray(c.children) && c.children.some((child) => child.type === "image")
    );
    expect(imgParaIdx).toBeGreaterThan(-1);

    // The image itself should have the correct id injected
    const imgPara = sec1Children[imgParaIdx] as MdastParagraph;
    const imgNode = imgPara.children.find((c) => c.type === "image") as MdastImage;
    expect(imgNode.data?.hProperties?.id).toBe("fig-1");

    // The immediately following node should be the inserted caption paragraph
    const figCaptionNode = sec1Children[imgParaIdx + 1] as MdastParagraph;
    expect(figCaptionNode.type).toBe("paragraph");
    expect(figCaptionNode.data?.hProperties?.className).toBe("fig-caption");
    const figCaptionTextNode = figCaptionNode.children[0] as MdastText;
    expect(figCaptionTextNode.value).toBe("Hình 1.1: Hình ảnh demo");

    // 2. Verify Table mutation
    // In section 1, the table should be updated with a stable ID, and its adjacent caption paragraph normalized in place.
    const tableIdx = sec1Children.findIndex((c) => c.type === "table");
    expect(tableIdx).toBeGreaterThan(-1);
    const tableNode = sec1Children[tableIdx] as MdastTable;
    expect(tableNode.data?.hProperties?.id).toBe("table-1");

    // Sibling caption paragraph (was index tableIdx + 1 or tableIdx - 1)
    const tableCaptionNodePre = sec1Children[tableIdx - 1] as MdastParagraph;
    const tableCaptionNodePost = sec1Children[tableIdx + 1] as MdastParagraph;
    const activeCaption =
      tableCaptionNodePre?.data?.hProperties?.className === "tbl-caption"
        ? tableCaptionNodePre
        : tableCaptionNodePost;

    expect(activeCaption.type).toBe("paragraph");
    expect(activeCaption.data?.hProperties?.className).toBe("tbl-caption");
    const tableCaptionTextNode = activeCaption.children[0] as MdastText;
    expect(tableCaptionTextNode.value).toBe("Bảng 1.1: Dữ liệu mẫu 1");
  });

  it("should normalize captions correctly for a non-first section when passing its own registry slice", () => {
    const parsedSections = mockSections.map((s) => ({
      id: s.id,
      ast: parseMarkdown(s.markdown),
    }));

    const registry = buildCaptionRegistry(parsedSections, {
      captionNumbering: "per-chapter",
    });

    const sec2Registry = registry.filter((e) => e.sectionId === "sec-2");
    expect(sec2Registry).toHaveLength(2); // 1 figure and 1 table

    const sec2State = { figIdx: 0, tableIdx: 0 };
    normalizeCaptions([parsedSections[1]], sec2Registry, sec2State);

    const sec2Children = parsedSections[1].ast.children;
    const imgParaIdx = sec2Children.findIndex(
      (c) => c.type === "paragraph" && "children" in c && Array.isArray(c.children) && c.children.some((child) => child.type === "image")
    );
    expect(imgParaIdx).toBeGreaterThan(-1);

    const imgPara = sec2Children[imgParaIdx] as MdastParagraph;
    const imgNode = imgPara.children.find((c) => c.type === "image") as MdastImage;
    expect(imgNode.data?.hProperties?.id).toBe("fig-2");

    const figCaptionNode = sec2Children[imgParaIdx + 1] as MdastParagraph;
    expect(figCaptionNode.type).toBe("paragraph");
    expect(figCaptionNode.data?.hProperties?.className).toBe("fig-caption");
    const figCaptionTextNode = figCaptionNode.children[0] as MdastText;
    expect(figCaptionTextNode.value).toBe("Hình 2.1: Hình ảnh kết quả");
  });

  it("should clamp chapter index to 1 when a figure appears before the first H1 heading", () => {
    const sections = [
      {
        id: "intro",
        ast: parseMarkdown(`
![First Image](intro.png)

| Col 1 |
|---|
| A |
Bảng: Dữ liệu giới thiệu

# Chương 1
![Second Image](chap1.png)
`),
      },
    ];

    const registry = buildCaptionRegistry(sections, {
      captionNumbering: "per-chapter",
    });

    const fig1 = registry.find((e) => e.id === "fig-1");
    const table1 = registry.find((e) => e.id === "table-1");
    const fig2 = registry.find((e) => e.id === "fig-2");

    expect(fig1?.label).toBe("Hình 1.1");
    expect(table1?.label).toBe("Bảng 1.1");
    expect(fig2?.label).toBe("Hình 1.1");
  });
});
