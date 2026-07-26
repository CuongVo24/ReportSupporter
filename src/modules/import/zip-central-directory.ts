// W25-H: Raw ZIP Central Directory parser.
//
// JSZip's public API does not expose compressed/uncompressed sizes without
// either calling `.async()` (which inflates the entry — too late for a
// preflight check) or reaching into the library's private `entry._data`
// (an implementation detail that can change, and is themselves attacker-
// forgeable input passed straight through from the archive). This module
// reads the ZIP's own Central Directory records directly from the file
// bytes — the same metadata unzip tools rely on — so preflight validation
// has a stable, documented, public data source.
//
// Deliberately conservative: any structural anomaly (bad signature,
// truncated header, offsets pointing outside the buffer) fails CLOSED
// (`valid: false`) rather than guessing.

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const ZIP64_EOCD_LOCATOR_SIGNATURE = 0x07064b50;
const ZIP64_EOCD_SIGNATURE = 0x06064b50;
const ZIP64_EXTRA_TAG = 0x0001;
const EOCD_MIN_SIZE = 22;
const CENTRAL_DIR_HEADER_SIZE = 46;
const MAX_COMMENT_SEARCH = 65_557; // EOCD fixed size (22) + max comment length (65535)

export type ZipCentralDirectoryEntry = {
  /** Raw filename bytes decoded as UTF-8 (or CP437 fallback) — NOT sanitized. */
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  /** General purpose bit flag, bit 0 — entry is encrypted. */
  encrypted: boolean;
};

export type ZipCentralDirectoryResult =
  | { valid: true; entries: ZipCentralDirectoryEntry[] }
  | { valid: false; error: string };

function decodeName(view: DataView, offset: number, length: number): string {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // Legacy (non UTF-8 flag) entries are commonly CP437/Latin-1 — decode
    // best-effort rather than failing the whole archive over a filename.
    return new TextDecoder("latin1").decode(bytes);
  }
}

function findEndOfCentralDirectory(view: DataView): number {
  const searchStart = Math.max(0, view.byteLength - MAX_COMMENT_SEARCH);
  for (let i = view.byteLength - EOCD_MIN_SIZE; i >= searchStart; i -= 1) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) return i;
  }
  return -1;
}

/**
 * Reads ZIP64 end-of-central-directory fields when the classic EOCD record
 * signals overflow (0xFFFF / 0xFFFFFFFF placeholders). Returns null if this
 * isn't actually a ZIP64 archive (classic fields were used as-is).
 */
function tryReadZip64Eocd(
  view: DataView,
  eocdOffset: number,
): { entryCount: number; centralDirOffset: number; centralDirSize: number } | null {
  const locatorOffset = eocdOffset - 20;
  if (locatorOffset < 0) return null;
  if (view.getUint32(locatorOffset, true) !== ZIP64_EOCD_LOCATOR_SIGNATURE) return null;

  const zip64EocdOffsetLow = view.getUint32(locatorOffset + 8, true);
  const zip64EocdOffsetHigh = view.getUint32(locatorOffset + 12, true);
  if (zip64EocdOffsetHigh !== 0) return null; // beyond safe JS integer range — treat as unsupported
  const zip64EocdOffset = zip64EocdOffsetLow;

  if (zip64EocdOffset + 56 > view.byteLength) return null;
  if (view.getUint32(zip64EocdOffset, true) !== ZIP64_EOCD_SIGNATURE) return null;

  const entryCountLow = view.getUint32(zip64EocdOffset + 32, true);
  const entryCountHigh = view.getUint32(zip64EocdOffset + 36, true);
  const centralDirSizeLow = view.getUint32(zip64EocdOffset + 40, true);
  const centralDirSizeHigh = view.getUint32(zip64EocdOffset + 44, true);
  const centralDirOffsetLow = view.getUint32(zip64EocdOffset + 48, true);
  const centralDirOffsetHigh = view.getUint32(zip64EocdOffset + 52, true);

  if (entryCountHigh !== 0 || centralDirSizeHigh !== 0 || centralDirOffsetHigh !== 0) {
    return null; // archive exceeds 4 GiB metadata range — unsupported, caller rejects
  }

  return {
    entryCount: entryCountLow,
    centralDirOffset: centralDirOffsetLow,
    centralDirSize: centralDirSizeLow,
  };
}

