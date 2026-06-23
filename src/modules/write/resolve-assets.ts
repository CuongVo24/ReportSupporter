import type { ReportAsset } from "@/types";

/**
 * Replaces offline asset references in the format `asset:<id>` or `image:asset_id`
 * with the corresponding base64 data URLs from the project assets.
 * Leaves them untouched if the asset is not found.
 */
export function resolveAssetRefs(html: string, assets: ReportAsset[]): string {
  if (!assets || assets.length === 0) return html;
  
  return html.replace(/(asset|image):([a-zA-Z0-9_-]+)/g, (match, type, id) => {
    const asset = assets.find((a) => a.id === id);
    return asset ? asset.data : match;
  });
}
