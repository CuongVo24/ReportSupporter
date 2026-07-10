import type { ReportAsset, ImportWarning } from "@/types";

export interface ExtractAssetsResult {
  markdown: string;
  assets: ReportAsset[];
  warnings: ImportWarning[];
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB cap per image

/**
 * Scans markdown text for inline base64 data-URLs, extracts them as ReportAssets,
 * and rewrites the link paths to the standard 'asset:<id>' format.
 * If any image exceeds the size limit (5MB), it skips the extraction, replaces it with 'image-skipped' path,
 * and issues an 'image-skipped' warning.
 */
export async function extractEmbeddedAssets(
  markdown: string,
  fileNamePrefix: string = "imported-image"
): Promise<ExtractAssetsResult> {
  const assets: ReportAsset[] = [];
  const warnings: ImportWarning[] = [];
  const dataUrlToAssetId = new Map<string, { id: string; isSkipped: boolean }>();

  // 1. Rewrite Markdown image syntax: ![alt](data:image/ext;base64,data)
  let rewrittenMarkdown = markdown.replace(
    /!\[(.*?)\]\((data:image\/([a-zA-Z0-9+]+);base64,([^)]+))\)/g,
    (match, alt, dataUrl, ext, base64Data) => {
      const approximateBytes = Math.round((base64Data.length * 3) / 4);

      if (approximateBytes > MAX_IMAGE_SIZE_BYTES) {
        if (!dataUrlToAssetId.has(dataUrl)) {
          warnings.push({
            code: "image-skipped",
            message: `Bỏ qua hình ảnh nhúng (kích thước ~${(
              approximateBytes /
              (1024 * 1024)
            ).toFixed(1)}MB vượt quá giới hạn 5MB).`,
          });
          dataUrlToAssetId.set(dataUrl, { id: "", isSkipped: true });
        }
        return `![${alt}](image-skipped)`;
      }

      let entry = dataUrlToAssetId.get(dataUrl);
      if (!entry) {
        const assetId = crypto.randomUUID();
        const asset: ReportAsset = {
          id: assetId,
          kind: "image",
          fileName: `${fileNamePrefix}-${assets.length + 1}.${ext === "jpeg" ? "jpg" : ext}`,
          mimeType: `image/${ext}`,
          data: dataUrl,
          insertedAt: new Date().toISOString(),
        };
        assets.push(asset);
        entry = { id: assetId, isSkipped: false };
        dataUrlToAssetId.set(dataUrl, entry);
      }

      return `![${alt}](asset:${entry.id})`;
    }
  );

  // 2. Rewrite HTML image syntax: <img src="data:image/ext;base64,data" ...>
  rewrittenMarkdown = rewrittenMarkdown.replace(
    /(<img\s+[^>]*src=["'])(data:image\/([a-zA-Z0-9+]+);base64,([^"']+))(["'])/gi,
    (match, prefix, dataUrl, ext, base64Data, suffix) => {
      const approximateBytes = Math.round((base64Data.length * 3) / 4);

      if (approximateBytes > MAX_IMAGE_SIZE_BYTES) {
        if (!dataUrlToAssetId.has(dataUrl)) {
          warnings.push({
            code: "image-skipped",
            message: `Bỏ qua hình ảnh nhúng (kích thước ~${(
              approximateBytes /
              (1024 * 1024)
            ).toFixed(1)}MB vượt quá giới hạn 5MB).`,
          });
          dataUrlToAssetId.set(dataUrl, { id: "", isSkipped: true });
        }
        return `${prefix}image-skipped${suffix}`;
      }

      let entry = dataUrlToAssetId.get(dataUrl);
      if (!entry) {
        const assetId = crypto.randomUUID();
        const asset: ReportAsset = {
          id: assetId,
          kind: "image",
          fileName: `${fileNamePrefix}-${assets.length + 1}.${ext === "jpeg" ? "jpg" : ext}`,
          mimeType: `image/${ext}`,
          data: dataUrl,
          insertedAt: new Date().toISOString(),
        };
        assets.push(asset);
        entry = { id: assetId, isSkipped: false };
        dataUrlToAssetId.set(dataUrl, entry);
      }

      return `${prefix}asset:${entry.id}${suffix}`;
    }
  );

  return {
    markdown: rewrittenMarkdown,
    assets,
    warnings,
  };
}
