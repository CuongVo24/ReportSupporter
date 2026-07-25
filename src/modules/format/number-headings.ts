import { slugify } from "@/lib/slugify";
import type { HeadingNode } from "./parse-headings";

export type NumberedHeading = HeadingNode & {
  number: string;
  id: string;
  levelJumped: boolean;
};

/**
 * Detects the base chapter depth (the shallowest level, H1 or H2) in the heading list.
 * Excludes single H1 title headings at the very beginning of the list.
 */
export function detectChapterDepthFromHeadings(headings: HeadingNode[]): number {
  const activeHeadings = headings.filter((h) => h.text);
  if (activeHeadings.length === 0) return 1;

  const depths = activeHeadings.map((h) => h.depth);
  const minDepth = Math.min(...depths);

  if (minDepth === 1) {
    const h1Count = activeHeadings.filter((h) => h.depth === 1).length;
    const firstHeadingIsH1 = activeHeadings[0]?.depth === 1;

    if (h1Count === 1 && firstHeadingIsH1 && activeHeadings.length > 1) {
      const h2Headings = activeHeadings.filter((h) => h.depth === 2);

      let hasH2WithSingleNumber = false;
      let hasH2WithSubNumber = false;

      for (const h2 of h2Headings) {
        const match = h2.text.match(/^\s*(\d+(?:\.\d+)*)\s*[.)-]?\s+/);
        if (match) {
          const numStr = match[1];
          if (numStr.includes(".")) {
            hasH2WithSubNumber = true;
          } else {
            hasH2WithSingleNumber = true;
          }
        }
      }

      const h1Text = activeHeadings[0].text;
      const h1HasNumber = /^\s*(?:chương\s+\d+|\d+)/i.test(h1Text);

      if (h1HasNumber) {
        return 1;
      }

      if (hasH2WithSingleNumber && !hasH2WithSubNumber) {
        const otherDepths = activeHeadings.filter((h) => h.depth > 1).map((h) => h.depth);
        if (otherDepths.length > 0) {
          return Math.min(...otherDepths);
        }
      }

      const h1WordCount = h1Text.split(/\s+/).filter(Boolean).length;
      const isH1Long = h1WordCount >= 6 || h1Text.length > 25;

      if (isH1Long && !hasH2WithSubNumber) {
        const otherDepths = activeHeadings.filter((h) => h.depth > 1).map((h) => h.depth);
        if (otherDepths.length > 0) {
          return Math.min(...otherDepths);
        }
      }

      return 1;
    }
  }

  return minDepth;
}

export function extractAuthorNumber(text: string): string | null {
  const match = text.match(/^\s*(\d{1,2}(?:\.\d{1,2}){0,4})\s*[.)-]?\s+/);
  return match ? match[1] : null;
}

export function numberHeadings(
  headings: HeadingNode[],
  settings?: { respectAuthorNumbering?: boolean }
): NumberedHeading[] {
  const respectAuthorNumbering = settings?.respectAuthorNumbering ?? false;
  const chapterDepth = detectChapterDepthFromHeadings(headings);

  const counters = [0, 0, 0, 0, 0, 0, 0];
  const numberedHeadings: NumberedHeading[] = [];
  let prevDepth = 0;

  for (const heading of headings) {
    if (!heading.text) {
      continue;
    }

    const d = heading.depth;
    const effectiveDepth = d - chapterDepth + 1;
    const cleanText = heading.text.trim().toLowerCase();
    const isTocHeading = cleanText === "mục lục" || cleanText === "table of contents" || cleanText === "toc";

    if (effectiveDepth < 1 || effectiveDepth > 6 || isTocHeading) {
      const slug = slugify(heading.text);
      numberedHeadings.push({
        ...heading,
        number: "",
        id: slug,
        levelJumped: false,
      });
      continue;
    }

    let numberStr = "";
    if (respectAuthorNumbering) {
      const authorNum = extractAuthorNumber(heading.text);
      if (authorNum) {
        numberStr = authorNum;

        const parts = authorNum.split(".").map(Number);
        for (let i = 0; i < parts.length; i++) {
          if (i + 1 <= 6) {
            counters[i + 1] = parts[i];
          }
        }
        for (let k = parts.length + 1; k <= 6; k++) {
          counters[k] = 0;
        }
      }
    }

    if (!numberStr) {
      counters[effectiveDepth]++;

      for (let i = 1; i < effectiveDepth; i++) {
        if (counters[i] === 0) {
          counters[i] = 1;
        }
      }

      for (let k = effectiveDepth + 1; k <= 6; k++) {
        counters[k] = 0;
      }

      const numberParts: number[] = [];
      for (let i = 1; i <= effectiveDepth; i++) {
        numberParts.push(counters[i]);
      }
      numberStr = numberParts.join(".");
    }

    let levelJumped = false;
    if (prevDepth === 0) {
      if (d > 1) {
        levelJumped = true;
      }
    } else {
      if (effectiveDepth > prevDepth + 1) {
        levelJumped = true;
      }
    }

    const numPrefix = numberStr.replace(/\./g, "-");
    const slug = slugify(heading.text);
    const id = slug ? `${numPrefix}-${slug}` : numPrefix;

    numberedHeadings.push({
      ...heading,
      number: numberStr,
      id,
      levelJumped,
    });

    prevDepth = effectiveDepth;
  }

  return numberedHeadings;
}
