import type { ExtractedPage, TextItem } from "./extract-text";
import type { HeadingMap } from "./heading-heuristic";
import { getHeadingLevel } from "./heading-heuristic";
import type { ImportWarning, ReportAsset } from "@/types";
import { stripHeadingNumbers } from "../strip-heading-number";
import { isPageScanned } from "./detect-scanned";
import type { ImageItem } from "./extract-images";
import { detectAndSortColumns, groupItemsIntoLines, detectTableLines } from "./detect-columns";

interface ListMatch {
  type: "bullet" | "numbered";
  prefix: string;
}

/**
 * Detects if a text string starts with a list item prefix (bullet or numbering).
 */
export function detectListType(text: string): ListMatch | null {
  // Bullet match: •, -, *, +, –
  const bulletRegex = /^([•\-*+–])\s+/;
  const bulletMatch = text.match(bulletRegex);
  if (bulletMatch) {
    return { type: "bullet", prefix: bulletMatch[0] };
  }

  // Numbered match: 1. or a) or a.
  const numberedRegex = /^(\d+|[a-zA-Z])([.)])\s+/;
  const numberedMatch = text.match(numberedRegex);
  if (numberedMatch) {
    return { type: "numbered", prefix: numberedMatch[0] };
  }

  return null;
}

/**
 * Converts extracted PDF pages to Markdown.
 * Merges lines into paragraphs, detects headings, groups nested lists,
 * positions images in the content flow, flags scanned pages, handles 2-column layouts,
 * and flattens table lines with tabs.
 */
