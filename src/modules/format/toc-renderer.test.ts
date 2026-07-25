import { describe, expect, it } from "vitest";
import type { TocNode } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { parseHeadings } from "./parse-headings";
import { renderTocToHtml } from "./toc-renderer";

function tocNode(overrides: Partial<TocNode> = {}): TocNode {
  return {
    id: "safe-id",
    number: "1",
    text: "Safe heading",
    level: 1,
    sectionId: "section-1",
    children: [],
    ...overrides,
  };
}

describe("renderTocToHtml", () => {
  it("escapes all user-controlled TOC fields", () => {
    const html = renderTocToHtml([
      tocNode({
        id: '\" onclick=\"alert(1)',
        number: "<svg/onload=alert(1)>",
        text: '<img src=x onerror="alert(1)">',
      }),
    ]);

    expect(html).not.toContain("<img");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain('onclick="alert(1)"');
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("href=\"#user-content-&quot; onclick=&quot;alert(1)\"");
  });

  it("does not treat raw HTML inside Markdown headings as display text", () => {
    const headings = parseHeadings(parseMarkdown("# Safe <img src=x onerror=alert(1)> title"));

    expect(headings).toHaveLength(1);
    expect(headings[0].text).toBe("Safe  title");
  });
});
