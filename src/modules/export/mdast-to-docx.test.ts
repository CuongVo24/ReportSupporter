import { describe, it, expect } from "vitest";
import { Paragraph, Table } from "docx";
import type { Root as MdastRoot, Heading as MdastHeading, Table as MdastTable, Code as MdastCode } from "mdast";
import { mdastToDocxBlocks } from "./mdast-to-docx";
import { prepareExport } from "./prepare-export";
import { createProjectFromTemplate, softwareProjectTemplate } from "@/modules/write";

describe("mdast-to-docx mapping", () => {
  const baseBundle = createProjectFromTemplate(softwareProjectTemplate);
  const formatted = prepareExport(baseBundle).formatted;

  it("should map headings to Paragraphs with correct levels", () => {
    const mdast: MdastRoot = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 1,
          children: [{ type: "text", value: "Heading 1" }],
        } as MdastHeading,
        {
          type: "heading",
          depth: 3,
          children: [{ type: "text", value: "Heading 3" }],
        } as MdastHeading,
        {
          type: "heading",
          depth: 7, // Depth > 6 should map to Heading Level 6
          children: [{ type: "text", value: "Heading 7" }],
        } as unknown as MdastHeading,
      ],
    };

    const blocks = mdastToDocxBlocks(mdast, formatted);
    expect(blocks).toHaveLength(3);
    
    expect(blocks[0]).toBeInstanceOf(Paragraph);
    expect(JSON.stringify(blocks[0])).toContain("Heading1");

    expect(blocks[1]).toBeInstanceOf(Paragraph);
    expect(JSON.stringify(blocks[1])).toContain("Heading3");

    expect(blocks[2]).toBeInstanceOf(Paragraph);
    expect(JSON.stringify(blocks[2])).toContain("Heading6");
  });

  it("should map paragraphs and phrasing styles into TextRuns and Hyperlinks", () => {
    const mdast: MdastRoot = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "Normal text. " },
            { type: "strong", children: [{ type: "text", value: "Bold text." }] },
            { type: "emphasis", children: [{ type: "text", value: " Italic text." }] },
            { type: "inlineCode", value: " inline_code()" },
            { type: "link", url: "https://test.com", children: [{ type: "text", value: "Link" }] },
          ],
        },
      ],
    };

    const blocks = mdastToDocxBlocks(mdast, formatted);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBeInstanceOf(Paragraph);
    
    const jsonStr = JSON.stringify(blocks[0]);
    expect(jsonStr).toContain("Normal text. ");
    expect(jsonStr).toContain("Bold text.");
    expect(jsonStr).toContain("w:b");
    expect(jsonStr).toContain(" Italic text.");
    expect(jsonStr).toContain("w:i");
    expect(jsonStr).toContain(" inline_code()");
    expect(jsonStr).toContain("Courier New");
    expect(jsonStr).toContain("https://test.com");
  });

  it("should map GFM tables to docx Tables with matching structures", () => {
    const mdast: MdastRoot = {
      type: "root",
      children: [
        {
          type: "table",
          children: [
            {
              type: "tableRow",
              children: [
                { type: "tableCell", children: [{ type: "text", value: "Col 1" }] },
                { type: "tableCell", children: [{ type: "text", value: "Col 2" }] },
              ],
            },
            {
              type: "tableRow",
              children: [
                { type: "tableCell", children: [{ type: "text", value: "Val 1" }] },
                { type: "tableCell", children: [{ type: "text", value: "Val 2" }] },
              ],
            },
          ],
        } as unknown as MdastTable,
      ],
    };

    const blocks = mdastToDocxBlocks(mdast, formatted);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBeInstanceOf(Table);
    
    const jsonStr = JSON.stringify(blocks[0]);
    expect(jsonStr).toContain("Col 1");
    expect(jsonStr).toContain("Col 2");
    expect(jsonStr).toContain("Val 1");
    expect(jsonStr).toContain("Val 2");
  });

  it("should map code blocks to monospace shaded Paragraphs", () => {
    const mdast: MdastRoot = {
      type: "root",
      children: [
        {
          type: "code",
          lang: "typescript",
          value: "const a = 1;\nconst b = 2;",
        } as MdastCode,
      ],
    };

    const blocks = mdastToDocxBlocks(mdast, formatted);
    expect(blocks).toHaveLength(3);
    
    expect(blocks[0]).toBeInstanceOf(Paragraph);
    expect(JSON.stringify(blocks[0])).toContain("[Mã nguồn: typescript]");

    expect(blocks[1]).toBeInstanceOf(Paragraph);
    expect(JSON.stringify(blocks[1])).toContain("const a = 1;");
    expect(JSON.stringify(blocks[1])).toContain("F4F4F4");

    expect(blocks[2]).toBeInstanceOf(Paragraph);
    expect(JSON.stringify(blocks[2])).toContain("const b = 2;");
  });

  it("should map base64 image urls to ImageRuns, and fallback orphan asset urls to placeholders", () => {
    const mdast: MdastRoot = {
      type: "root",
      children: [
        {
          type: "image",
          alt: "My Image",
          url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
        {
          type: "image",
          alt: "Ghost Image",
          url: "asset:ghost",
        },
      ],
    };

    const blocks = mdastToDocxBlocks(mdast, formatted);
    expect(blocks).toHaveLength(2);

    expect(blocks[0]).toBeInstanceOf(Paragraph);
    expect(JSON.stringify(blocks[0])).toContain("w:drawing");

    expect(blocks[1]).toBeInstanceOf(Paragraph);
    const jsonStr = JSON.stringify(blocks[1]);
    expect(jsonStr).toContain("Hình ảnh không khả dụng: Ghost Image");
    expect(jsonStr).toContain("FF0000");
  });

  it("should map math elements to text fallbacks", () => {
    const mdast: MdastRoot = {
      type: "root",
      children: [
        {
          type: "math",
          value: "E = mc^2",
        },
      ],
    };

    const blocks = mdastToDocxBlocks(mdast, formatted);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBeInstanceOf(Paragraph);

    const jsonStr = JSON.stringify(blocks[0]);
    expect(jsonStr).toContain("[Công thức Toán: E = mc^2]");
    expect(jsonStr).toContain("Courier New");
  });
});
