import type { CaptionEntry } from "@/types";

/**
 * Generates the list of figures entries from the caption registry.
 * 
 * @param registry The single unified caption registry.
 * @returns Ordered figure caption entries.
 */
export function generateListOfFigures(registry: CaptionEntry[]): CaptionEntry[] {
  return registry.filter((entry) => entry.kind === "figure");
}

/**
 * Generates the list of tables entries from the caption registry.
 * 
 * @param registry The single unified caption registry.
 * @returns Ordered table caption entries.
 */
export function generateListOfTables(registry: CaptionEntry[]): CaptionEntry[] {
  return registry.filter((entry) => entry.kind === "table");
}
