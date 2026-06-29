import type { ReportAsset, EvidenceItem } from "@/types";
import JSZip from "jszip";

export const WARNING_ASSET_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_ASSET_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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
 * Safe rewriting of reference strings in markdown source to asset:id format.
 */
export function rewriteMarkdownRefs(
  markdown: string,
  replacements: { original: string; assetId: string }[]
): string {
  let result = markdown;
  for (const rep of replacements) {
    const escapedPath = rep.original.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    
    // Rewrite markdown format: ![alt](original) -> ![alt](asset:id)
    const mdRegex = new RegExp(`(!\\[.*?\\]\\()${escapedPath}(\\))`, "g");
    result = result.replace(mdRegex, `$1asset:${rep.assetId}$2`);

    // Rewrite HTML format: <img src="original"> -> <img src="asset:id">
    const htmlRegex = new RegExp(`(<img\\s+[^>]*src=["'])${escapedPath}(["'])`, "gi");
    result = result.replace(htmlRegex, `$1asset:${rep.assetId}$2`);
  }
  return result;
}

/**
 * Processes a potential zip file and returns a list of File objects.
 */
export async function unzipFiles(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(zipFile);
  const files: File[] = [];
  const promises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;

    const promise = zipEntry.async("blob").then((blob) => {
      const name = zipEntry.name;
      const ext = name.split(".").pop()?.toLowerCase() || "";
      let type = "";
      if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
        type = `image/${ext === "jpg" ? "jpeg" : ext}`;
      } else if (ext === "md" || ext === "markdown") {
        type = "text/markdown";
      }

      const file = new File([blob], name, { type });
      files.push(file);
    });
    promises.push(promise);
  });

  await Promise.all(promises);
  return files;
}

/**
 * Ingest referenced images from a markdown source using a list of available files,
 * converting them to base64 assets and optionally creating evidence items.
 */
export async function ingestAssetsAndEvidence(
  markdown: string,
  availableFiles: File[]
): Promise<IngestResult> {
  const referencedPaths = scanImageReferences(markdown);
  const assets: ReportAsset[] = [];
  const evidence: EvidenceItem[] = [];
  const replacements: { original: string; assetId: string }[] = [];

  const warnings: string[] = [];
  const missingList: string[] = [];
  let embeddedCount = 0;

  for (const refPath of referencedPaths) {
    const refBasename = getBasename(refPath).toLowerCase();
    if (!refBasename) {
      missingList.push(refPath);
      continue;
    }

    // Basename matching
    const matchedFile = availableFiles.find(
      (f) => getBasename(f.name).toLowerCase() === refBasename
    );

    if (!matchedFile) {
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
    },
  };
}
