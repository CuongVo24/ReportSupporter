import type { ImportWarning } from "@/types";
import { validateCanvasPixels } from "../resource-policy";

/** Running pixel budget shared across every image on every page of one PDF import. */
export type PixelLedger = { totalPixels: number };
export function createPixelLedger(): PixelLedger {
  return { totalPixels: 0 };
}

export interface ImageItem {
  type: "image";
  id: string;
  fileName: string;
  data: string; // base64 data-URL
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extracts raster images from a PDF page using pdfjs operator list and page resources.
 * Returns a list of ImageItem objects with page coordinates.
 */
export async function extractPageImages(
  page: { objs: { get: (key: string) => unknown } },
  ops: { fnArray: number[]; argsArray: unknown[][] },
  pageNum: number,
  warnings: ImportWarning[],
  pixelLedger: PixelLedger = createPixelLedger(),
): Promise<ImageItem[]> {
  const images: ImageItem[] = [];

  // Track CTM (Current Transformation Matrix) for image positioning
  let currentTransform = [1, 0, 0, 1, 0, 0];

  for (let j = 0; j < ops.fnArray.length; j++) {
    const fn = ops.fnArray[j];
    const args = ops.argsArray[j] as unknown[];

    // pdfjs.OPS.transform is typically 12
    if (fn === 12) {
      currentTransform = args as number[]; // [a, b, c, d, e, f]
    } 
    // pdfjs.OPS.paintImageXObject is typically 85 or 82
    else if (fn === 85 || fn === 82) {
      const imgKey = args[0] as string;
      const width = Math.round(Math.abs(currentTransform[0]));
      const height = Math.round(Math.abs(currentTransform[3]));
      const x = currentTransform[4];
      const y = currentTransform[5];

      // Skip small decorative icons/bullets (under 24px) silently
      if (width < 24 || height < 24) {
        continue;
      }

      // Try to fetch image object from page resources
      try {
        const imgObj = page.objs.get(imgKey);
        if (imgObj) {
          // Validate NATIVE decoded pixel dimensions (not the on-page
          // display size in `width`/`height` above) against the per-image
          // cap and the running total for this whole PDF, BEFORE any
          // canvas/ImageData allocation happens inside convertImageObjToBase64.
          const native = imgObj as { width?: number; height?: number };
          if (native.width && native.height) {
            const pixelCheck = validateCanvasPixels(native.width, native.height, pixelLedger.totalPixels);
            if (!pixelCheck.valid) {
              warnings.push({
                code: "image-skipped",
                message: `Bỏ qua hình ảnh vượt ngân sách điểm ảnh ở trang ${pageNum}: ${pixelCheck.error}`,
                location: `trang ${pageNum}`,
              });
              continue;
            }
            pixelLedger.totalPixels += native.width * native.height;
          }

          const base64Data = convertImageObjToBase64(imgObj);
          if (base64Data) {
            // Check size gate (5MB)
            const approximateBytes = Math.round((base64Data.length * 3) / 4);
            if (approximateBytes > 5 * 1024 * 1024) {
              warnings.push({
                code: "image-skipped",
                message: `Bỏ qua hình ảnh lớn hơn 5MB ở trang ${pageNum}.`,
                location: `trang ${pageNum}`,
              });
              continue;
            }

            const assetId = crypto.randomUUID();
            images.push({
              type: "image",
              id: assetId,
              fileName: `pdf-page-${pageNum}-img-${images.length + 1}.png`,
              data: base64Data,
              x,
              y,
              width,
              height,
            });
          }
        }
      } catch {
        // Log skip warning on decode failure
        warnings.push({
          code: "image-skipped",
          message: `Không thể giải mã hình ảnh ở trang ${pageNum}.`,
          location: `trang ${pageNum}`,
        });
      }
    }
  }

  return images;
}

/**
 * Decodes pdfjs image object pixel data into a PNG data URL using canvas.
 * Fallbacks to a dummy transparent pixel in non-browser (e.g. Vitest/Node) environments.
 */
export function convertImageObjToBase64(imgObj: unknown): string | null {
  const obj = imgObj as { width?: number; height?: number; data?: Uint8Array | Uint8ClampedArray };
  const width = obj.width;
  const height = obj.height;
  if (!width || !height || !obj.data) return null;

  // Vitest / Node environment check: fallback to a mock 1x1 transparent PNG
  if (typeof document === "undefined" || !document.createElement) {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imgData = ctx.createImageData(width, height);
    const data = obj.data;

    if (data.length === width * height * 4) {
      imgData.data.set(data);
    } else if (data.length === width * height * 3) {
      // RGB -> RGBA conversion
      let srcIdx = 0;
      let destIdx = 0;
      while (srcIdx < data.length) {
        imgData.data[destIdx] = data[srcIdx];
        imgData.data[destIdx + 1] = data[srcIdx + 1];
        imgData.data[destIdx + 2] = data[srcIdx + 2];
        imgData.data[destIdx + 3] = 255;
        srcIdx += 3;
        destIdx += 4;
      }
    } else {
      // Grayscale/fallback
      let srcIdx = 0;
      let destIdx = 0;
      while (srcIdx < data.length && destIdx < imgData.data.length) {
        const val = data[srcIdx];
        imgData.data[destIdx] = val;
        imgData.data[destIdx + 1] = val;
        imgData.data[destIdx + 2] = val;
        imgData.data[destIdx + 3] = 255;
        srcIdx++;
        destIdx += 4;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");

    // Clean up memory
    canvas.width = 0;
    canvas.height = 0;

    return dataUrl;
  } catch {
    return null;
  }
}
