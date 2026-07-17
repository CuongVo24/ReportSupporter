import type { AssetResolution, ReportAsset, EvidenceItem } from "@/types";
import JSZip from "jszip";
import { rewriteMarkdownRefs } from "./asset-ref-rewrite";

export { rewriteMarkdownRefs } from "./asset-ref-rewrite";

export const WARNING_ASSET_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_ASSET_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_ZIP_ARCHIVE_BYTES = 50 * 1024 * 1024;
export const MAX_ZIP_ENTRIES = 200;
export const MAX_ZIP_ENTRY_BYTES = 50 * 1024 * 1024;
export const MAX_ZIP_EXPANDED_BYTES = 250 * 1024 * 1024;
export const MAX_ZIP_COMPRESSION_RATIO = 100;

type ZipEntryWithMetadata = JSZip.JSZipObject & {
  unsafeOriginalName?: string;
  _data?: {
    compressedSize?: number;
    uncompressedSize?: number;
  };
};

function assertSafeZipPath(entry: ZipEntryWithMetadata): void {
  const originalName = entry.unsafeOriginalName ?? entry.name;
  const normalized = originalName.replace(/\\/g, "/");
  if (
    normalized.startsWith("/") ||
    /^[a-z]:\//i.test(normalized) ||
    normalized.split("/").some((segment) => segment === "..")
  ) {
    throw new Error(`Tệp ZIP chứa đường dẫn không an toàn: ${originalName}`);
  }
}

function assertSafeZipMetadata(entries: ZipEntryWithMetadata[]): void {
  let knownExpandedBytes = 0;

  for (const entry of entries) {
    assertSafeZipPath(entry);
    const compressedSize = entry._data?.compressedSize;
    const uncompressedSize = entry._data?.uncompressedSize;
    if (typeof uncompressedSize !== "number") continue;

    if (uncompressedSize > MAX_ZIP_ENTRY_BYTES) {
      throw new Error(`Tệp "${entry.name}" vượt quá giới hạn giải nén 50MB.`);
    }
    knownExpandedBytes += uncompressedSize;
    if (knownExpandedBytes > MAX_ZIP_EXPANDED_BYTES) {
      throw new Error("Tệp ZIP vượt quá giới hạn 250MB sau khi giải nén.");
    }
    if (
      typeof compressedSize === "number" &&
      uncompressedSize > 0 &&
      (compressedSize === 0 || uncompressedSize / compressedSize > MAX_ZIP_COMPRESSION_RATIO)
    ) {
      throw new Error(`Tỷ lệ nén của "${entry.name}" vượt quá ngưỡng an toàn.`);
    }
  }
}

export type IngestResult = {
  markdown: string;
  assets: ReportAsset[];
  evidence: EvidenceItem[];
  summary: {
    totalScanned: number;
    embeddedCount: number;
    missingCount: number;
    warnings: string[];
    missingList: string[];
    resolutions: AssetResolution[];
  };
};

/**
 * Scan all relative local image references in markdown.
 * Excludes http(s), data:, asset:, and image: schemes.
 */
export function scanImageReferences(markdown: string): string[] {
  const refs = new Set<string>();

  // 1. Markdown image syntax: ![alt](url)
  const mdRegex = /!\[.*?\]\(([^)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(markdown)) !== null) {
    const url = match[1].trim().split(/\s+/)[0]; // strip potential title arguments like "title"
    if (url && !/^(https?:|data:|asset:|image:)/i.test(url)) {
      refs.add(url);
    }
  }

  // 2. HTML img syntax: <img src="url" ...> or <img ... src="url">
  const htmlRegex = /<img\s+[^>]*src=["']([^"']+)["']/gi;
  while ((match = htmlRegex.exec(markdown)) !== null) {
    const url = match[1].trim();
    if (url && !/^(https?:|data:|asset:|image:)/i.test(url)) {
      refs.add(url);
    }
  }

  return Array.from(refs);
}

/**
 * Extracts basename from any slash-separated path.
 */
export function getBasename(path: string): string {
  return path.split(/[/\\]/).pop() || "";
}

export function normalizeRelativePath(path: string): string {
  let decoded = path.trim();
  try { decoded = decodeURIComponent(decoded); } catch { /* keep original text */ }
  return decoded.replace(/\\/gu, "/").replace(/^\.\//u, "").replace(/\/+/gu, "/").toLocaleLowerCase("en-US");
}

function fileRelativePath(file: File): string {
  return normalizeRelativePath(file.webkitRelativePath || file.name);
}

/**
 * Check if path belongs to evidence/minh_chung/appendix folders.
 */
export function isEvidencePath(path: string): boolean {
  const lower = path.toLowerCase();
  return (
    lower.includes("evidence") ||
    lower.includes("minh_chung") ||
    lower.includes("minh-chung") ||
    lower.includes("appendix") ||
    lower.includes("phu_luc") ||
    lower.includes("phu-luc")
  );
}

/**
 * Processes a potential zip file and returns a list of File objects.
 */
export async function unzipFiles(zipFile: File): Promise<File[]> {
  if (zipFile.size > MAX_ZIP_ARCHIVE_BYTES) {
    throw new Error("Tệp ZIP vượt quá giới hạn dung lượng 50MB.");
  }

  const zip = await JSZip.loadAsync(await zipFile.arrayBuffer());
  const entries = Object.values(zip.files).filter((entry) => !entry.dir) as ZipEntryWithMetadata[];
  if (entries.length > MAX_ZIP_ENTRIES) {
    throw new Error(`Tệp ZIP chứa quá nhiều tệp (tối đa ${MAX_ZIP_ENTRIES}).`);
  }
  assertSafeZipMetadata(entries);

  const files: File[] = [];
  let expandedBytes = 0;

  // Decompress sequentially to cap peak memory instead of inflating every
  // archive entry at once with Promise.all.
  for (const zipEntry of entries) {
    const blob = await zipEntry.async("blob");
    if (blob.size > MAX_ZIP_ENTRY_BYTES) {
      throw new Error(`Tệp "${zipEntry.name}" vượt quá giới hạn giải nén 50MB.`);
    }
    expandedBytes += blob.size;
    if (expandedBytes > MAX_ZIP_EXPANDED_BYTES) {
      throw new Error("Tệp ZIP vượt quá giới hạn 250MB sau khi giải nén.");
    }

    const name = zipEntry.name;
    const ext = name.split(".").pop()?.toLowerCase() || "";
    let type = "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
      type = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
    } else if (ext === "md" || ext === "markdown") {
      type = "text/markdown";
    }
    files.push(new File([blob], name, { type }));
  }

  return files;
}