export function convertPdfPagesToMarkdown(
  pages: ExtractedPage[],
  bodySize: number,
  headingMap: HeadingMap
): { markdown: string; warnings: ImportWarning[]; assets: ReportAsset[] } {
  const warnings: ImportWarning[] = [];
  const assets: ReportAsset[] = [];
  const mdBlocks: string[] = [];

  for (const page of pages) {
    const pageNum = page.pageNumber;
    const items = page.items;
    const images = page.images || [];

    const totalTextLength = items.reduce((sum, item) => sum + item.text.trim().length, 0);

    // 1. Check if page is scanned
    if (isPageScanned(page.width, page.height, totalTextLength, images)) {
      warnings.push({
        code: "scanned-page",
        message: `Trang ${pageNum} có vẻ là bản scan. Chữ chưa trích xuất được.`,
        location: `trang ${pageNum}`,
      });
      mdBlocks.push(`> [Trang ${pageNum}: bản scan — chưa trích được chữ. Thử OCR (experimental) ở bản W24.]`);
      continue;
    }

    if (items.length === 0 && images.length === 0) continue;

    // 2. 2-column layout detection and sorting
    const { sortedItems, isTwoColumn } = detectAndSortColumns(items, page.width);
    if (isTwoColumn) {
      warnings.push({
        code: "unsupported-element",
        message: `Tài liệu trang ${pageNum} có dạng 2 cột. Hệ thống tự động trích xuất cột trái trước, cột phải sau.`,
        location: `trang ${pageNum}`,
      });
    }

    // 3. Table lines detection
    const lines = groupItemsIntoLines(sortedItems);
    const tableLineYs = detectTableLines(lines);

    const finalItems: TextItem[] = [];
    const addedTableYs = new Set<number>();

    for (const item of sortedItems) {
      let isTableItem = false;
      let matchY = 0;
      for (const tableY of tableLineYs) {
        if (Math.abs(tableY - item.y) <= 5) {
          isTableItem = true;
          matchY = tableY;
          break;
        }
      }

      if (isTableItem) {
        if (!addedTableYs.has(matchY)) {
          addedTableYs.add(matchY);
          const line = lines.find((l) => Math.abs(l.y - matchY) <= 5);
          if (line) {
            const tabSeparatedText = line.items.map((it) => it.text.trim()).join("\t");
            if (addedTableYs.size === 1) {
              warnings.push({
                code: "table-flattened",
                message: `Phát hiện bảng ở trang ${pageNum}. Hệ thống tự động dàn phẳng văn bản bằng ký tự tab.`,
                location: `trang ${pageNum}`,
              });
            }

            finalItems.push({
              text: tabSeparatedText,
              fontSize: line.items[0].fontSize,
              fontName: line.items[0].fontName,
              x: line.items[0].x,
              y: matchY,
              width: line.items.reduce((sum, it) => sum + it.width, 0),
            });
          }
        }
      } else {
        finalItems.push(item);
      }
    }
    // Detect base left margin for list nested level detection
    let minX = 1000;
    for (const item of finalItems) {
      const text = item.text.trim();
      if (text && item.x < minX) {
        minX = item.x;
      }
    }

    // 4. Build unified stream of elements sorted by y coordinate descending
    type Element =
      | { type: "text"; data: TextItem }
      | { type: "image"; data: ImageItem };

    const elements: Element[] = [
      ...finalItems.map((item) => ({ type: "text" as const, data: item })),
      ...images.map((img) => ({ type: "image" as const, data: img })),
    ];

    elements.sort((a, b) => {
      const yA = a.type === "text" ? a.data.y : a.data.y;
      const yB = b.type === "text" ? b.data.y : b.data.y;
      return yB - yA;
    });

    let i = 0;
    while (i < elements.length) {
      const el = elements[i];

      // Handle Image item
      if (el.type === "image") {
        const img = el.data;
        mdBlocks.push(`![${img.fileName}](asset:${img.id})`);
        assets.push({
          id: img.id,
          kind: "image",
          fileName: img.fileName,
          mimeType: "image/png",
          data: img.data,
          insertedAt: new Date().toISOString(),
        });
        i++;
        continue;
      }

      const item = el.data;
      const text = item.text.trim();
      if (!text) {
        i++;
        continue;
      }

      // Table row handler (standalone tab-separated line)
      if (text.includes("\t")) {
        mdBlocks.push(text);
        i++;
        continue;
      }

      // 5. Heading check
      const headingLevel = getHeadingLevel(item, bodySize, headingMap);
      if (headingLevel !== null) {
        const mdLine = `${"#".repeat(headingLevel)} ${text}`;
        const strippedLine = stripHeadingNumbers(mdLine);

        mdBlocks.push(strippedLine);
        warnings.push({
          code: "heading-guessed",
          message: `Phát hiện heading từ cỡ chữ/phông chữ: "${strippedLine.replace(/^#+\s+/, "")}"`,
          location: `trang ${pageNum}`,
        });
        i++;
        continue;
      }

      // 6. List item check
      const listMatch = detectListType(text);
      if (listMatch) {
        let listText = text;
        const listType = listMatch.type;
        const originalPrefix = listMatch.prefix;

        let lastItem = item;
        let nextIdx = i + 1;

        while (nextIdx < elements.length) {
          const nextEl = elements[nextIdx];
          if (nextEl.type !== "text") break;

          const nextItem = nextEl.data;
          const nextText = nextItem.text.trim();
          if (!nextText) {
            nextIdx++;
            continue;
          }

          // Stop if next is heading, list item, or table row
          if (getHeadingLevel(nextItem, bodySize, headingMap) !== null) break;
          if (detectListType(nextText)) break;
          if (nextText.includes("\t")) break;

          // Check vertical gap
          const yGap = lastItem.y - nextItem.y;
          const isClose = yGap > 0 && yGap < lastItem.fontSize * 2.2;

          if (isClose) {
            if (listText.endsWith("-")) {
              listText = listText.slice(0, -1) + nextText;
            } else {
              listText += " " + nextText;
            }
            lastItem = nextItem;
            nextIdx++;
          } else {
            break;
          }
        }

        const isNested = item.x > minX + 15;
        const indentPrefix = isNested ? "  " : "";
        const gfmPrefix = listType === "numbered" ? "1. " : "- ";

        const cleanContent = listText.slice(originalPrefix.length).trim();
        mdBlocks.push(`${indentPrefix}${gfmPrefix}${cleanContent}`);

        i = nextIdx;
        continue;
      }

      // 7. Regular paragraph merge
      let paraText = text;
      let lastItem = item;
      let nextIdx = i + 1;

      while (nextIdx < elements.length) {
        const nextEl = elements[nextIdx];
        if (nextEl.type !== "text") break;

        const nextItem = nextEl.data;
        const nextText = nextItem.text.trim();
        if (!nextText) {
          nextIdx++;
          continue;
        }

        // Stop if next is heading, list item, or table row
        if (getHeadingLevel(nextItem, bodySize, headingMap) !== null) break;
        if (detectListType(nextText)) break;
        if (nextText.includes("\t")) break;

        // Check vertical gap
        const yGap = lastItem.y - nextItem.y;
        const isClose = yGap > 0 && yGap < lastItem.fontSize * 2.2;

        if (isClose) {
          if (paraText.endsWith("-")) {
            paraText = paraText.slice(0, -1) + nextText;
          } else {
            paraText += " " + nextText;
          }
          lastItem = nextItem;
          nextIdx++;
        } else {
          break;
        }
      }

      mdBlocks.push(paraText);
      i = nextIdx;
    }
  }

  return {
    markdown: mdBlocks.join("\n\n"),
    warnings,
    assets,
  };
}
