/**
 * Detects if a PDF page is scanned based on dual thresholds:
 * 1. Almost no selectable text layer (e.g. < 50 characters).
 * 2. Presence of a full-page raster image (covering > 70% of page width and height).
 */
export function isPageScanned(
  pageWidth: number,
  pageHeight: number,
  totalTextLength: number,
  images: { x: number; y: number; width: number; height: number }[]
): boolean {
  const hasVeryLittleText = totalTextLength < 50;

  const hasFullPageImage = images.some(
    (img) => img.width > pageWidth * 0.7 && Math.abs(img.height) > pageHeight * 0.7
  );

  return hasVeryLittleText && hasFullPageImage;
}
