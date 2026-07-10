import * as pdfjs from "pdfjs-dist";
import type { ImportWarning } from "@/types";
import { extractPageImages, type ImageItem } from "./extract-images";

export interface TextItem {
  text: string;
  fontSize: number;
  fontName: string;
  x: number;
  y: number;
  width: number;
}

export interface ExtractedPage {
  pageNumber: number; // 1-indexed
  width: number;
  height: number;
  items: TextItem[];
  images?: ImageItem[];
}

/**
 * Normalizes and sorts text items extracted from a PDF page.
 * Sorts top-to-bottom (y descending) and left-to-right (x ascending).
 */
export function sortTextItems(items: TextItem[]): TextItem[] {
  return [...items].sort((a, b) => {
    // 1. Sort top-to-bottom: y is descending in PDF space
    // Tolerance of 5 units for being on the same line
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > 5) {
      return yDiff;
    }
    // 2. Sort left-to-right: x is ascending
    return a.x - b.x;
  });
}

/**
 * Merges horizontally adjacent text items on the same line to form coherent text segments.
 * Inserts spaces if the gap between items is within word-space bounds.
 */
export function mergeAdjacentTextItems(items: TextItem[]): TextItem[] {
  if (items.length === 0) return [];

  const merged: TextItem[] = [];
  let current = { ...items[0] };

  for (let i = 1; i < items.length; i++) {
    const next = items[i];

    const yDiff = Math.abs(next.y - current.y);
    const xGap = next.x - (current.x + current.width);

    // If on same line (y diff is tiny)
    const isSameLine = yDiff < 3;
    // Gap check
    const isClose = xGap >= -1 && xGap < Math.max(3, current.fontSize * 0.2);
    const isSpace = xGap >= Math.max(3, current.fontSize * 0.2) && xGap < Math.max(10, current.fontSize * 0.6);

    if (isSameLine && (isClose || isSpace)) {
      if (isSpace && !current.text.endsWith(" ") && !next.text.startsWith(" ")) {
        current.text += " ";
      }
      current.text += next.text;
      current.width = next.x + next.width - current.x;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

/**
 * Extracts plain text items with font and coordinate metadata from a PDF file.
 * Returns plain serializable objects for offline/worker compatibility.
 */
export async function extractTextFromPdf(
  arrayBuffer: ArrayBuffer,
  onProgress?: (pageNum: number, totalPages: number) => void
): Promise<{ pages: ExtractedPage[]; warnings: ImportWarning[] }> {
  // Ensure worker is configured locally
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
  }

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: "/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/standard_fonts/",
  });

  let pdfDoc;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err: unknown) {
    const error = err as Error;
    if (error && error.name === "PasswordException") {
      throw new Error("Tài liệu PDF được mã hóa bảo mật. Vui lòng giải mã trước khi import.");
    }
    throw new Error(`Không thể đọc tài liệu PDF: ${error?.message || "Lỗi không xác định"}`);
  }

  // Enforce page cap (300 pages) before parsing
  const numPages = pdfDoc.numPages;
  if (numPages > 300) {
    const error = new Error(`File vượt quá giới hạn 300 trang (tổng cộng ${numPages} trang).`) as Error & { code?: string };
    error.code = "file-too-large";
    throw error;
  }

  const pages: ExtractedPage[] = [];
  const warnings: ImportWarning[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const ops = await page.getOperatorList();

    // Extract images on this page
    const images = await extractPageImages(page, ops, i, warnings);

    const rawItems: TextItem[] = [];

    for (const item of textContent.items) {
      // Cast item safely using typescript properties check
      const textItem = item as {
        str?: string;
        transform?: number[];
        fontName?: string;
        width?: number;
      };
      if (textItem.str !== undefined && textItem.str.trim().length > 0 && textItem.transform !== undefined) {
        const str = textItem.str;
        const transform = textItem.transform; // [a, b, c, d, e, f]
        const fontSize = Math.round(Math.abs(transform[3]) * 100) / 100;
        
        const rawFont = textItem.fontName || "";
        const lowerRaw = rawFont.toLowerCase();
        const isBold = lowerRaw.includes("bold") || 
                       lowerRaw.includes("semibold") || 
                       lowerRaw.includes("heavy") || 
                       lowerRaw.includes("black") || 
                       lowerRaw.includes("-db") || 
                       lowerRaw.includes("-bold");

        let fontName = rawFont || "unknown";
        if (textContent.styles && textContent.styles[fontName]) {
          fontName = textContent.styles[fontName].fontFamily || fontName;
        }
        if (isBold) {
          fontName += " (Bold)";
        }

        const x = transform[4];
        const y = transform[5];

        rawItems.push({
          text: str,
          fontSize: fontSize || 10,
          fontName,
          x,
          y,
          width: textItem.width || 0,
        });
      }
    }

    // Sort and merge adjacent items on the same line
    const sorted = sortTextItems(rawItems);
    const merged = mergeAdjacentTextItems(sorted);

    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      items: merged,
      images,
    });

    if (onProgress) {
      onProgress(i, pdfDoc.numPages);
    }
  }

  return { pages, warnings };
}
