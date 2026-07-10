import type { ImportConverter, ImportResult } from "@/types";
import { markdownConverter } from "./converters/markdown";
import { docxConverter } from "./converters/docx";
import { pdfConverter } from "./converters/pdf";
import { xlsxConverter } from "./converters/xlsx";
import { pptxConverter } from "./converters/pptx";
import { runInWorker } from "./worker-client";
import { extractTextFromPdf } from "./pdf/extract-text";
import { buildHeadingMap } from "./pdf/heading-heuristic";
import { convertPdfPagesToMarkdown } from "./pdf/paragraph-merge";

const converters: ImportConverter[] = [];

/**
 * Registers an import converter in the registry.
 */
export function registerConverter(converter: ImportConverter): void {
  if (converters.some((c) => c.format === converter.format)) {
    return;
  }
  converters.push(converter);
}

/**
 * Resolves the appropriate converter for a given file name and MIME type.
 * Prioritizes extension matches (extension wins if MIME is empty or invalid).
 */
export function resolveConverter(file: { name: string; type: string }): ImportConverter | null {
  const name = file.name.trim().toLowerCase();
  const mime = file.type.trim().toLowerCase();

  // 1. Extension-first match
  for (const converter of converters) {
    if (converter.extensions.some((ext) => name.endsWith(ext.toLowerCase()))) {
      return converter;
    }
  }

  // 2. MIME-type fallback match
  if (mime) {
    for (const converter of converters) {
      if (converter.mimeTypes.some((m) => m.toLowerCase() === mime)) {
        return converter;
      }
    }
  }

  return null;
}

/**
 * Returns a list of all registered extensions.
 */
export function getSupportedExtensions(): string[] {
  return converters.flatMap((c) => c.extensions);
}

/**
 * Returns a list of all registered formats (e.g. ["MARKDOWN", "DOCX"]).
 */
export function getSupportedFormats(): string[] {
  return converters.map((c) => c.format.toUpperCase());
}


/**
 * Converts a file using the resolved converter.
 * Enforces size limits and throws a custom error if unsupported or oversized.
 */
export async function convertImportFile(
  file: File,
  onProgress?: (progress: number, stage?: string) => void,
  abortSignal?: AbortSignal
): Promise<ImportResult> {
  const converter = resolveConverter(file);
  if (!converter) {
    const supportedList = getSupportedFormats().join(", ");
    throw new Error(
      `Định dạng file không được hỗ trợ. Các định dạng được hỗ trợ: ${supportedList}`
    );
  }

  if (file.size > converter.maxBytes) {
    const maxMb = Math.round(converter.maxBytes / (1024 * 1024));
    const error = new Error(`File vượt quá giới hạn dung lượng ${maxMb}MB.`) as Error & { code?: string };
    error.code = "file-too-large";
    throw error;
  }

  // If in browser environment and Web Workers are supported, run heavy converters in Web Worker
  if (typeof window !== "undefined" && typeof Worker !== "undefined") {
    if (converter.format === "docx" || converter.format === "xlsx" || converter.format === "pptx") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        return await runInWorker(
          converter.format,
          file.name,
          arrayBuffer,
          undefined,
          onProgress ? (p) => onProgress(p.percent, p.stage) : undefined,
          abortSignal
        );
      } catch (err: unknown) {
        const error = err as Error;
        if (error.message === "FALLBACK_TO_MAIN_THREAD") {
          // Fallback to main thread execution
          return converter.convert(file, onProgress);
        }
        throw error;
      }
    }

    if (converter.format === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      // 1. Extract raw text items using pdf.js worker on main thread
      const { pages, warnings: extractionWarnings } = await extractTextFromPdf(
        arrayBuffer,
        onProgress ? (page, total) => onProgress(Math.round((page / total) * 100), "Trích xuất văn bản từ PDF...") : undefined
      );

      // 2. Run heuristic steps in worker
      try {
        const workerResult = await runInWorker(
          "pdf",
          file.name,
          undefined,
          pages,
          onProgress ? (p) => onProgress(p.percent, p.stage) : undefined,
          abortSignal
        );
        workerResult.warnings = [...extractionWarnings, ...workerResult.warnings];
        return workerResult;
      } catch {
        // Fallback to main thread heuristic
        const { bodySize, headingMap } = buildHeadingMap(pages);
        const { markdown, warnings: layoutWarnings, assets } = convertPdfPagesToMarkdown(pages, bodySize, headingMap);
        return {
          sourceFormat: "pdf",
          fileName: file.name,
          markdown,
          assets,
          warnings: [...extractionWarnings, ...layoutWarnings],
          convertedAt: new Date().toISOString(),
        };
      }
    }
  }

  return converter.convert(file, onProgress);
}

// Bootstrap registry with the baseline Markdown and DOCX converters
registerConverter(markdownConverter);
registerConverter(docxConverter);
registerConverter(pdfConverter);
registerConverter(xlsxConverter);
registerConverter(pptxConverter);

