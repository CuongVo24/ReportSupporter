import type { EvidenceItem } from "@/types";
import { kindMeta } from "./kind-meta";

function escapeCell(val: string | undefined | null): string {
  if (!val) return "";
  return val
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|");
}

export function buildEvidenceAppendix(evidence: EvidenceItem[]): string {
  if (!evidence || evidence.length === 0) {
    return "";
  }

  const header = "## Phụ lục minh chứng\n\n| Loại | Tiêu đề | Liên kết | Ghi chú |\n| --- | --- | --- | --- |";
  const rows = evidence.map((item) => {
    const kindLabel = kindMeta[item.kind]?.label || item.kind;
    const escapedKind = escapeCell(kindLabel);
    const escapedTitle = escapeCell(item.title);
    const escapedLink = item.url ? `[Liên kết](${escapeCell(item.url)})` : "";
    const escapedNote = item.note ? escapeCell(item.note) : "";
    return `| ${escapedKind} | ${escapedTitle} | ${escapedLink} | ${escapedNote} |`;
  });

  return [header, ...rows].join("\n");
}
