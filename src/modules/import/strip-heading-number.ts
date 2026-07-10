/**
 * Helper to strip hardcoded heading numbers (e.g. "1. ", "1.2.1) ") from markdown headings.
 * Limits digits to 1 or 2 per segment (e.g. "12.3") to prevent false-positives on years or other text.
 */
export function stripHeadingNumbers(markdown: string): string {
  const lines = markdown.split("\n");
  // Matches 1-6 hashes, followed by space, followed by a numbering pattern (like 1. or 1.2 or 1)), followed by space, and the rest
  const headingRegex = /^(#{1,6})\s+(\d{1,2}(?:\.\d{1,2})*[.)]?\s+)(.*)$/;

  const updatedLines = lines.map((line) => {
    const match = line.match(headingRegex);
    if (match) {
      const [, hashes, , remainingText] = match;
      return `${hashes} ${remainingText}`;
    }
    return line;
  });

  return updatedLines.join("\n");
}
