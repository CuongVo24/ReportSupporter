import type { ReportAsset } from "@/types";

interface MutableMdastNode {
  type: string;
  value?: string;
  url?: string;
  alt?: string | null;
  title?: string | null;
  data?: unknown;
  children?: MutableMdastNode[];
}

/**
 * Checks whether an image URL points to a remote http/https resource.
 */
export function isRemoteImage(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return /^(https?:\/\/)/i.test(trimmed);
}

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
 * - Starts with data: or blob: -> valid resolved local URL.
 * - Starts with http:// or https:// -> remote image (handled by privacy classifier).
 * - Matches asset:<id> or image:<id> -> if ID is not in assets list, it is an orphan asset.
 * - Relative or local file path -> unembedded.
 */
export function isUnembeddedImage(url: string, assets: { id: string }[]): boolean {
  const trimmed = url ? url.trim() : "";
  if (!trimmed) return true;

  if (/^(data:|blob:|https?:\/\/)/i.test(trimmed)) {
    return false;
  }

  const assetMatch = /^(asset|image):(.+)$/.exec(trimmed);
  if (assetMatch) {
    const id = assetMatch[2].trim();
    return !assets.some((a) => a.id === id);
  }

  return true;
}

export type AssetTransformOptions = {
  allowRemote?: boolean;
};

/**
 * Recursively walks the MDAST (markdown AST) tree and:
 * 1. Replaces unembedded/broken local images with missing image placeholders (`ws-preview-image-missing`).
 * 2. Transforms remote http(s) images into privacy consent placeholders (`ws-preview-image-remote`)
 *    unless explicit permission (`allowRemote: true`) is granted.
 */
export function transformUnembeddedImages(
  node: MutableMdastNode | null | undefined,
  assets: { id: string }[],
  options?: AssetTransformOptions,
): void {
  if (!node) return;

  if (node.type === "image") {
    const url = node.url || "";
    const alt = node.alt || "";

    // 1. Unembedded/broken local image
    if (isUnembeddedImage(url, assets)) {
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

    // 2. Remote image classification & privacy consent gate
    if (isRemoteImage(url)) {
      if (options?.allowRemote) {
        // Explicit consent: render image with no-referrer and cross-origin security
        node.data = {
          hProperties: {
            referrerPolicy: "no-referrer",
            crossOrigin: "anonymous",
          },
        };
      } else {
        // Default block: render privacy consent placeholder
        node.type = "paragraph";
        node.data = {
          hName: "div",
          hProperties: {
            className: "ws-preview-image-remote",
            "data-remote-image": "true",
            "data-original-src": url,
            "data-alt": alt,
          },
        };
        node.children = [
          {
            type: "strong",
            children: [{ type: "text", value: `🛡️ [Ảnh từ nguồn ngoài — Chưa tải]: ${alt || "Không có mô tả"}` }],
          },
          { type: "text", value: `\nURL nguồn: ` },
          { type: "inlineCode", value: url },
          { type: "text", value: `\n` },
          {
            type: "link",
            url: "#",
            data: {
              hName: "button",
              hProperties: {
                type: "button",
                className: "ws-preview-image-remote-btn",
                "data-action": "load-remote-image",
                "data-original-src": url,
                "data-alt": alt,
              },
            },
            children: [{ type: "text", value: "Tải ảnh này" }],
          },
        ];
        delete node.url;
        delete node.title;
        delete node.alt;
        return;
      }
    }
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      transformUnembeddedImages(child, assets, options);
    }
  }
}
