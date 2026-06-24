import {
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ExternalHyperlink,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  PageBreak,
} from "docx";
import type {
  Root as MdastRoot,
  Content as MdastContent,
  Heading as MdastHeading,
  Table as MdastTable,
  Link as MdastLink,
  Image as MdastImage,
} from "mdast";
import type { FormattedReport } from "@/types";

interface PhrasingStyles {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  monospace?: boolean;
}

interface BlockOverrides {
  indent?: { left?: number };
  prefixRuns?: TextRun[];
}

/**
 * Extracts raw base64 data from a data URL string.
 * Supports running in both server (Node) and client (browser) environments.
 */
function extractBase64Data(dataUrl: string): { data: Buffer | Uint8Array; type: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+-]+);base64,(.+)$/);
  if (match) {
    const type = match[1];
    const base64Str = match[2];
    if (typeof window === "undefined") {
      return { data: Buffer.from(base64Str, "base64"), type };
    } else {
      const binStr = window.atob(base64Str);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      return { data: bytes, type };
    }
  }
  return null;
}

/**
 * Maps mime types to docx supported image types.
 */
function getImageType(mimeType: string): "jpg" | "png" | "gif" | "bmp" {
  const lower = mimeType.toLowerCase();
  if (lower.includes("png")) return "png";
  if (lower.includes("jpg") || lower.includes("jpeg")) return "jpg";
  if (lower.includes("gif")) return "gif";
  if (lower.includes("bmp")) return "bmp";
  return "png";
}

/**
 * Maps MDAST phrasing content nodes recursively to docx elements (TextRun / ExternalHyperlink).
 */
function mapPhrasingNode(
  node: MdastContent,
  styles: PhrasingStyles = {}
): Array<TextRun | ExternalHyperlink | ImageRun> {
  if (node.type === "text" && "value" in node) {
    return [
      new TextRun({
        text: node.value,
        bold: styles.bold,
        italics: styles.italics,
        strike: styles.strike,
        font: styles.monospace ? "Courier New" : undefined,
      }),
    ];
  }
  if (node.type === "strong" && "children" in node) {
    return (node.children || []).flatMap((child) =>
      mapPhrasingNode(child as MdastContent, { ...styles, bold: true })
    );
  }
  if (node.type === "emphasis" && "children" in node) {
    return (node.children || []).flatMap((child) =>
      mapPhrasingNode(child as MdastContent, { ...styles, italics: true })
    );
  }
  if (node.type === "delete" && "children" in node) {
    return (node.children || []).flatMap((child) =>
      mapPhrasingNode(child as MdastContent, { ...styles, strike: true })
    );
  }
  if (node.type === "inlineCode" && "value" in node) {
    return [
      new TextRun({
        text: node.value,
        font: "Courier New",
        size: 20, // 10pt
      }),
    ];
  }
  if (node.type === "link" && "children" in node) {
    const linkNode = node as MdastLink;
    const runs = (linkNode.children || []).flatMap((child) =>
      mapPhrasingNode(child as MdastContent, styles)
    ) as Array<TextRun | ImageRun>;
    return [
      new ExternalHyperlink({
        children: runs,
        link: linkNode.url,
      }),
    ];
  }
  if (node.type === "image") {
    const imgNode = node as MdastImage;
    const urlStr = imgNode.url || "";
    const altText = imgNode.alt || "Hình ảnh";
    const isQr = altText.startsWith("QR:");

    try {
      const base64Info = extractBase64Data(urlStr);
      if (base64Info) {
        return [
          new ImageRun({
            data: base64Info.data,
            type: getImageType(base64Info.type),
            transformation: {
              width: isQr ? 80 : 450,
              height: isQr ? 80 : 300,
            },
          }),
        ];
      }
    } catch {
      // ignore
    }
  }
  return [];
}

/**
 * Maps a single MDAST block content node to docx Paragraph/Table elements with optional styles overrides.
 */
