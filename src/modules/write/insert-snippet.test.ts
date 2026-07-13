import { describe, it, expect } from "vitest";
import { insertSnippet } from "./insert-snippet";

describe("insertSnippet", () => {
  const doc = "Hello World";
  const pos = 5; // right after "Hello"

  it("handles 'table' snippet insertion", () => {
    const result = insertSnippet(doc, pos, pos, "table");
    expect(result.text).toContain("| Cột 1 | Cột 2 |");
    expect(result.text).toContain("| --- | --- |");
    expect(result.text).toContain("|  |  |");
    
    // Check cursor points inside the first empty cell of row 1
    const insertedText = result.text.slice(0, result.cursor);
    expect(insertedText.endsWith("| ")).toBe(true);
  });

  it("handles 'code' snippet insertion", () => {
    const result = insertSnippet(doc, pos, pos, "code");
    expect(result.text).toContain("```text");
    expect(result.text).toContain("```");
    
    // Cursor should be inside the fence on a new line
    expect(result.text[result.cursor]).toBe("\n");
    expect(result.text.slice(result.cursor - 8, result.cursor)).toBe("```text\n");
  });

  it("handles 'math' snippet insertion", () => {
    const result = insertSnippet(doc, pos, pos, "math");
    expect(result.text).toContain("$$");
    
    // Cursor should be on the empty line between $$
    expect(result.text[result.cursor]).toBe("\n");
    expect(result.text.slice(result.cursor - 3, result.cursor)).toBe("$$\n");
  });

  it("handles 'mermaid' snippet insertion", () => {
    const result = insertSnippet(doc, pos, pos, "mermaid");
    expect(result.text).toContain("```mermaid");
    expect(result.text).toContain("graph TD;");
    
    // Cursor should be at the end of the block
    expect(result.text.slice(result.cursor - 4, result.cursor)).toBe("```\n");
  });

  it("handles 'callout' snippet insertion", () => {
    const result = insertSnippet(doc, pos, pos, "callout");
    expect(result.text).toContain("> [!NOTE]");
    
    // Cursor should be at the empty quote line
    expect(result.text.slice(result.cursor - 2, result.cursor)).toBe("> ");
  });

  it("handles 'image' snippet insertion", () => {
    const result = insertSnippet(doc, pos, pos, "image");
    expect(result.text).toContain("![Mô tả ảnh](image:asset_id)");
    
    // Cursor should be inside the square brackets for alt text
    expect(result.text.slice(result.cursor - 2, result.cursor)).toBe("![");
  });

  it("handles leading newlines when insertion is not at a newline boundary", () => {
    const noNewlineDoc = "Hello";
    const result = insertSnippet(noNewlineDoc, 5, 5, "code");
    // Should insert double newlines: \n + \n```text...
    expect(result.text).toBe("Hello\n\n```text\n\n```\n");
  });

  it("escapes fenced code block when inserting code snippet inside one", () => {
    const docWithCode = "```text\ninside code block\n```";
    // Place cursor inside: index 15 (after "inside ")
    const result = insertSnippet(docWithCode, 15, 15, "code");
    // Code block should be inserted after the existing block, separated by blank line
    expect(result.text).toBe("```text\ninside code block\n```\n\n```text\n\n```\n");
  });

  it("escapes table when inserting math snippet inside one", () => {
    const docWithTable = "| Cột 1 |\n| --- |\n| dữ liệu |";
    // Place cursor in table: index 18 (inside "dữ liệu")
    const result = insertSnippet(docWithTable, 18, 18, "math");
    // Math block should be inserted after the table, separated by blank line
    expect(result.text).toBe("| Cột 1 |\n| --- |\n| dữ liệu |\n\n$$\n\n$$\n");
  });

  it("does not escape block for inline image snippet", () => {
    const docWithCode = "```text\ninside code block\n```";
    const result = insertSnippet(docWithCode, 15, 15, "image");
    // Image should be inserted exactly at cursor position, with single prepended newline (since previous char is not newline)
    expect(result.text).toBe("```text\ninside \n![Mô tả ảnh](image:asset_id)code block\n```");
  });

  it("uses blockEndPos to escape block when provided", () => {
    const docWithCode = "```text\ninside code block\n```";
    // Custom blockEndPos: 20
    const result = insertSnippet(docWithCode, 15, 15, "code", 20);
    // Should insert code snippet at index 20
    expect(result.text.slice(20, 20 + 2)).toBe("\n\n");
  });
});
