// W25-H: Centralized resource budget and supply-chain / archive bomb preflight validator.
import { parseZipCentralDirectory } from "./zip-central-directory";

export const IMPORT_LIMITS = {
  // Input File Limit
  MAX_INPUT_BYTES: 50 * 1024 * 1024, // 50 MiB

  // Directory/multi-file drop limits
  MAX_DROPPED_FILES: 500,
  MAX_DROPPED_TOTAL_BYTES: 500 * 1024 * 1024, // 500 MiB aggregate per drop

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
 * Inspects a ZIP archive's raw Central Directory (public, documented file
 * format — not JSZip's private `_data`) before any inflation to detect ZIP
 * bombs, path traversal, encrypted/unsupported entries, and duplicate
 * names. Metadata missing or unreadable fails CLOSED.
 */
export function validateZipPreflight(buffer: ArrayBuffer): { valid: boolean; error?: string } {
  const parsed = parseZipCentralDirectory(buffer);
  if (!parsed.valid) {
    return { valid: false, error: parsed.error };
  }
  const entries = parsed.entries;

  if (entries.length > IMPORT_LIMITS.MAX_ZIP_ENTRIES) {
    return {
      valid: false,
      error: `Tệp ZIP chứa quá nhiều mục (${entries.length} mục; tối đa ${IMPORT_LIMITS.MAX_ZIP_ENTRIES}).`,
    };
  }

  let totalDeclaredBytes = 0;
  const seenNormalizedNames = new Set<string>();

  for (const entry of entries) {
    // The raw (unsanitized) name as stored in the archive — never the
    // sanitized/normalized form a caller might display, so traversal
    // sequences hidden by mixed separators/encoding are still caught here.
    const name = entry.name || "";

    if (entry.encrypted) {
      return {
        valid: false,
        error: `Mục ${name} được mã hoá — không hỗ trợ tệp nén có mật khẩu.`,
      };
    }
    // Compression method 0 = stored, 8 = deflate. Anything else (e.g.
    // deflate64, bzip2, LZMA) is unsupported by the decompressors this app
    // actually uses downstream and is rejected rather than risking a
    // parser-differential bypass of the ratio/size checks below.
    if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) {
      return {
        valid: false,
        error: `Mục ${name} dùng phương thức nén không được hỗ trợ (method ${entry.compressionMethod}).`,
      };
    }

    // 1. Path traversal check
    if (name.includes("../") || name.includes("..\\") || name.startsWith("/") || /^[a-zA-Z]:/u.test(name) || name.startsWith("\\\\")) {
      return {
        valid: false,
        error: `Tệp nén chứa đường dẫn không an toàn (path traversal/absolute path): ${name}`,
      };
    }
    if (name.includes("\0")) {
      return {
        valid: false,
        error: `Tệp nén chứa tên mục không hợp lệ (NUL byte): ${name}`,
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

    // 3. Duplicate normalized name (case/separator-insensitive) — a common
    // archive-confusion trick where two entries resolve to the same
    // extracted path and downstream code silently uses whichever it reads last.
    const normalized = name.toLowerCase().replace(/\\/gu, "/");
    if (seenNormalizedNames.has(normalized)) {
      return {
        valid: false,
        error: `Tệp nén chứa tên mục trùng lặp sau khi chuẩn hoá: ${name}`,
      };
    }
    seenNormalizedNames.add(normalized);

    const { uncompressedSize, compressedSize } = entry;

    if (uncompressedSize > IMPORT_LIMITS.MAX_ZIP_SINGLE_ENTRY_BYTES) {
      return {
        valid: false,
        error: `Mục ${name} giải nén quá lớn (${Math.round(uncompressedSize / 1024 / 1024)}MB; tối đa 100MB).`,
      };
    }

    // Compression-ratio bomb check. NOTE: the dangerous case is exactly a
    // SMALL compressed size with a huge uncompressed size — a prior version
    // of this check only computed the ratio when compressedSize exceeded
    // 100 KiB, which is backwards: it exempted the most compressible (most
    // bomb-like) entries from the ratio check entirely. Guard only against
    // compressedSize === 0 (division by zero) and require uncompressedSize
    // above a small noise floor so a handful-of-bytes entry can't produce a
    // meaningless "infinite" ratio.
    if (uncompressedSize > 4096) {
      if (compressedSize === 0) {
        return {
          valid: false,
          error: `Phát hiện nguy cơ ZIP bomb (mục ${name} có kích thước nén bằng 0 nhưng giải nén ${Math.round(uncompressedSize / 1024)}KB).`,
        };
      }
      const ratio = uncompressedSize / compressedSize;
      if (ratio > IMPORT_LIMITS.MAX_ZIP_COMPRESSION_RATIO) {
        return {
          valid: false,
          error: `Phát hiện nguy cơ ZIP bomb (tỷ lệ nén ${Math.round(ratio)}x ở mục ${name}).`,
        };
      }
    }

    totalDeclaredBytes += uncompressedSize;
    if (totalDeclaredBytes > IMPORT_LIMITS.MAX_ZIP_TOTAL_UNCOMPRESSED_BYTES) {
      return {
        valid: false,
        error: `Tổng dung lượng giải nén vượt quá giới hạn an toàn (${Math.round(totalDeclaredBytes / 1024 / 1024)}MB; tối đa 250MB).`,
      };
    }
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
