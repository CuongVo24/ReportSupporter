import type { ReportAsset } from "@/types";

/**
 * Replaces offline asset references in the format `asset:<id>` or `image:asset_id`
 * with the corresponding base64 data URLs from the project assets.
 * Operates on the raw Markdown source string before HTML rendering and sanitization.
 * Leaves them untouched if the asset is not found.
 */
export function resolveAssetRefs(html: string, assets: ReportAsset[]): string {
  if (!assets || assets.length === 0) return html;
  
  return html.replace(/(asset|image):([a-zA-Z0-9_-]+)/g, (match, type, id) => {
    const asset = assets.find((a) => a.id === id);
    return asset ? asset.data : match;
  });
}

/**
 * Helper to identify if an image reference is unembedded or broken.
 * - Empty url -> unembedded.
 * - Starts with data: or http:// or https:// -> valid resolved/remote URL.
 * - Matches asset:<id> or image:<id> -> if ID is not in assets list, it is an orphan asset.
 * - Relative or local file path -> unembedded.
 */
export function isUnembeddedImage(url: string, assets: { id: string }[]): boolean {
  const trimmed = url ? url.trim() : "";
  if (!trimmed) return true;

  if (/^(data:|https?:\/\/)/i.test(trimmed)) {
    return false;
  }

  const assetMatch = /^(asset|image):(.+)$/.exec(trimmed);
  if (assetMatch) {
    const id = assetMatch[2].trim();
    return !assets.some((a) => a.id === id);
  }

  return true;
}

/**
 * Recursively walks the MDAST (markdown AST) tree and replaces any unembedded/broken
 * image nodes with custom paragraph/div placeholders.
 */
export function transformUnembeddedImages(node: any, assets: { id: string }[]) {
  if (!node) return;

  if (node.type === "image") {
    const url = node.url || "";
    if (isUnembeddedImage(url, assets)) {
      const alt = node.alt || "";
      node.type = "paragraph";
      node.data = {
        hName: "div",
        hProperties: {
          className: "ws-preview-image-missing",
          "data-missing-image": "true",
          "data-original-src": url,
          "data-alt": alt,
        },
      };
      node.children = [
        {
          type: "strong",
          children: [{ type: "text", value: `⚠ [Ảnh chưa nhúng: ${alt || "Không có mô tả"}]` }],
        },
        { type: "text", value: `\nĐường dẫn cục bộ: ` },
        { type: "inlineCode", value: url },
        { type: "text", value: `\n` },
        {
          type: "link",
          url: "#",
          data: {
            hName: "button",
            hProperties: {
              type: "button",
              className: "ws-preview-image-missing-btn",
              "data-action": "attach-image",
              "data-original-src": url,
              "data-alt": alt,
            },
          },
          children: [{ type: "text", value: "Nhúng ảnh..." }],
        },
      ];
      delete node.url;
      delete node.title;
      delete node.alt;
      return;
    }
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      transformUnembeddedImages(child, assets);
    }
  }
}

