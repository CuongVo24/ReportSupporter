import { describe, it, expect } from "vitest";
import { parseMarkdown, renderMdastToHtml } from "@/lib/markdown-pipeline";
import { parseHeadings } from "./parse-headings";
import { numberHeadings } from "./number-headings";
import { generateToc } from "./generate-toc";
import { injectHeadingNumbers } from "@/components/PreviewPane";

describe("W3 Break: TOC Anchors & Heading Numbering Parity", () => {
  it("preserves heading id through sanitization for TOC anchors (clobberPrefix check)", () => {
    const md = "# Giới thiệu";
    const ast = parseMarkdown(md);
    const headings = parseHeadings(ast);
    const numbered = numberHeadings(headings);
    const toc = generateToc(numbered);

    expect(toc[0].id).toBe("1-gioi-thieu");

    const renderState = { index: 0 };
    const numberedAst = injectHeadingNumbers(ast, numbered, renderState);
    const html = renderMdastToHtml(numberedAst);

    // Verify that the rendered heading ID matches the TOC href anchor (without user-content- prefix)
    expect(html).toContain('id="1-gioi-thieu"');
    expect(html).not.toContain('id="user-content-1-gioi-thieu"');
  });

  it("handles empty headings without shifting subsequent heading numbers", () => {
    const md = "# H1\n## \n## H2";
    const ast = parseMarkdown(md);
    const headings = parseHeadings(ast);
    const numbered = numberHeadings(headings);

    // Empty heading should be excluded by numberHeadings
    expect(numbered).toHaveLength(2);
    expect(numbered[0].number).toBe("1");
    expect(numbered[1].number).toBe("1.1");

    const renderState = { index: 0 };
    const numberedAst = injectHeadingNumbers(ast, numbered, renderState);
    const html = renderMdastToHtml(numberedAst);

    // Check that H2 gets numbered as 1.1, and empty heading is skipped
    expect(html).toContain("1 H1");
    expect(html).toContain("1.1 H2");
    expect(renderState.index).toBe(2);
  });

  it("computes document-wide numbering and slices for active section correctly", () => {
    const s1 = { id: "s1", order: 1, markdown: "# Chapter 1\n## Sec 1.1" };
    const s2 = { id: "s2", order: 2, markdown: "# Chapter 2\n## Sec 2.1" };

    const headings1 = parseHeadings(parseMarkdown(s1.markdown), s1.id);
    const headings2 = parseHeadings(parseMarkdown(s2.markdown), s2.id);

    const allHeadings = [...headings1, ...headings2];
    const globalNumbered = numberHeadings(allHeadings);

    // Chapter 2 heading should continue to be numbered "2" and "2.1"
    expect(globalNumbered[0].number).toBe("1");
    expect(globalNumbered[1].number).toBe("1.1");
    expect(globalNumbered[2].number).toBe("2");
    expect(globalNumbered[3].number).toBe("2.1");

    // Slicing for section 2
    const s2Slice = globalNumbered.filter((h) => h.sectionId === "s2");
    expect(s2Slice).toHaveLength(2);
    expect(s2Slice[0].number).toBe("2");
    expect(s2Slice[1].number).toBe("2.1");
  });
});
