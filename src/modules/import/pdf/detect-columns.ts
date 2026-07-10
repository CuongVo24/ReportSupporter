import type { TextItem } from "./extract-text";
import { sortTextItems } from "./extract-text";

export interface Line {
  y: number;
  items: TextItem[];
}

/**
 * Detects if a page has a 2-column layout and sorts text items column-by-column.
 * First reads the left column top-to-bottom, then the right column top-to-bottom.
 */
export function detectAndSortColumns(
  items: TextItem[],
  pageWidth: number
): { sortedItems: TextItem[]; isTwoColumn: boolean } {
  const filtered = items.filter((item) => item.text.trim().length > 0);
  if (filtered.length === 0) return { sortedItems: items, isTwoColumn: false };

  const mid = pageWidth / 2;
  const gutterWidth = 30; // tolerance around the center gutter
  const gutterLeft = mid - gutterWidth / 2;
  const gutterRight = mid + gutterWidth / 2;

  let leftCount = 0;
  let rightCount = 0;
  let crossCount = 0;

  for (const item of filtered) {
    const itemEnd = item.x + item.width;
    if (itemEnd < gutterLeft) {
      leftCount++;
    } else if (item.x > gutterRight) {
      rightCount++;
    } else {
      crossCount++;
    }
  }

  const total = filtered.length;
  // Criteria: significant content on both sides, minimal content crossing the gutter
  const isTwoColumn =
    leftCount > total * 0.2 && rightCount > total * 0.2 && crossCount < total * 0.35;

  if (isTwoColumn) {
    const leftItems: TextItem[] = [];
    const rightItems: TextItem[] = [];

    for (const item of filtered) {
      const itemCenter = item.x + item.width / 2;
      if (itemCenter < mid) {
        leftItems.push(item);
      } else {
        rightItems.push(item);
      }
    }

    const sortedLeft = sortTextItems(leftItems);
    const sortedRight = sortTextItems(rightItems);

    return {
      sortedItems: [...sortedLeft, ...sortedRight],
      isTwoColumn: true,
    };
  }

  return {
    sortedItems: sortTextItems(filtered),
    isTwoColumn: false,
  };
}

/**
 * Groups raw TextItems into lines by baseline (y coordinate) with tolerance.
 */
export function groupItemsIntoLines(items: TextItem[]): Line[] {
  const filtered = items.filter((item) => item.text.trim().length > 0);
  const sorted = [...filtered].sort((a, b) => b.y - a.y); // top to bottom
  const lines: Line[] = [];

  for (const item of sorted) {
    let placed = false;
    for (const line of lines) {
      if (Math.abs(line.y - item.y) <= 5) {
        line.items.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lines.push({ y: item.y, items: [item] });
    }
  }

  // Sort columns left-to-right (x ascending) within each line
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
  }

  return lines;
}

/**
 * Analyzes grouped lines to find table regions (consecutive lines with aligned columns).
 * Returns a Set of line y coordinates that belong to table rows.
 */
export function detectTableLines(lines: Line[]): Set<number> {
  const tableLineYCoordinates = new Set<number>();
  let activeBlock: Line[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasMultipleCols = line.items.length >= 2;

    let isAligned = false;
    if (hasMultipleCols && activeBlock.length > 0) {
      const prevLine = activeBlock[activeBlock.length - 1];
      if (prevLine.items.length === line.items.length) {
        let allAligned = true;
        for (let colIdx = 0; colIdx < line.items.length; colIdx++) {
          const xCurrent = line.items[colIdx].x;
          const xPrev = prevLine.items[colIdx].x;
          if (Math.abs(xCurrent - xPrev) > 20) {
            allAligned = false;
            break;
          }
        }
        isAligned = allAligned;
      }
    }

    if (hasMultipleCols && (activeBlock.length === 0 || isAligned)) {
      activeBlock.push(line);
    } else {
      if (activeBlock.length >= 3) {
        for (const tblLine of activeBlock) {
          tableLineYCoordinates.add(tblLine.y);
        }
      }
      activeBlock = hasMultipleCols ? [line] : [];
    }
  }

  if (activeBlock.length >= 3) {
    for (const tblLine of activeBlock) {
      tableLineYCoordinates.add(tblLine.y);
    }
  }

  return tableLineYCoordinates;
}
