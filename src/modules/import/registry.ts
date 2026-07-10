import type { ImportConverter, ImportResult } from "@/types";
import { markdownConverter } from "./converters/markdown";
import { docxConverter } from "./converters/docx";
import { pdfConverter } from "./converters/pdf";
import { xlsxConverter } from "./converters/xlsx";
import { pptxConverter } from "./converters/pptx";

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
  onProgress?: (progress: number) => void
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

  return converter.convert(file, onProgress);
}

// Bootstrap registry with the baseline Markdown and DOCX converters
registerConverter(markdownConverter);
registerConverter(docxConverter);
registerConverter(pdfConverter);
registerConverter(xlsxConverter);
registerConverter(pptxConverter);
