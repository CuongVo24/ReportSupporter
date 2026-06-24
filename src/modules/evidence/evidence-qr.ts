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
