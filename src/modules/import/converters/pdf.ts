import type { ImportConverter, ImportResult } from "@/types";
import { extractTextFromPdf } from "../pdf/extract-text";
import { buildHeadingMap } from "../pdf/heading-heuristic";
import { convertPdfPagesToMarkdown } from "../pdf/paragraph-merge";

/**
 * Converter for PDF documents using pdfjs-dist.
 * Runs on the client side, dynamic imports pdfjs-dist to optimize main bundle size.
 * Extracts text items with coordinates for layout heuristic processing.
 */
export const pdfConverter: ImportConverter = {
  format: "pdf",
  extensions: [".pdf"],
  mimeTypes: ["application/pdf"],
  maxBytes: 50 * 1024 * 1024, // 50MB
  convert: async (
    file: File,
    onProgress?: (progress: number) => void,
    abortSignal?: AbortSignal,
  ): Promise<ImportResult> => {
    if (abortSignal?.aborted) throw new Error("Import cancelled");
    const arrayBuffer = await file.arrayBuffer();
    if (abortSignal?.aborted) throw new Error("Import cancelled");

    // 1. Extract raw text items with font and position metadata
    const { pages, warnings: extractionWarnings } = await extractTextFromPdf(
      arrayBuffer,
      onProgress ? (page, total) => onProgress(Math.round((page / total) * 100)) : undefined,
      abortSignal,
    );

    if (abortSignal?.aborted) throw new Error("Import cancelled");

    // 2. Analyze document styles for font size histogram & heading map
    const { bodySize, headingMap } = buildHeadingMap(pages);

    // 3. Convert pages to Markdown with layout heuristics
    const { markdown, warnings: layoutWarnings, assets } = convertPdfPagesToMarkdown(pages, bodySize, headingMap);

    const warnings = [...extractionWarnings, ...layoutWarnings];

    return {
      sourceFormat: "pdf",
      fileName: file.name,
      markdown,
      assets,
      warnings,
      convertedAt: new Date().toISOString(),
    };
  },
};
