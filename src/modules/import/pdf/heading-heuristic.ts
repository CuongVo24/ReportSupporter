import type { ExtractedPage, TextItem } from "./extract-text";

export interface HeadingMap {
  [fontSize: number]: 1 | 2 | 3;
}

/**
 * Builds a heading map by analyzing the font size distribution (histogram)
 * of the entire document to identify body size (mode) and heading levels.
 */
export function buildHeadingMap(pages: ExtractedPage[]): {
  bodySize: number;
  headingMap: HeadingMap;
} {
  const sizeWeights: { [size: number]: number } = {};

  // Collect font size weights based on text character count
  for (const page of pages) {
    for (const item of page.items) {
      const text = item.text.trim();
      if (!text) continue;
      const size = item.fontSize;
      sizeWeights[size] = (sizeWeights[size] || 0) + text.length;
    }
  }

  // Find the body size (mode)
  let bodySize = 12; // fallback
  let maxWeight = 0;
  for (const [sizeStr, weight] of Object.entries(sizeWeights)) {
    const size = Number(sizeStr);
    if (weight > maxWeight) {
      maxWeight = weight;
      bodySize = size;
    }
  }

  // Find sizes larger than bodySize * 1.15
  const largerSizes = Object.keys(sizeWeights)
    .map(Number)
    .filter((size) => size >= bodySize * 1.15)
    .sort((a, b) => b - a);

  const headingMap: HeadingMap = {};
  if (largerSizes.length > 0) {
    headingMap[largerSizes[0]] = 1; // Largest is H1
  }
  if (largerSizes.length > 1) {
    headingMap[largerSizes[1]] = 2; // Second largest is H2
  }
  // All remaining larger sizes map to H3
  for (let i = 2; i < largerSizes.length; i++) {
    headingMap[largerSizes[i]] = 3;
  }

  return { bodySize, headingMap };
}

/**
 * Checks if a specific TextItem should be treated as a heading.
 * Returns true if font size matches the heading map, or if bold and short.
 */
export function isItemHeading(item: TextItem, bodySize: number, headingMap: HeadingMap): boolean {
  const text = item.text.trim();
  if (!text) return false;
  
  // Headings must be relatively short
  if (text.length > 120) return false;

  // Exact match in mapped heading sizes
  if (headingMap[item.fontSize] !== undefined) {
    return true;
  }

  // Bold and short and at least bodySize
  const isBold = item.fontName.includes("(Bold)") || item.fontName.toLowerCase().includes("bold");
  if (isBold && text.length < 80 && item.fontSize >= bodySize * 0.98) {
    return true;
  }

  return false;
}

/**
 * Resolves the heading level (1, 2, or 3) for a TextItem, or null if not a heading.
 */
export function getHeadingLevel(
  item: TextItem,
  bodySize: number,
  headingMap: HeadingMap
): 1 | 2 | 3 | null {
  if (!isItemHeading(item, bodySize, headingMap)) return null;

  const mapped = headingMap[item.fontSize];
  if (mapped !== undefined) {
    return mapped;
  }

  // Bold headings default to H3 if not in the map
  return 3;
}