/**
 * Ingest referenced images from a markdown source using a list of available files,
 * converting them to base64 assets and optionally creating evidence items.
 */
export async function ingestAssetsAndEvidence(
  markdown: string,
  availableFiles: File[],
  decisions: { assetSelections?: Record<string, string> } = {},
): Promise<IngestResult> {
  const referencedPaths = scanImageReferences(markdown);
  const assets: ReportAsset[] = [];
  const evidence: EvidenceItem[] = [];
  const replacements: { original: string; assetId: string }[] = [];

  const warnings: string[] = [];
  const missingList: string[] = [];
  let embeddedCount = 0;
  const resolutions: AssetResolution[] = [];

  for (const refPath of referencedPaths) {
    const refBasename = getBasename(refPath).toLowerCase();
    if (!refBasename) {
      missingList.push(refPath);
      continue;
    }

    const normalizedRef = normalizeRelativePath(refPath);
    const exactMatches = availableFiles.filter((file) => fileRelativePath(file) === normalizedRef);
    const basenameMatches = availableFiles.filter(
      (file) => getBasename(fileRelativePath(file)).toLocaleLowerCase("en-US") === refBasename,
    );
    const selectedPath = decisions.assetSelections?.[refPath]
      ? normalizeRelativePath(decisions.assetSelections[refPath])
      : undefined;
    const selected = selectedPath
      ? availableFiles.find((file) => fileRelativePath(file) === selectedPath)
      : undefined;
    const matchedFile = selected ?? exactMatches[0] ?? (basenameMatches.length === 1 ? basenameMatches[0] : undefined);
    const status: AssetResolution["status"] = selected || exactMatches.length === 1
      ? "exact"
      : basenameMatches.length === 1
        ? "unique-basename"
        : basenameMatches.length > 1
          ? "ambiguous"
          : "missing";
    resolutions.push({
      reference: refPath,
      status,
      selectedFileId: matchedFile ? fileRelativePath(matchedFile) : undefined,
      candidateFileIds: (exactMatches.length ? exactMatches : basenameMatches).map(fileRelativePath),
    });

    if (!matchedFile) {
      if (status === "ambiguous") {
        warnings.push(`Có nhiều tệp trùng tên "${getBasename(refPath)}". Hãy chọn đúng đường dẫn trước khi nhập.`);
      }
      missingList.push(refPath);
      continue;
    }

    // Hard limit guard
    if (matchedFile.size > MAX_ASSET_SIZE_BYTES) {
      warnings.push(
        `Bỏ qua file "${matchedFile.name}" vì kích thước (${(
          matchedFile.size /
          (1024 * 1024)
        ).toFixed(1)}MB) vượt quá giới hạn tối đa cho phép (5MB).`
      );
      missingList.push(refPath);
      continue;
    }

    // Warning guard
    if (matchedFile.size > WARNING_ASSET_SIZE_BYTES) {
      warnings.push(
        `Cảnh báo: File "${matchedFile.name}" có dung lượng lớn (${(
          matchedFile.size /
          (1024 * 1024)
        ).toFixed(1)}MB), có thể làm giảm hiệu năng tải.`
      );
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Lỗi đọc file"));
        reader.readAsDataURL(matchedFile);
      });

      const assetId = crypto.randomUUID();
      const asset: ReportAsset = {
        id: assetId,
        kind: "image",
        fileName: matchedFile.name,
        mimeType: matchedFile.type || "image/png",
        data: dataUrl,
        insertedAt: new Date().toISOString(),
      };

      assets.push(asset);
      replacements.push({ original: refPath, assetId });
      embeddedCount++;

      // Identify evidence items by folder structure or file name context
      if (isEvidencePath(refPath) || isEvidencePath(matchedFile.name)) {
        // Humanize title from file name
        const cleanTitle = matchedFile.name
          .replace(/\.[^.]+$/, "") // strip extension
          .replace(/[-_]+/g, " ")  // replace dash/underscore with space
          .trim();

        evidence.push({
          id: crypto.randomUUID(),
          kind: "other",
          title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
          url: `asset:${assetId}`,
          note: `Minh chứng tự động từ import: ${refPath}`,
          qrEnabled: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      warnings.push(`Lỗi khi đọc file "${matchedFile.name}": ${(err as Error).message}`);
      missingList.push(refPath);
    }
  }

  const rewrittenMarkdown = rewriteMarkdownRefs(markdown, replacements);

  return {
    markdown: rewrittenMarkdown,
    assets,
    evidence,
    summary: {
      totalScanned: referencedPaths.length,
      embeddedCount,
      missingCount: missingList.length,
      warnings,
      missingList,
      resolutions,
    },
  };
}
