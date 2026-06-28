import type { ReportSection } from "@/types";

export type WritingStats = {
  words: number;
  chars: number;
  readingMinutes: number;
};

const WORDS_PER_MINUTE = 220;

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~>#|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeWritingStats(input: string | ReportSection[]): WritingStats {
  const markdown = Array.isArray(input)
    ? input.map((section) => section.markdown).join("\n\n")
    : input;
  const plain = stripMarkdown(markdown);
  const words = plain ? plain.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu)?.length ?? 0 : 0;

  return {
    words,
    chars: plain.length,
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
  };
}
