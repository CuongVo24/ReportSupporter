import type { ImportConverter, ImportResult } from "@/types";

/**
 * Baseline converter for Markdown (.md) documents.
 * Reads plain text content and wraps it in the canonical ImportResult structure.
 */
export const markdownConverter: ImportConverter = {
  format: "markdown",
  extensions: [".md", ".markdown", ".mdown", ".mkd"],
  mimeTypes: ["text/markdown", "text/x-markdown"],
  maxBytes: 50 * 1024 * 1024, // 50MB (MAX_MARKDOWN_IMPORT_BYTES)
  convert: async (file: File): Promise<ImportResult> => {
    const text = await file.text();
    if (!text.trim()) {
      throw new Error("File Markdown đang trống.");
    }
    return {
      sourceFormat: "markdown",
      fileName: file.name,
      markdown: text,
      assets: [],
      warnings: [],
      convertedAt: new Date().toISOString(),
    };
  },
};
