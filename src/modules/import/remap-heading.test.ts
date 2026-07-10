import { describe, expect, it } from "vitest";
import { remapMarkdownHeadings } from "./remap-heading";

describe("Markdown Heading Remap Cascade", () => {
  it("should shift standard ATX headings depth correctly", () => {
    const input = `
# Title
## Section
### Subsection
Some text.
`;
    // Shift by +1
    expect(remapMarkdownHeadings(input, 1)).toBe(`
## Title
### Section
#### Subsection
Some text.
`);

    // Shift by -1
    expect(remapMarkdownHeadings(input, -1)).toBe(`
# Title
# Section
## Subsection
Some text.
`);
  });

  it("should clamp heading depth between 1 and 6", () => {
    const input = `
# Depth 1
###### Depth 6
`;
    // Shift by -2 (should clamp at 1)
    expect(remapMarkdownHeadings(input, -2)).toBe(`
# Depth 1
#### Depth 6
`);

    // Shift by +2 (should clamp at 6)
    expect(remapMarkdownHeadings(input, 2)).toBe(`
### Depth 1
###### Depth 6
`);
  });

  it("should preserve headings inside code blocks", () => {
    const input = `
## Heading 2

\`\`\`python
# This is a comment, not a heading
print("Hello # World")
\`\`\`

### Heading 3
`;
    expect(remapMarkdownHeadings(input, 1)).toBe(`
### Heading 2

\`\`\`python
# This is a comment, not a heading
print("Hello # World")
\`\`\`

#### Heading 3
`);
  });

  it("should preserve formatting, list items, and whitespace", () => {
    const input = `
## **Bold Title** with _italics_

- Item 1
- Item 2
  - Nested Item

### Title with \`code\`
`;
    expect(remapMarkdownHeadings(input, -1)).toBe(`
# **Bold Title** with _italics_

- Item 1
- Item 2
  - Nested Item

## Title with \`code\`
`);
  });
});
