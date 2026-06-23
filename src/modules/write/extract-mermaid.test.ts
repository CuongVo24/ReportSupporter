import { describe, it, expect } from "vitest";

describe("Mermaid block extraction", () => {
  it("splits markdown correctly into normal text and mermaid blocks", () => {
    const markdown = `Đoạn văn 1.

\`\`\`mermaid
graph TD;
    A --> B;
\`\`\`

Đoạn văn 2.`;

    // Split regex targeting mermaid code blocks
    const parts = markdown.split(/(```mermaid[\s\S]*?```)/g);

    expect(parts).toHaveLength(3);
    expect(parts[0]).toContain("Đoạn văn 1.");
    expect(parts[1]).toContain("```mermaid");
    expect(parts[1]).toContain("graph TD;");
    expect(parts[2]).toContain("Đoạn văn 2.");
  });

  it("handles markdown with no mermaid blocks gracefully", () => {
    const markdown = "Chỉ có văn bản thường.";
    const parts = markdown.split(/(```mermaid[\s\S]*?```)/g);
    
    expect(parts).toHaveLength(1);
    expect(parts[0]).toBe("Chỉ có văn bản thường.");
  });

  it("handles markdown with consecutive mermaid blocks", () => {
    const markdown = `\`\`\`mermaid
block1
\`\`\`
\`\`\`mermaid
block2
\`\`\``;
    const parts = markdown.split(/(```mermaid[\s\S]*?```)/g);
    
    // Will contain empty strings in between due to consecutive matches, which is fine
    const mermaidBlocks = parts.filter(p => p.startsWith("```mermaid") && p.endsWith("```"));
    expect(mermaidBlocks).toHaveLength(2);
    expect(mermaidBlocks[0]).toContain("block1");
    expect(mermaidBlocks[1]).toContain("block2");
  });
});
