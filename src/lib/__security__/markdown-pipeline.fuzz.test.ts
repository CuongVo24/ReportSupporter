// W25-K (S4): DOM-clobbering corpus for the sanitize schema's
// `clobberPrefix: ""` (markdown-pipeline.ts:18). rehype-sanitize normally
// prefixes user-supplied ids (default "user-content-") specifically to stop
// an id/name colliding with a global DOM/window property name. This project
// disables that prefix so heading anchors match generated TOC hrefs
// (`number-headings.ts` slugify → `inject-headings.ts` hProperties.id) — a
// correctness trade-off, but it means a report title heading (shallower
// than the detected chapter depth, so it gets a bare, un-numbered slug —
// see `number-headings.ts` `effectiveDepth < 1` branch) renders e.g.
// `<h1 id="constructor">` verbatim into the DOM via the preview pane's
// `dangerouslySetInnerHTML`. This is a documented residual risk
// (Design/Security/ThreatModel.md T1), not something this test suite
// fixes — it pins the current, known behavior so the tradeoff stays
// visible instead of silently drifting.
import { describe, expect, it } from "vitest";
import { pick, mulberry32 } from "@/test/fuzz-utils";
import { parseMarkdown, renderMdastToHtml } from "../markdown-pipeline";
import { injectHeadingNumbers } from "@/modules/format/inject-headings";
import { numberHeadings } from "@/modules/format/number-headings";
import { parseHeadings } from "@/modules/format/parse-headings";

const DANGEROUS_IDS = [
  "constructor",
  // "__proto__" deliberately excluded: double underscores are CommonMark
  // strong-emphasis delimiters, so a literal "__proto__" heading renders as
  // <strong>proto</strong> (flattened text "proto") unless the user escapes
  // the underscores — a real but separate nuance from the id-clobbering gap
  // this suite documents.
  "prototype",
  "body",
  "location",
  "attributes",
  "children",
];

// Forces detectChapterDepthFromHeadings' mitigation branch (H1 title
// excluded from numbering): `parseHeadings` already strips any leading
// "1 "/"1.2 " number prefix before `numberHeadings` sees the text, so the
// only realistic way to make an H1 title fall into the bare-slug branch is
// the `isH1Long` heuristic (raw text length > 25 chars — word count doesn't
// apply here since dots aren't whitespace-separated "words"). Padding the
// dangerous word with punctuation on both sides pushes the raw title over
// 25 chars for that heuristic, while `slugify` strips all non-alphanumeric
// characters and collapses/trims hyphens, so the resulting id is still
// exactly the bare dangerous word once punctuation is stripped.
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

describe("markdown-pipeline — heading id clobbering (documented residual risk)", () => {
  it("still strips an actual <script> tag even when the title is a dangerous id candidate", () => {
    const html = renderWithHeadingIds("# constructor\n\n<script>alert(1)</script>\n\n## 1 Introduction\n");
    expect(html).not.toContain("<script");
  });

  it("assigns the bare, unprefixed dangerous word as the H1 id when it is the report title", () => {
    for (const dangerous of DANGEROUS_IDS) {
      const html = renderWithHeadingIds(markdownWithBareTitleId(dangerous));
      // clobberPrefix: "" means no "user-content-" (or any) prefix is added.
      expect(html).toMatch(new RegExp(`<h1[^>]*\\bid="${dangerous}"`));
    }
  });

  it("bounded fuzz: seeded dangerous-word titles always keep the raw slug as the h1 id", () => {
    const rand = mulberry32(20260724);
    for (let i = 0; i < 20; i++) {
      const word = pick(rand, DANGEROUS_IDS);
      const html = renderWithHeadingIds(markdownWithBareTitleId(word));
      expect(html).toMatch(new RegExp(`<h1[^>]*\\bid="${word}"`));
    }
  });
});
