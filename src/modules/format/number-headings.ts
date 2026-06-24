import { slugify } from "@/lib/slugify";
import type { HeadingNode } from "./parse-headings";

export type NumberedHeading = HeadingNode & {
  number: string;
  id: string;
  levelJumped: boolean;
};

/**
 * Assigns hierarchical numbers (e.g. "1.1", "1.1.1") to heading nodes.
 * Skips empty headings. Generates slugified ids prefixed by the heading number.
 * Detects level jumps.
 */
export function numberHeadings(headings: HeadingNode[]): NumberedHeading[] {
  const counters = [0, 0, 0, 0, 0, 0, 0]; // 1-indexed counters for levels 1 to 6
  const numberedHeadings: NumberedHeading[] = [];
  let prevDepth = 0;

  for (const heading of headings) {
    // Empty-text headings excluded from numbering output
    if (!heading.text) {
      continue;
    }

    const d = heading.depth;
    if (d < 1 || d > 6) {
      continue;
    }

    // Increment current depth counter
    counters[d]++;

    // Reset deeper levels (k > d)
    for (let k = d + 1; k <= 6; k++) {
      counters[k] = 0;
    }

    // Build hierarchical number string, e.g. "1.2.1"
    const numberParts: number[] = [];
    for (let i = 1; i <= d; i++) {
      numberParts.push(counters[i]);
    }
    const numberStr = numberParts.join(".");

    // Check if depth jumped/skipped a level (e.g., h1 -> h3 or starting with h2)
    let levelJumped = false;
    if (prevDepth === 0) {
      if (d > 1) {
        levelJumped = true;
      }
    } else {
      if (d > prevDepth + 1) {
        levelJumped = true;
      }
    }

    // Generate anchor id (number prefix replacing '.' with '-' + slugified text)
    const numPrefix = numberStr.replace(/\./g, "-");
    const slug = slugify(heading.text);
    const id = slug ? `${numPrefix}-${slug}` : numPrefix;

    numberedHeadings.push({
      ...heading,
      number: numberStr,
      id,
      levelJumped,
    });

    prevDepth = d;
  }

  return numberedHeadings;
}
