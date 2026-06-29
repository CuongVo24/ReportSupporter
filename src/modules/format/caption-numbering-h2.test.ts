import { describe, it, expect } from "vitest";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { numberHeadings } from "./number-headings";
import { buildCaptionRegistry } from "./caption-registry";

describe("Heading & Caption Numbering with H2 chapters", () => {
  it("should number headings correctly starting from H2 when no H1 is present", () => {
    const headings = [
      { depth: 2, text: "Chương một" },
      { depth: 3, text: "Mục con 1.1" },
      { depth: 2, text: "Chương hai" },
    ];
    const numbered = numberHeadings(headings);
    expect(numbered[0].number).toBe("1");
    expect(numbered[1].number).toBe("1.1");
    expect(numbered[2].number).toBe("2");
  });

  it("should detect H1 as report title and treat H2 as chapter if only one H1 is at the start", () => {
    const headings = [
      { depth: 1, text: "Báo cáo thực tập tốt nghiệp" },
      { depth: 2, text: "Giới thiệu" },
      { depth: 3, text: "Mục đích đề tài" },
      { depth: 2, text: "Nội dung" },
    ];
    const numbered = numberHeadings(headings);
    expect(numbered[0].number).toBe(""); // Ignored report title
    expect(numbered[1].number).toBe("1"); // First chapter starts at H2
    expect(numbered[2].number).toBe("1.1");
    expect(numbered[3].number).toBe("2");
  });

  it("should respect author numbering in headings when respectAuthorNumbering is true", () => {
    const headings = [
      { depth: 2, text: "2. Giới thiệu" },
      { depth: 3, text: "2.1 Mục đích đề tài" },
      { depth: 3, text: "Mục tiếp theo" }, // Should auto-number to 2.2
    ];
    const numbered = numberHeadings(headings, { respectAuthorNumbering: true });
    expect(numbered[0].number).toBe("2");
    expect(numbered[1].number).toBe("2.1");
    expect(numbered[2].number).toBe("2.2");
  });

  it("should construct caption registry using H2 as chapter depth", () => {
    const md1 = `
## Chương hai
![Ảnh 1](fig1.png)
Hình 2.1: Sơ đồ thiết kế
    `;
    const md2 = `
## Chương ba
![Ảnh 2](fig2.png)
Hình 3.1: Sơ đồ hoạt động
    `;
    const sections = [
      { id: "sec1", ast: parseMarkdown(md1) },
      { id: "sec2", ast: parseMarkdown(md2) },
    ];

    const registry = buildCaptionRegistry(sections, {
      captionNumbering: "per-chapter",
      respectAuthorNumbering: true,
    });

    expect(registry.length).toBe(2);
    expect(registry[0].label).toBe("Hình 2.1");
    expect(registry[0].text).toBe("Sơ đồ thiết kế");
    expect(registry[1].label).toBe("Hình 3.1");
    expect(registry[1].text).toBe("Sơ đồ hoạt động");
  });

  it("should not regress traditional H1-rooted documents", () => {
    const headings = [
      { depth: 1, text: "Chương 1" },
      { depth: 2, text: "Mục 1.1" },
      { depth: 1, text: "Chương 2" },
    ];
    const numbered = numberHeadings(headings);
    expect(numbered[0].number).toBe("1");
    expect(numbered[1].number).toBe("1.1");
    expect(numbered[2].number).toBe("2");
  });
});
