import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "./html-to-markdown";

describe("htmlToMarkdown reverse pipeline", () => {
  it("converts headings properly", () => {
    expect(htmlToMarkdown("<h1>Heading 1</h1>")).toBe("# Heading 1");
    expect(htmlToMarkdown("<h2>Heading 2</h2>")).toBe("## Heading 2");
    expect(htmlToMarkdown("<h3>Heading 3</h3>")).toBe("### Heading 3");
    expect(htmlToMarkdown("<h4>Heading 4</h4>")).toBe("#### Heading 4");
    expect(htmlToMarkdown("<h5>Heading 5</h5>")).toBe("##### Heading 5");
    expect(htmlToMarkdown("<h6>Heading 6</h6>")).toBe("###### Heading 6");
  });

  it("converts basic text formatting", () => {
    expect(htmlToMarkdown("<p>This is <strong>strong</strong> and <em>emphasized</em> and <del>strikethrough</del>.</p>"))
      .toBe("This is **strong** and *emphasized* and ~~strikethrough~~.");
  });

  it("converts inline code and blockquotes", () => {
    expect(htmlToMarkdown("<p>Here is some <code>code</code></p>")).toBe("Here is some `code`");
    expect(htmlToMarkdown("<blockquote>Quote text</blockquote>")).toBe("> Quote text");
  });

  it("converts lists correctly", () => {
    const unordered = `
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
    `;
    expect(htmlToMarkdown(unordered)).toBe("* Item 1\n* Item 2");

    const ordered = `
      <ol>
        <li>First</li>
        <li>Second</li>
      </ol>
    `;
    expect(htmlToMarkdown(ordered)).toBe("1. First\n2. Second");
  });

  it("converts links and images correctly", () => {
    expect(htmlToMarkdown('<p><a href="https://example.com">Link text</a></p>'))
      .toBe("[Link text](https://example.com)");
    expect(htmlToMarkdown('<img src="data:image/png;base64,abc" alt="My Image" />'))
      .toBe("![My Image](data:image/png;base64,abc)");
  });

  it("converts HTML tables to GFM Markdown tables", () => {
    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Col 1</th>
            <th>Col 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A</td>
            <td>B</td>
          </tr>
        </tbody>
      </table>
    `;
    const expected = "| Col 1 | Col 2 |\n| ----- | ----- |\n| A     | B     |";
    expect(htmlToMarkdown(tableHtml)).toBe(expected);
  });

  it("sanitizes dangerous tags (XSS check)", () => {
    const dangerousHtml = `
      <div>
        <h3>Safe Content</h3>
        <script>alert('XSS')</script>
        <iframe src="https://unsafe.com"></iframe>
        <p>Another <img src="x" alt="x" onerror="alert('onerror')" /> safe paragraph.</p>
      </div>
    `;
    const md = htmlToMarkdown(dangerousHtml);
    expect(md).not.toContain("<script>");
    expect(md).not.toContain("alert");
    expect(md).not.toContain("iframe");
    expect(md).toContain("### Safe Content");
    expect(md).toContain("Another ![x](x) safe paragraph.");
  });
});