function mapBlockNode(
  node: MdastContent,
  formatted: FormattedReport,
  state: { h1Count: number },
  overrides: BlockOverrides = {}
): Array<Paragraph | Table> {
  const fontFamily = formatted.preset.fontFamily || "Times New Roman";

  switch (node.type) {
    case "heading": {
      const heading = node as MdastHeading;
      const runs = (heading.children || []).flatMap((child) => mapPhrasingNode(child as MdastContent));
      const depth = heading.depth;
      const levelMap = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ];
      const headingLevel = levelMap[Math.min(depth, 6) - 1];

      const blocks: Array<Paragraph | Table> = [];
      if (depth === 1) {
        if (formatted.preset.chapterStartsNewPage && state.h1Count > 0) {
          blocks.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }
        state.h1Count++;
      }

      blocks.push(
        new Paragraph({
          heading: headingLevel,
          children: [...(overrides.prefixRuns || []), ...runs],
          indent: overrides.indent,
          spacing: { before: 240, after: 120 },
          keepNext: true,
        })
      );
      return blocks;
    }
    case "paragraph": {
      const runs = (node.children || []).flatMap((child) => mapPhrasingNode(child as MdastContent));
      return [
        new Paragraph({
          children: [...(overrides.prefixRuns || []), ...runs],
          indent: overrides.indent,
          spacing: { after: 120 },
        }),
      ];
    }
    case "blockquote": {
      if (!("children" in node)) return [];
      const subBlocks: Array<Paragraph | Table> = [];
      const currentIndent = overrides.indent?.left || 0;
      for (const child of node.children) {
        subBlocks.push(
          ...mapBlockNode(child as MdastContent, formatted, state, {
            ...overrides,
            indent: { left: currentIndent + 720 },
          })
        );
      }
      return subBlocks;
    }
    case "list": {
      if (!("children" in node)) return [];
      const ordered = node.ordered || false;
      const subBlocks: Array<Paragraph | Table> = [];
      let index = node.start || 1;
      const currentIndent = overrides.indent?.left || 0;

      for (const item of node.children) {
        if (!("children" in item)) continue;
        let isFirst = true;
        for (const child of item.children) {
          const itemOverrides: BlockOverrides = {
            indent: { left: currentIndent + 720 },
          };
          if (isFirst) {
            const prefixText = ordered ? `${index}. ` : "• ";
            itemOverrides.prefixRuns = [
              new TextRun({
                text: prefixText,
                bold: ordered,
                font: fontFamily,
              }),
            ];
            isFirst = false;
          } else {
            itemOverrides.prefixRuns = [
              new TextRun({
                text: "   ",
                font: fontFamily,
              }),
            ];
          }
          subBlocks.push(...mapBlockNode(child as MdastContent, formatted, state, itemOverrides));
        }
        if (ordered) index++;
      }
      return subBlocks;
    }
    case "table": {
      const table = node as MdastTable;
      const rows: TableRow[] = [];
      let maxCols = 0;

      for (const row of table.children) {
        maxCols = Math.max(maxCols, row.children.length);
      }

      for (const row of table.children) {
        const cells: TableCell[] = [];
        for (const cell of row.children) {
          const runs = (cell.children || []).flatMap((child) =>
            mapPhrasingNode(child as MdastContent)
          ) as Array<TextRun | ExternalHyperlink | ImageRun>;
          cells.push(
            new TableCell({
              children: [new Paragraph({ children: runs })],
              width: {
                size: 100 / (maxCols || 1),
                type: WidthType.PERCENTAGE,
              },
            })
          );
        }
        rows.push(new TableRow({ children: cells }));
      }

      return [
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          },
        }),
      ];
    }
    case "code": {
      if (!("value" in node)) return [];
      const codeLines = node.value.split("\n");
      const list: Array<Paragraph | Table> = [];
      const currentIndent = overrides.indent?.left || 0;

      if (node.lang) {
        list.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[Mã nguồn: ${node.lang}]`,
                size: 18,
                italics: true,
                color: "666666",
                font: fontFamily,
              }),
            ],
            indent: { left: currentIndent },
            spacing: { before: 120, after: 60 },
            keepNext: true,
          })
        );
      }

      const codeRuns = codeLines.map((line) => {
        return new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: "Courier New",
              size: 20, // 10pt
            }),
          ],
          shading: {
            fill: "F4F4F4",
          },
          indent: { left: currentIndent + 360 },
          spacing: { before: 20, after: 20 },
        });
      });

      list.push(...codeRuns);
      return list;
    }
    case "image": {
      const imgNode = node as MdastImage;
      const altText = imgNode.alt || "Hình ảnh";
      const urlStr = imgNode.url || "";
      const currentIndent = overrides.indent?.left || 0;
      const isQr = altText.startsWith("QR:");

      try {
        const base64Info = extractBase64Data(urlStr);
        if (base64Info) {
          return [
            new Paragraph({
              children: [
                new ImageRun({
                  data: base64Info.data,
                  type: getImageType(base64Info.type),
                  transformation: {
                    width: isQr ? 80 : 450,
                    height: isQr ? 80 : 300,
                  },
                }),
              ],
              indent: { left: currentIndent },
              alignment: isQr ? AlignmentType.LEFT : AlignmentType.CENTER,
              spacing: { before: 120, after: 120 },
            }),
          ];
        }
      } catch {
        // ignore and fall through to placeholder
      }

      // Return placeholder for orphan asset or unsupported URLs
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: `[Hình ảnh không khả dụng: ${altText} (${urlStr})]`,
              color: "FF0000",
              italics: true,
              font: fontFamily,
            }),
          ],
          indent: { left: currentIndent },
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
        }),
      ];
    }
    case "math": {
      if (!("value" in node)) return [];
      const currentIndent = overrides.indent?.left || 0;
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: `[Công thức Toán: ${node.value}]`,
              font: "Courier New",
              color: "333333",
              italics: true,
            }),
          ],
          indent: { left: currentIndent },
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
        }),
      ];
    }
    case "thematicBreak": {
      const currentIndent = overrides.indent?.left || 0;
      return [
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
          },
          indent: { left: currentIndent },
          spacing: { before: 120, after: 120 },
        }),
      ];
    }
    default:
      if ("children" in node && Array.isArray(node.children)) {
        const nested: Array<Paragraph | Table> = [];
        for (const child of node.children) {
          nested.push(...mapBlockNode(child as MdastContent, formatted, state, overrides));
        }
        return nested;
      }
      return [];
  }
}

/**
 * Entry point mapping MDAST AST nodes directly to docx Paragraph and Table blocks.
 */
export function mdastToDocxBlocks(
  mdast: MdastRoot,
  formatted: FormattedReport
): Array<Paragraph | Table> {
  const blocks: Array<Paragraph | Table> = [];
  const state = { h1Count: 0 };

  for (const child of mdast.children) {
    blocks.push(...mapBlockNode(child as MdastContent, formatted, state));
  }

  return blocks;
}
