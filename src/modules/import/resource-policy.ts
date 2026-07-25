// W25-H: Centralized resource budget and supply-chain / archive bomb preflight validator.
import type JSZip from "jszip";

export const IMPORT_LIMITS = {
  // Input File Limit
  MAX_INPUT_BYTES: 50 * 1024 * 1024, // 50 MiB

  // ZIP / Archive Preflight Limits
  MAX_ZIP_ENTRIES: 5_000,
  MAX_ZIP_TOTAL_UNCOMPRESSED_BYTES: 250 * 1024 * 1024, // 250 MiB
  MAX_ZIP_SINGLE_ENTRY_BYTES: 100 * 1024 * 1024, // 100 MiB
  MAX_ZIP_COMPRESSION_RATIO: 100, // max ratio (uncompressed / compressed)
  MAX_ZIP_PATH_DEPTH: 20,
  MAX_ZIP_PATH_LENGTH: 512,

  // DOCX Limits
  MAX_DOCX_MEDIA_FILES: 500,

  // PPTX Limits
  MAX_PPTX_SLIDES: 300,
  MAX_PPTX_MEDIA_FILES: 500,

  // XLSX Limits
  MAX_XLSX_SHEETS: 50,
  MAX_XLSX_ROWS_PER_SHEET: 500,
  MAX_XLSX_COLS_PER_SHEET: 30,

  // PDF & OCR Limits
  MAX_PDF_PAGES: 300,
  MAX_PDF_TOTAL_DECODED_PIXELS: 100_000_000, // 100 Megapixels total
  MAX_OCR_CANVAS_DIMENSION: 8_192,
  MAX_OCR_DECODED_PIXELS: 64_000_000, // 64 Megapixels
};

export class ImportBudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportBudgetExceededError";
  }
}

/**
 * Inspects a JSZip instance before inflating files to detect ZIP bombs, path traversal,
 * or excessive uncompressed allocations.
 */
export function validateZipPreflight(zip: JSZip): { valid: boolean; error?: string } {
  const entries = Object.values(zip.files);

  if (entries.length > IMPORT_LIMITS.MAX_ZIP_ENTRIES) {
    return {
      valid: false,
      error: `Tệp ZIP chứa quá nhiều mục (${entries.length} mục; tối đa ${IMPORT_LIMITS.MAX_ZIP_ENTRIES}).`,
    };
  }

  let totalDeclaredBytes = 0;

  for (const entry of entries) {
    const name = entry.name || "";

    // 1. Path traversal check
    if (name.includes("../") || name.includes("..\\")) {
      return {
        valid: false,
        error: `Tệp nén chứa đường dẫn không an toàn (path traversal): ${name}`,
      };
    }

    // 2. Path length & depth check
    if (name.length > IMPORT_LIMITS.MAX_ZIP_PATH_LENGTH) {
      return {
        valid: false,
        error: `Độ dài đường dẫn mục quá lớn (${name.length} ký tự).`,
      };
    }

    const depth = name.split(/[/\\]/).filter(Boolean).length;
    if (depth > IMPORT_LIMITS.MAX_ZIP_PATH_DEPTH) {
      return {
        valid: false,
        error: `Cấu trúc thư mục lồng quá sâu (${depth} cấp).`,
      };
    }

    // 3. Inspect entry byte metadata (if available in JSZip internal data)
    // JSZip stores compressed/uncompressed sizes in entry._data or entry
    const entryData = (entry as unknown as { _data?: { uncompressedSize?: number; compressedSize?: number } })._data;
    const uncompressedSize = entryData?.uncompressedSize ?? 0;
    const compressedSize = entryData?.compressedSize ?? 0;

    if (uncompressedSize > IMPORT_LIMITS.MAX_ZIP_SINGLE_ENTRY_BYTES) {
      return {
        valid: false,
        error: `Mục ${name} giải nén quá lớn (${Math.round(uncompressedSize / 1024 / 1024)}MB; tối đa 100MB).`,
      };
    }

    if (compressedSize > 100 * 1024 && uncompressedSize > 0) {
      const ratio = uncompressedSize / compressedSize;
      if (ratio > IMPORT_LIMITS.MAX_ZIP_COMPRESSION_RATIO) {
        return {
          valid: false,
          error: `Phát hiện nguy cơ ZIP bomb (tỷ lệ nén ${Math.round(ratio)}x ở mục ${name}).`,
        };
      }
    }

    totalDeclaredBytes += uncompressedSize;
  }

  if (totalDeclaredBytes > IMPORT_LIMITS.MAX_ZIP_TOTAL_UNCOMPRESSED_BYTES) {
    return {
      valid: false,
      error: `Tổng dung lượng giải nén vượt quá giới hạn an toàn (${Math.round(totalDeclaredBytes / 1024 / 1024)}MB; tối đa 250MB).`,
    };
  }

  return { valid: true };
}

/**
 * Tracker for actual observed inflated bytes during streaming/unpacking.
 * Prevents forged ZIP metadata attacks by throwing if observed bytes exceed limits.
 */
export function createInflationTracker(
  maxTotalBytes = IMPORT_LIMITS.MAX_ZIP_TOTAL_UNCOMPRESSED_BYTES,
) {
  let observedTotalBytes = 0;

  return {
    track(bytesCount: number) {
      observedTotalBytes += bytesCount;
      if (observedTotalBytes > maxTotalBytes) {
        throw new ImportBudgetExceededError(
          `Dung lượng giải nén thực tế vượt giới hạn an toàn (${Math.round(observedTotalBytes / 1024 / 1024)}MB; tối đa ${Math.round(maxTotalBytes / 1024 / 1024)}MB).`,
        );
      }
    },
    getObservedBytes() {
      return observedTotalBytes;
    },
  };
}

/**
 * Validates PDF or OCR canvas dimensions and cumulative decoded pixel counts.
 */
export function validateCanvasPixels(
  width: number,
  height: number,
  currentTotalPixels = 0,
  maxTotalPixels = IMPORT_LIMITS.MAX_PDF_TOTAL_DECODED_PIXELS,
): { valid: boolean; error?: string } {
  if (width > IMPORT_LIMITS.MAX_OCR_CANVAS_DIMENSION || height > IMPORT_LIMITS.MAX_OCR_CANVAS_DIMENSION) {
    return {
      valid: false,
      error: `Kích thước hình ảnh/trang quá lớn (${width}x${height}; tối đa ${IMPORT_LIMITS.MAX_OCR_CANVAS_DIMENSION}px).`,
    };
  }

  const framePixels = width * height;
  if (currentTotalPixels + framePixels > maxTotalPixels) {
    return {
      valid: false,
      error: `Tổng số điểm ảnh (pixels) giải nén vượt quá giới hạn an toàn (${Math.round((currentTotalPixels + framePixels) / 1_000_000)}Mpx; tối đa ${Math.round(maxTotalPixels / 1_000_000)}Mpx).`,
    };
  }

  return { valid: true };
}
