import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  PageBreak,
} from "docx";
import type {
  ReportProjectBundle,
  ExportError,
  FormatPreset,
  TocNode,
} from "@/types";
import type { CoverPageData } from "./types";
import { prepareExport } from "./prepare-export";
import { mdastToDocxBlocks } from "./mdast-to-docx";

export type DocxBuildResult =
  | { ok: true; doc: Document }
  | { ok: false; error: ExportError };

/**
 * Parses margin strings (e.g. "20mm", "3cm", "1in") to dxa (twentieths of a point).
 * Default conversion: 1mm = 56.69 dxa, 1cm = 566.9 dxa, 1in = 1440 dxa.
 */
function parseMarginToDxa(marginStr: string): number {
  const num = parseFloat(marginStr);
  if (isNaN(num)) return 1134; // default to 20mm (1134 dxa)
  if (marginStr.endsWith("mm")) {
    return Math.round(num * 56.69);
  }
  if (marginStr.endsWith("cm")) {
    return Math.round(num * 566.9);
  }
  if (marginStr.endsWith("in") || marginStr.endsWith("inch")) {
    return Math.round(num * 1440);
  }
  if (marginStr.endsWith("pt")) {
    return Math.round(num * 20);
  }
  return Math.round(num);
}

/**
 * Builds the DOCX cover page blocks statically from CoverPageData.
 */
function buildDocxCoverPage(cover: CoverPageData, preset: FormatPreset): Paragraph[] {
  const blocks: Paragraph[] = [];
  const fontFamily = preset.fontFamily || "Times New Roman";

  // 1. School name
  if (cover.school) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: cover.school.toUpperCase(),
            bold: true,
            size: 32, // 16pt
            font: fontFamily,
          }),
        ],
        spacing: { before: 240, after: 120 },
      })
    );

    // Divider line represented as text dashes
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "————————————",
            bold: true,
            size: 24,
            font: fontFamily,
          }),
        ],
        spacing: { after: 720 },
      })
    );
  }

  // Spacing before title
  blocks.push(new Paragraph({ spacing: { before: 1440 } }));

  // 2. Title
  blocks.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: cover.title.toUpperCase(),
          bold: true,
          size: 48, // 24pt
          font: fontFamily,
        }),
      ],
      spacing: { after: 720 },
    })
  );

  // 3. Course
  if (cover.course) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Học phần: ${cover.course}`,
            bold: true,
            size: 28, // 14pt
            font: fontFamily,
          }),
        ],
        spacing: { after: 1440 },
      })
    );
  }

  // Spacing before info block
  blocks.push(new Paragraph({ spacing: { before: 1440 } }));

  // 4. Info (Lecturer & Members)
  if (cover.lecturer) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 1440 },
        children: [
          new TextRun({
            text: "Giảng viên hướng dẫn: ",
            bold: true,
            size: 26, // 13pt
            font: fontFamily,
          }),
          new TextRun({
            text: cover.lecturer,
            size: 26,
            font: fontFamily,
          }),
        ],
        spacing: { after: (!cover.members || cover.members.length === 0) ? 1440 : 120 },
      })
    );
  }

  if (cover.members && cover.members.length > 0) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 1440 },
        children: [
          new TextRun({
            text: "Thành viên thực hiện:",
            bold: true,
            size: 26, // 13pt
            font: fontFamily,
          }),
        ],
        spacing: { after: 120 },
      })
    );

    cover.members.forEach((member, index) => {
      const isLast = index === (cover.members?.length ?? 0) - 1;
      blocks.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 1440 },
          children: [
            new TextRun({
              text: `  • ${member}`,
              size: 26, // 13pt
              font: fontFamily,
            }),
          ],
          spacing: { after: isLast ? 1440 : 120 },
        })
      );
    });
  }

  // Spacing before date
  blocks.push(new Paragraph({ spacing: { before: 1440 } }));

  // 5. Date
  if (cover.date) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: cover.date,
            size: 26, // 13pt
            font: fontFamily,
          }),
        ],
        spacing: { before: 720 },
      })
    );
  }

  // Add PageBreak at the end of the cover page
  blocks.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  return blocks;
}

/**
 * Builds the DOCX Table of Contents blocks statically from formatted TocNodes.
 */
function buildDocxToc(toc: TocNode[], preset: FormatPreset): Paragraph[] {
  const blocks: Paragraph[] = [];
  const fontFamily = preset.fontFamily || "Times New Roman";

  blocks.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "MỤC LỤC",
          bold: true,
          size: 32, // 16pt
          font: fontFamily,
        }),
      ],
      spacing: { before: 240, after: 360 },
      keepNext: true,
    })
  );

  function renderNodes(nodes: TocNode[]) {
    for (const node of nodes) {
      const indentLeft = (node.level - 1) * 360; // 0.25 inch per level
      blocks.push(
        new Paragraph({
          indent: { left: indentLeft },
          children: [
            new TextRun({
              text: `${node.number} `,
              bold: node.level === 1,
              font: fontFamily,
            }),
            new TextRun({
              text: node.text,
              bold: node.level === 1,
              font: fontFamily,
            }),
          ],
          spacing: { after: 120 },
        })
      );

      if (node.children && node.children.length > 0) {
        renderNodes(node.children);
      }
    }
  }

  renderNodes(toc);

  // Add PageBreak after TOC
  blocks.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  return blocks;
}

/**
 * Synchronously compiles the project bundle into a docx Document object.
 * Applies FormatPreset options (Times New Roman, margins, font sizing).
 */
export function exportDocx(bundle: ReportProjectBundle, qrDataUrls?: Record<string, string>): DocxBuildResult {
  try {
    const { cover, formatted } = prepareExport(bundle, qrDataUrls);
    const { preset } = formatted;

    const coverBlocks = buildDocxCoverPage(cover, preset);

    let tocBlocks: Paragraph[] = [];
    if (bundle.formatSettings.includeToc && formatted.toc.length > 0) {
      tocBlocks = buildDocxToc(formatted.toc, preset);
    }

    const bodyBlocks = mdastToDocxBlocks(formatted.mdast, formatted);

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: preset.fontFamily || "Times New Roman",
              size: (preset.fontSizePt || 13) * 2, // size in half-points
            },
            paragraph: {
              spacing: {
                line: Math.round((preset.lineHeight || 1.5) * 240),
                lineRule: "auto" as const,
              },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: parseMarginToDxa(preset.margin?.top || "20mm"),
                bottom: parseMarginToDxa(preset.margin?.bottom || "20mm"),
                left: parseMarginToDxa(preset.margin?.left || "30mm"),
                right: parseMarginToDxa(preset.margin?.right || "20mm"),
              },
            },
          },
          children: [...coverBlocks, ...tocBlocks, ...bodyBlocks],
        },
      ],
    });

    return { ok: true, doc };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to compile DOCX document.";
    return {
      ok: false,
      error: {
        stage: "render-docx",
        message,
        recoverable: true,
      },
    };
  }
}

/**
 * Encodes a built docx Document into a binary Blob asynchronously.
 */
export async function packDocx(doc: Document): Promise<Blob> {
  return await Packer.toBlob(doc);
}

