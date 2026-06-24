/**
 * Generates a clean, deterministic URL-safe slug from a given text.
 * - Normalizes to NFD and strips Vietnamese diacritics.
 * - Converts to lowercase.
 * - Replaces non-alphanumeric characters with hyphens.
 * - Collapses consecutive hyphens.
 * - Trims hyphens from the ends.
 */
export function slugify(text: string): string {
  if (!text) return "";

  // Normalize to NFD to separate base characters from combining diacritics
  let str = text.normalize("NFD");

  // Replace Vietnamese specific characters that might not split perfectly with NFD (đ/Đ)
  str = str.replace(/đ/g, "d").replace(/Đ/g, "d");

  // Remove U+0300 to U+036F combining marks (diacritics)
  str = str.replace(/[\u0300-\u036f]/g, "");

  // Convert to lowercase
  str = str.toLowerCase();

  // Replace non-alphanumeric characters with hyphens
  str = str.replace(/[^a-z0-9]/g, "-");

  // Collapse consecutive hyphens
  str = str.replace(/-+/g, "-");

  // Trim leading/trailing hyphens
  str = str.replace(/^-+|-+$/g, "");

  return str;
}
