// W25-I: DOM-clobbering prevention fuzz test suite.
// Verifies that heading IDs are safely prefixed with `user-content-` by rehype-sanitize,
// ensuring user-supplied markdown headings (e.g. # location, # constructor) cannot
// shadow or clobber DOM global window/document properties.
import { describe, expect, it } from "vitest";
import { pick, mulberry32 } from "@/test/fuzz-utils";
import { parseMarkdown, renderMdastToHtml, sanitizeSvgMarkup, HEADING_DOM_CLOBBER_PREFIX } from "../markdown-pipeline";
import { injectHeadingNumbers } from "@/modules/format/inject-headings";
import { numberHeadings } from "@/modules/format/number-headings";
import { parseHeadings } from "@/modules/format/parse-headings";
import * as markdownPipeline from "../markdown-pipeline";

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

  it("does not export a raw-string-to-SanitizedHtml constructor (asSanitizedHtml)", () => {
    expect((markdownPipeline as Record<string, unknown>).asSanitizedHtml).toBeUndefined();
  });
});

// NOTE: markdown-pipeline never enables rehype-raw/allowDangerousHtml, so
// raw HTML typed directly in markdown source is inert text, never real
// elements — the customSchema/style-narrowing below only matters for hast
// nodes plugins (KaTeX, rehype-highlight) generate programmatically, or for
// non-markdown-derived HTML/SVG strings fed through sanitizeSvgMarkup()
// (e.g. Mermaid). Exercise the narrowing through sanitizeSvgMarkup(), which
// runs the exact same customSchema + rehypeNarrowStyleAndClassName pass on
// real parsed elements — verifying the narrowing logic without depending on
// remark-rehype's raw-HTML behavior (a separate, orthogonal protection).
describe("sink style/className narrowing (W25-I)", () => {
  it("strips CSS url() from an inline style attribute (CSS exfiltration vector)", () => {
    const out = sanitizeSvgMarkup('<svg><rect style="fill: red; background-image: url(https://evil.example/track.png)"/></svg>');
    expect(out).not.toContain("url(");
  });

  it("drops a non-allowlisted CSS property entirely (e.g. position)", () => {
    const out = sanitizeSvgMarkup('<span style="position: fixed; color: blue">x</span>');
    expect(out).not.toContain("position");
    expect(out).toContain("color: blue");
  });

  it("keeps KaTeX/highlight/app class prefixes but drops an arbitrary injected class", () => {
    const out = sanitizeSvgMarkup('<span class="katex-mathml evil-tracker-class ws-token">x</span>');
    expect(out).toContain("katex-mathml");
    expect(out).toContain("ws-token");
    expect(out).not.toContain("evil-tracker-class");
  });
});

describe("sanitizeSvgMarkup — Mermaid SVG sink (W25-I)", () => {
  it("strips a <script> tag embedded in raw SVG output", () => {
    const out = sanitizeSvgMarkup('<svg><script>alert(document.cookie)</script><rect width="10" height="10"/></svg>');
    expect(out).not.toContain("<script");
    expect(out).toContain("<rect");
  });

  it("strips inline event handlers from SVG elements", () => {
    const out = sanitizeSvgMarkup('<svg><rect width="10" height="10" onload="alert(1)"/></svg>');
    expect(out).not.toContain("onload");
  });

  it("strips href from <use> in Mermaid-generated SVG", () => {
    const out = sanitizeSvgMarkup('<svg><use href="javascript:alert(1)"></use></svg>');
    expect(out).not.toContain("href=");
  });

  it("returns an empty string rather than throwing on unparseable input", () => {
    expect(() => sanitizeSvgMarkup("<svg><<<broken")).not.toThrow();
  });
});
