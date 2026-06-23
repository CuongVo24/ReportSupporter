import type { SnippetKind } from "@/types";

/**
 * Pure helper to inject a Markdown snippet replacement into a document string
 * at a given selection range [from, to] and compute the new text and cursor position.
 */
export function insertSnippet(
  doc: string,
  from: number,
  to: number,
  kind: SnippetKind
): { text: string; cursor: number } {
  let snippet = "";
  let targetCursorIndex = 0; // Index inside the final snippet string

  // Ensure snippet starts on a new line if not already at one
  const needsLeadingNewline = from > 0 && doc[from - 1] !== "\n";

  switch (kind) {
    case "table":
      snippet = "\n| Cột 1 | Cột 2 |\n| --- | --- |\n|  |  |\n";
      // We want the cursor inside the first empty cell of the data row: "\n|  |  |\n" -> placing after "| "
      const tableRowOffset = snippet.indexOf("|  |  |\n");
      targetCursorIndex = tableRowOffset + 2;
      break;

    case "code":
      snippet = "\n```text\n\n```\n";
      // Position cursor on the empty line inside the code block
      targetCursorIndex = snippet.indexOf("\n\n```\n") + 1;
      break;

    case "math":
      snippet = "\n$$\n\n$$\n";
      // Position cursor on the empty line inside the math display block
      targetCursorIndex = snippet.indexOf("\n\n$$\n") + 1;
      break;

    case "mermaid":
      snippet = "\n```mermaid\ngraph TD;\n    A --> B;\n```\n";
      // Position cursor at the very end of the snippet block
      targetCursorIndex = snippet.length;
      break;

    case "callout":
      snippet = "\n> [!NOTE]\n> \n";
      // Position cursor after the block quote marker on the second line: "\n> \n" -> placing after "> "
      targetCursorIndex = snippet.indexOf("\n> \n") + 3;
      break;

    case "image":
      snippet = "![Mô tả ảnh](image:asset_id)";
      // Position cursor inside the alt text square brackets: "![" -> index 2
      targetCursorIndex = 2;
      break;

    default:
      snippet = "";
      targetCursorIndex = 0;
  }

  if (needsLeadingNewline) {
    snippet = "\n" + snippet;
    targetCursorIndex += 1;
  }

  const before = doc.slice(0, from);
  const after = doc.slice(to);

  return {
    text: before + snippet + after,
    cursor: from + targetCursorIndex,
  };
}
