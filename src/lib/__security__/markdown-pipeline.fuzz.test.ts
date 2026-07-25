// W25-I: DOM-clobbering prevention fuzz test suite.
// Verifies that heading IDs are safely prefixed with `user-content-` by rehype-sanitize,
// ensuring user-supplied markdown headings (e.g. # location, # constructor) cannot
// shadow or clobber DOM global window/document properties.
import { describe, expect, it } from "vitest";
import { pick, mulberry32 } from "@/test/fuzz-utils";
import { parseMarkdown, renderMdastToHtml, HEADING_DOM_CLOBBER_PREFIX } from "../markdown-pipeline";
import { injectHeadingNumbers } from "@/modules/format/inject-headings";
import { numberHeadings } from "@/modules/format/number-headings";
import { parseHeadings } from "@/modules/format/parse-headings";

const DANGEROUS_IDS = [
  "constructor",
  "prototype",
  "body",
  "location",
  "attributes",
  "children",
  "forms",
];

function markdownWithBareTitleId(dangerous: string): string {
  const padding = ".".repeat(20);
  return `# ${padding}${dangerous}${padding}\n\n## Introduction\n\nBody text.\n`;
}

function renderWithHeadingIds(markdown: string): string {
  const ast = parseMarkdown(markdown);
  const headings = parseHeadings(ast);
  const numbered = numberHeadings(headings);
  injectHeadingNumbers(ast, numbered, { index: 0 });
  return renderMdastToHtml(ast);
}

describe("markdown-pipeline — DOM Clobbering Protection (W25-I)", () => {
  it("strips executable <script> tags from rendered output", () => {
    const html = renderWithHeadingIds("# constructor\n\n<script>alert(1)</script>\n\n## 1 Introduction\n");
    expect(html).not.toContain("<script");
  });

  it("prefixes dangerous heading IDs with user-content- prefix to prevent DOM clobbering", () => {
    for (const dangerous of DANGEROUS_IDS) {
      const html = renderWithHeadingIds(markdownWithBareTitleId(dangerous));
      expect(html).toMatch(new RegExp(`<h1[^>]*\\bid="${HEADING_DOM_CLOBBER_PREFIX}${dangerous}"`));
      expect(html).not.toMatch(new RegExp(`<h1[^>]*\\bid="${dangerous}"`));
    }
  });

  it("bounded fuzz: seeded dangerous-word titles always receive the user-content- prefix", () => {
    const rand = mulberry32(20260724);
    for (let i = 0; i < 20; i++) {
      const word = pick(rand, DANGEROUS_IDS);
      const html = renderWithHeadingIds(markdownWithBareTitleId(word));
      expect(html).toMatch(new RegExp(`<h1[^>]*\\bid="${HEADING_DOM_CLOBBER_PREFIX}${word}"`));
    }
  });
});
