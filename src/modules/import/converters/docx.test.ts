import { describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import { stripHeadingNumbers } from "../strip-heading-number";
import { docxConverter } from "./docx";

// A real (if minimal) ZIP structure so the W25-H central-directory preflight
// passes — mammoth itself is mocked below, so the actual DOCX XML content
// doesn't matter for these tests, only that the container is a valid ZIP.
async function fakeDocxFile(name = "test.docx"): Promise<File> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", "<Types/>");
  zip.file("word/document.xml", "<document/>");
  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  return new File([buffer], name, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

// Mock mammoth module to test converter flow in isolation without needing a binary DOCX generator
vi.mock("mammoth", () => {
  return {
    convertToHtml: vi.fn().mockImplementation(
      async () => {
        return {
          value: "<h1>1. Mở đầu</h1><p>Nội dung 1</p><h2>1.2. Mục tiêu</h2><p>Nội dung 2</p>",
          messages: [
            { type: "warning", message: "An image was skipped" },
            { type: "warning", message: "Unsupported element: some-tag" },
          ],
        };
      }
    ),
  };
});

describe("Heading Number Stripper", () => {
  it("strips heading numbers from markdown headings correctly", () => {
    const input =
      "# 1. Mở đầu\nNội dung 1\n## 1.2 Mục tiêu\nNội dung 2\n### 1.2.3. Chi tiết\nNội dung 3\n#### 1) Nhỏ hơn\nNội dung 4";
    const expected =
      "# Mở đầu\nNội dung 1\n## Mục tiêu\nNội dung 2\n### Chi tiết\nNội dung 3\n#### Nhỏ hơn\nNội dung 4";
    expect(stripHeadingNumbers(input)).toBe(expected);
  });

  it("does not strip years or numbers in body text", () => {
    const input =
      "# 1999 was a great year\n1. This is a list item, not a heading.\n## 12.3.4.5.6. Too deep heading number\nBody 2";
    const expected =
      "# 1999 was a great year\n1. This is a list item, not a heading.\n## Too deep heading number\nBody 2";
    expect(stripHeadingNumbers(input)).toBe(expected);
  });
});

describe("DOCX Converter", () => {
  it("converts docx file correctly and maps warnings in Vietnamese", async () => {
    const file = await fakeDocxFile();

    const result = await docxConverter.convert(file);
    expect(result.sourceFormat).toBe("docx");
    expect(result.fileName).toBe("test.docx");
    // Verify markdown headings are stripped
    expect(result.markdown).toContain("# Mở đầu");
    expect(result.markdown).toContain("## Mục tiêu");
    // Verify warnings mapping
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toEqual({
      code: "image-skipped",
      message:
        "Bỏ qua hình ảnh trong tệp DOCX (đã giữ lại đường dẫn tạm thời): An image was skipped",
    });
    expect(result.warnings[1]).toEqual({
      code: "unsupported-element",
      message: "Không hỗ trợ phần tử: Unsupported element: some-tag",
    });
  });
});
