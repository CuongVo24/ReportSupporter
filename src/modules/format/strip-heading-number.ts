import type { Heading as MdastHeading } from "mdast";

const PREFIX_REGEX = /^\s*\d{1,2}(?:\.\d{1,2}){0,4}\s*[.)-]?\s+/;

/**
 * Strips manual heading numbering prefixes (like "1.", "1.1.", "1) ", "1.1 - ")
 * from a plain text string. Protects non-numbering years like "2024".
 */
export function stripHeadingNumberPrefix(text: string): string {
  return text.replace(PREFIX_REGEX, "");
}

/**
 * Strips manual numbering prefix directly from the first text node of an AST heading.
 */
export function stripAstHeadingPrefix(heading: MdastHeading): void {
  if (!heading.children || heading.children.length === 0) return;
  const firstChild = heading.children[0];
  if (firstChild && firstChild.type === "text" && "value" in firstChild && typeof firstChild.value === "string") {
    firstChild.value = firstChild.value.replace(PREFIX_REGEX, "");
  }
}
