import QRCode from "qrcode";

/**
 * Generates a local offline QR Code PNG data URL for a given URL string.
 * Returns an empty string if the URL is empty or if generation fails.
 */
export async function toQrDataUrl(url: string): Promise<string> {
  if (!url || url.trim() === "") {
    return "";
  }
  try {
    return await QRCode.toDataURL(url);
  } catch (error) {
    console.error("QR Code generation failed:", error);
    return "";
  }
}

export interface UnistNode {
  type: string;
  value?: string;
  url?: string;
  alt?: string;
  children?: UnistNode[];
}

/**
 * Traverses an mdast AST tree and replaces HTML placeholder spans of QR codes
 * with actual image nodes pointing to the resolved base64 data URLs.
 */
export function injectQrImages(node: UnistNode, qrDataUrls: Record<string, string>): void {
  if (!node) return;
  if (node.children && Array.isArray(node.children)) {
    const newChildren: UnistNode[] = [];
    for (const child of node.children) {
      if (
        child.type === "html" &&
        typeof child.value === "string" &&
        child.value.includes("ws-evidence-qr-placeholder")
      ) {
        const match = child.value.match(/data-url="([^"]+)"/);
        const escapedUrl = match ? match[1] : "";
        const url = escapedUrl.replace(/&quot;/g, '"');
        if (url && qrDataUrls[url]) {
          newChildren.push({
            type: "image",
            url: qrDataUrls[url],
            alt: `QR: ${url}`,
          });
          continue;
        }
      }
      injectQrImages(child, qrDataUrls);
      newChildren.push(child);
    }
    node.children = newChildren;
  }
}
