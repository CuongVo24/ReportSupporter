import { describe, it, expect } from "vitest";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { parseHeadings } from "./parse-headings";
import { numberHeadings } from "./number-headings";

describe("Heading Parser & Numbering", () => {
  it("should parse headings from mdast correctly", () => {
    const md = `
# Chapter 1
## Section 1.1
### Subsection 1.1.1
## Section 1.2
    `;
    const ast = parseMarkdown(md);
    const headings = parseHeadings(ast);
    expect(headings).toEqual([
      { depth: 1, text: "Chapter 1" },
      { depth: 2, text: "Section 1.1" },
      { depth: 3, text: "Subsection 1.1.1" },
      { depth: 2, text: "Section 1.2" },
    ]);
  });

  it("should extract clean text from headings with markdown formatting", () => {
    const md = `
# Chapter **1** *Italic* \`Code\` [Link](http://google.com)
    `;
    const ast = parseMarkdown(md);
    const headings = parseHeadings(ast);
    expect(headings[0].text).toBe("Chapter 1 Italic Code Link");
  });

  it("should format and number headings deterministically", () => {
    const headings = [
      { depth: 1, text: "Kiến trúc" },
      { depth: 2, text: "Tổng quan" },
      { depth: 2, text: "Chi tiết" },
      { depth: 3, text: "Thành phần" },
    ];
    const numbered = numberHeadings(headings);
    expect(numbered).toEqual([
      { depth: 1, text: "Kiến trúc", number: "1", id: "1-kien-truc", levelJumped: false },
      { depth: 2, text: "Tổng quan", number: "1.1", id: "1-1-tong-quan", levelJumped: false },
      { depth: 2, text: "Chi tiết", number: "1.2", id: "1-2-chi-tiet", levelJumped: false },
      { depth: 3, text: "Thành phần", number: "1.2.1", id: "1-2-1-thanh-phan", levelJumped: false },
    ]);
  });

  it("should reset counters for deeper levels when returning to a higher level", () => {
    const headings = [
      { depth: 1, text: "H1" },
      { depth: 2, text: "H1.1" },
      { depth: 3, text: "H1.1.1" },
      { depth: 2, text: "H1.2" }, // level 3 resets
      { depth: 3, text: "H1.2.1" }, // should be 1.2.1, not 1.2.2
    ];
    const numbered = numberHeadings(headings);
    expect(numbered[3].number).toBe("1.2");
    expect(numbered[4].number).toBe("1.2.1");
  });

  it("should flag level jumps", () => {
    const headings = [
      { depth: 1, text: "H1" },
      { depth: 3, text: "H3" }, // skips level 2
    ];
    const numbered = numberHeadings(headings);
    expect(numbered[0].levelJumped).toBe(false);
    expect(numbered[1].levelJumped).toBe(true);
  });

  it("should flag level jump on the first node if depth is greater than 1", () => {
    const headings = [
      { depth: 2, text: "H2" },
    ];
    const numbered = numberHeadings(headings);
    expect(numbered[0].levelJumped).toBe(true);
  });

  it("should exclude empty-text headings from numbering output", () => {
    const headings = [
      { depth: 1, text: "H1" },
      { depth: 2, text: "" }, // empty heading
      { depth: 2, text: "H1.2" }, // should be 1.1 because empty was skipped
    ];
    const numbered = numberHeadings(headings);
    expect(numbered.length).toBe(2);
    expect(numbered[1].number).toBe("1.1");
    expect(numbered[1].id).toBe("1-1-h1-2");
  });

  it("should stabilize parent levels to avoid 0.x numbering when starting with a sublevel", () => {
    const headings = [
      { depth: 2, text: "Mở đầu h2" },
      { depth: 3, text: "Mở đầu h3" },
      { depth: 1, text: "Chương mới h1" },
    ];
    const numbered = numberHeadings(headings);
    expect(numbered[0].number).toBe("1.1");
    expect(numbered[1].number).toBe("1.1.1");
    expect(numbered[2].number).toBe("2");
  });

  it("should strip manual prefix numbers and generate clean heading texts", () => {
    const md = `
# 1. Giới thiệu
## 6.1. Vấn đề chính
### 1) Tổng quan chi tiết
## 1.1 - Quy trình hoạt động
    `;
    const ast = parseMarkdown(md);
    const headings = parseHeadings(ast);
    expect(headings).toEqual([
      { depth: 1, text: "Giới thiệu" },
      { depth: 2, text: "Vấn đề chính" },
      { depth: 3, text: "Tổng quan chi tiết" },
      { depth: 2, text: "Quy trình hoạt động" },
    ]);
  });

  it("should protect non-numbering years at heading starts", () => {
    const md = `
# 2026 Báo cáo thường niên
# Báo cáo năm 2024
    `;
    const ast = parseMarkdown(md);
    const headings = parseHeadings(ast);
    expect(headings).toEqual([
      { depth: 1, text: "2026 Báo cáo thường niên" },
      { depth: 1, text: "Báo cáo năm 2024" },
    ]);
  });
});