function readZip64ExtraSizes(
  view: DataView,
  extraOffset: number,
  extraLength: number,
  needsUncompressed: boolean,
  needsCompressed: boolean,
): { uncompressedSize?: number; compressedSize?: number } {
  let cursor = extraOffset;
  const end = extraOffset + extraLength;
  while (cursor + 4 <= end) {
    const tag = view.getUint16(cursor, true);
    const size = view.getUint16(cursor + 2, true);
    if (cursor + 4 + size > end) break;
    if (tag === ZIP64_EXTRA_TAG) {
      let fieldCursor = cursor + 4;
      let uncompressedSize: number | undefined;
      let compressedSize: number | undefined;
      if (needsUncompressed && fieldCursor + 8 <= cursor + 4 + size) {
        const low = view.getUint32(fieldCursor, true);
        const high = view.getUint32(fieldCursor + 4, true);
        uncompressedSize = high !== 0 ? Number.MAX_SAFE_INTEGER : low;
        fieldCursor += 8;
      }
      if (needsCompressed && fieldCursor + 8 <= cursor + 4 + size) {
        const low = view.getUint32(fieldCursor, true);
        const high = view.getUint32(fieldCursor + 4, true);
        compressedSize = high !== 0 ? Number.MAX_SAFE_INTEGER : low;
      }
      return { uncompressedSize, compressedSize };
    }
    cursor += 4 + size;
  }
  return {};
}

export function parseZipCentralDirectory(buffer: ArrayBuffer): ZipCentralDirectoryResult {
  if (buffer.byteLength < EOCD_MIN_SIZE) {
    return { valid: false, error: "Tệp ZIP quá nhỏ hoặc không hợp lệ." };
  }

  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(view);
  if (eocdOffset === -1) {
    return { valid: false, error: "Không tìm thấy cấu trúc ZIP hợp lệ (thiếu End Of Central Directory)." };
  }

  let entryCount = view.getUint16(eocdOffset + 10, true);
  let centralDirOffset = view.getUint32(eocdOffset + 16, true);
  let centralDirSize = view.getUint32(eocdOffset + 12, true);

  if (entryCount === 0xffff || centralDirOffset === 0xffffffff || centralDirSize === 0xffffffff) {
    const zip64 = tryReadZip64Eocd(view, eocdOffset);
    if (!zip64) {
      return { valid: false, error: "Tệp ZIP dùng ZIP64 nhưng thiếu bản ghi ZIP64 End Of Central Directory hợp lệ." };
    }
    entryCount = zip64.entryCount;
    centralDirOffset = zip64.centralDirOffset;
    centralDirSize = zip64.centralDirSize;
  }

  if (centralDirOffset + centralDirSize > buffer.byteLength) {
    return { valid: false, error: "Cấu trúc ZIP Central Directory trỏ ra ngoài phạm vi tệp." };
  }

  const entries: ZipCentralDirectoryEntry[] = [];
  let cursor = centralDirOffset;
  const centralDirEnd = centralDirOffset + centralDirSize;

  for (let i = 0; i < entryCount; i += 1) {
    if (cursor + CENTRAL_DIR_HEADER_SIZE > centralDirEnd || cursor + CENTRAL_DIR_HEADER_SIZE > buffer.byteLength) {
      return { valid: false, error: "Central Directory bị cắt ngắn hoặc số lượng mục khai báo sai." };
    }
    if (view.getUint32(cursor, true) !== CENTRAL_DIR_SIGNATURE) {
      return { valid: false, error: "Central Directory chứa header không đúng chữ ký ZIP." };
    }

    const generalPurposeFlag = view.getUint16(cursor + 8, true);
    const compressionMethod = view.getUint16(cursor + 10, true);
    let compressedSize = view.getUint32(cursor + 20, true);
    let uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);

    const nameOffset = cursor + CENTRAL_DIR_HEADER_SIZE;
    if (nameOffset + nameLength + extraLength + commentLength > buffer.byteLength) {
      return { valid: false, error: "Mục ZIP có trường tên/extra/comment vượt ra ngoài tệp." };
    }
    const name = decodeName(view, nameOffset, nameLength);

    const needsZip64 = compressedSize === 0xffffffff || uncompressedSize === 0xffffffff;
    if (needsZip64) {
      const extraOffset = nameOffset + nameLength;
      const zip64Sizes = readZip64ExtraSizes(
        view,
        extraOffset,
        extraLength,
        uncompressedSize === 0xffffffff,
        compressedSize === 0xffffffff,
      );
      if (uncompressedSize === 0xffffffff) {
        if (zip64Sizes.uncompressedSize === undefined) {
          return { valid: false, error: `Mục ${name} khai báo ZIP64 nhưng thiếu extra field kích thước thật.` };
        }
        uncompressedSize = zip64Sizes.uncompressedSize;
      }
      if (compressedSize === 0xffffffff) {
        if (zip64Sizes.compressedSize === undefined) {
          return { valid: false, error: `Mục ${name} khai báo ZIP64 nhưng thiếu extra field kích thước thật.` };
        }
        compressedSize = zip64Sizes.compressedSize;
      }
    }

    entries.push({
      name,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      encrypted: (generalPurposeFlag & 0x0001) !== 0,
    });

    cursor = nameOffset + nameLength + extraLength + commentLength;
  }

  if (cursor !== centralDirEnd) {
    return {
      valid: false,
      error: "Kích thước Central Directory không khớp số lượng/header mục đã khai báo.",
    };
  }

  return { valid: true, entries };
}
