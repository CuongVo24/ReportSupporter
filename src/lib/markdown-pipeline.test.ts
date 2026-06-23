import { describe, it, expect } from "vitest";
import { renderMarkdown, parseMarkdown } from "./markdown-pipeline";

describe("Markdown Pipeline", () => {
  describe("parseMarkdown", () => {
    it("parses headings and simple text into mdast AST", () => {
      const ast = parseMarkdown("# Tiêu đề 1\nNội dung đơn giản");
      expect(ast.type).toBe("root");
      
      const headingNode = ast.children[0] as { type: string; depth: number };
      expect(headingNode.type).toBe("heading");
      expect(headingNode.depth).toBe(1);
      
      const paragraphNode = ast.children[1];
      expect(paragraphNode.type).toBe("paragraph");
    });

    it("parses math blocks correctly as math nodes", () => {
      const ast = parseMarkdown("Inline $E=mc^2$ math.");
      const paragraph = ast.children[0] as { type: string; children: Array<{ type: string; value: string }> };
      expect(paragraph.type).toBe("paragraph");
      const mathNode = paragraph.children[1];
      expect(mathNode.type).toBe("inlineMath");
      expect(mathNode.value).toBe("E=mc^2");
    });
  });

  describe("renderMarkdown", () => {
    it("renders GFM tables into HTML table tags", () => {
      const markdown = `| Header 1 | Header 2 |
|---|---|
| Cell 1 | Cell 2 |`;
      const html = renderMarkdown(markdown);
      expect(html).toContain("<table>");
      expect(html).toContain("<thead>");
      expect(html).toContain("<tbody>");
      expect(html).toContain("Cell 1");
    });

    it("renders math equations with KaTeX CSS classes", () => {
      const inlineMath = "Công thức $a^2 + b^2 = c^2$ trong dòng.";
      const displayMath = `$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$`;
      
      const htmlInline = renderMarkdown(inlineMath);
      const htmlDisplay = renderMarkdown(displayMath);
      
      expect(htmlInline).toContain("katex");
      expect(htmlInline).toContain("katex-html");
      expect(htmlDisplay).toContain("katex-display");
    });

    it("renders code fences with highlightjs style classes", () => {
      const codeBlock = `\`\`\`ts
const x: number = 42;
console.log(x);
\`\`\``;
      const html = renderMarkdown(codeBlock);
      expect(html).toContain("hljs");
      expect(html).toContain("language-ts");
    });

    it("sanitizes dangerous HTML markup to prevent XSS", () => {
      // 1. Script injection
      const scriptInput = "Text <script>alert(1)</script> End";
      const scriptOutput = renderMarkdown(scriptInput);
      expect(scriptOutput).not.toContain("<script>");
      expect(scriptOutput).toContain("Text alert(1) End"); // <script> tag is dropped by default parser settings

      // 2. Event handler injection
      const onerrorInput = 'Text <img src="x" onerror="alert(1)"> End';
      const onerrorOutput = renderMarkdown(onerrorInput);
      expect(onerrorOutput).not.toContain("onerror");
      expect(onerrorOutput).not.toContain("<img"); // since raw HTML tags are dropped by remark-rehype default settings

      // 3. javascript: protocol in links
      const jsLinkInput = "[Click me](javascript:alert(1))";
      const jsLinkOutput = renderMarkdown(jsLinkInput);
      expect(jsLinkOutput).not.toContain("href=\"javascript:");
      // rehype-sanitize strips unsafe protocols
      expect(jsLinkOutput).toContain("<a>Click me</a>"); // href is stripped
    });

    it("allows data: protocol for offline base64 image assets", () => {
      const dataImgInput = "![Alt](data:image/png;base64,iVBORw0KGgoAAAANS)";
      const html = renderMarkdown(dataImgInput);
      expect(html).toContain("src=\"data:image/png;base64,iVBORw0KGgoAAAANS\"");
    });

    it("returns empty string or safe fallback for empty/whitespace input", () => {
      expect(renderMarkdown("")).toBe("");
      expect(renderMarkdown("   ")).toBe("");
    });

    it("returns error placeholder if rendering throws an exception", () => {
      const html = renderMarkdown(Symbol("test") as unknown as string);
      expect(html).toContain("ws-preview-error");
      expect(html).toContain("Không render được nội dung");
    });
  });
});

