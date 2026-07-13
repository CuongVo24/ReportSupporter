import type { SnippetKind } from "@/types";

/**
 * Pure helper to inject a Markdown snippet replacement into a document string
 * at a given selection range [from, to] and compute the new text and cursor position.
 */
function getBlockContext(doc: string, pos: number): { inside: boolean; endPos: number } {
  const lines = doc.split("\n");
  let currentOffset = 0;
  let cursorLineIdx = 0;
  
  const lineOffsets: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    lineOffsets.push(currentOffset);
    if (pos >= currentOffset && pos <= currentOffset + lines[i].length) {
      cursorLineIdx = i;
    }
    currentOffset += lines[i].length + 1; // +1 for \n
  }

  // 1. Check Fenced Code Block:
  let oddFences = false;
  for (let i = 0; i <= cursorLineIdx; i++) {
    if (lines[i].trim().startsWith("```")) {
      oddFences = !oddFences;
    }
  }
  if (oddFences) {
    // Unclosed fence: treat the rest of the document as inside the block so the new
    // snippet lands after it rather than nested within.
    let endLineIdx = lines.length - 1;
    for (let i = cursorLineIdx + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith("```")) {
        endLineIdx = i;
        break;
      }
    }
    const endPos = lineOffsets[endLineIdx] + lines[endLineIdx].length;
    return { inside: true, endPos };
  }

  // 2. Check Display Math block ($$):
  let oddMath = false;
  for (let i = 0; i <= cursorLineIdx; i++) {
    if (lines[i].trim() === "$$") {
      oddMath = !oddMath;
    }
  }
  if (oddMath) {
    let endLineIdx = lines.length - 1;
    for (let i = cursorLineIdx + 1; i < lines.length; i++) {
      if (lines[i].trim() === "$$") {
        endLineIdx = i;
        break;
      }
    }
    const endPos = lineOffsets[endLineIdx] + lines[endLineIdx].length;
    return { inside: true, endPos };
  }

  // 3. Check Table block. Require the contiguous run of pipe-bearing lines around the
  // cursor to contain a GFM delimiter row (| --- | :--: |) so a stray inline "|" in
  // prose is not mistaken for a table.
  const isPipeRow = (ln: string | undefined) => !!ln && ln.includes("|");
  const isDelimiterRow = (ln: string | undefined) =>
    !!ln && /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(ln.trim());
  if (isPipeRow(lines[cursorLineIdx])) {
    let start = cursorLineIdx;
    while (start > 0 && isPipeRow(lines[start - 1])) start--;
    let endLineIdx = cursorLineIdx;
    while (endLineIdx < lines.length - 1 && isPipeRow(lines[endLineIdx + 1])) endLineIdx++;

    let hasDelimiter = false;
    for (let i = start; i <= endLineIdx; i++) {
      if (isDelimiterRow(lines[i])) {
        hasDelimiter = true;
        break;
      }
    }

    if (hasDelimiter) {
      const endPos = lineOffsets[endLineIdx] + lines[endLineIdx].length;
      return { inside: true, endPos };
    }
  }

  return { inside: false, endPos: pos };
}

export function insertSnippet(
  doc: string,
  from: number,
  to: number,
  kind: SnippetKind,
  blockEndPos?: number
): { text: string; cursor: number } {
  let snippet = "";
  let targetCursorIndex = 0; // Index inside the final snippet string

  switch (kind) {
    case "table":
      snippet = "| Cột 1 | Cột 2 |\n| --- | --- |\n|  |  |\n";
      targetCursorIndex = 34;
      break;

    case "code":
      snippet = "```text\n\n```\n";
      targetCursorIndex = 8;
      break;

    case "math":
      snippet = "$$\n\n$$\n";
      targetCursorIndex = 3;
      break;

    case "mermaid":
      snippet = "```mermaid\ngraph TD;\n    A --> B;\n```\n";
      targetCursorIndex = 38;
      break;

    case "callout":
      snippet = "> [!NOTE]\n> \n";
      targetCursorIndex = 12;
      break;

    case "image":
      snippet = "![Mô tả ảnh](image:asset_id)";
      targetCursorIndex = 2;
      break;

    default:
      snippet = "";
      targetCursorIndex = 0;
  }

  let finalFrom = from;
  let finalTo = to;
  let prefix = "";
  let suffix = "";

  if (kind !== "image") {
    // 1. If syntaxTree block end is passed, use it:
    if (blockEndPos !== undefined && blockEndPos > from) {
      finalFrom = blockEndPos;
      finalTo = blockEndPos;
    } else {
      // 2. Fallback to line scanning:
      const lineCtx = getBlockContext(doc, from);
      if (lineCtx.inside) {
        finalFrom = lineCtx.endPos;
        finalTo = lineCtx.endPos;
      }
    }

    // Determine leading prefix newlines
    if (finalFrom > 0) {
      if (doc[finalFrom - 1] !== "\n") {
        prefix = "\n\n";
      } else if (finalFrom > 1 && doc[finalFrom - 2] !== "\n") {
        prefix = "\n";
      }
    }

    // Determine trailing suffix newlines
    if (finalTo < doc.length) {
      if (doc[finalTo] !== "\n") {
        suffix = "\n";
      }
    }
  } else {
    // Ensure image starts on a new line if not already at one
    const needsLeadingNewline = finalFrom > 0 && doc[finalFrom - 1] !== "\n";
    if (needsLeadingNewline) {
      prefix = "\n";
    }
  }

  const before = doc.slice(0, finalFrom);
  const after = doc.slice(finalTo);

  return {
    text: before + prefix + snippet + suffix + after,
    cursor: finalFrom + prefix.length + targetCursorIndex,
  };
}
