import { describe, expect, it, vi } from "vitest";
import { formatOcrTextToMarkdown, performOcrOnCanvas } from "./ocr";

vi.mock("tesseract.js", () => ({
  createWorker: vi.fn().mockResolvedValue({
    recognize: vi.fn().mockResolvedValue({
      data: {
        text: "MỞ ĐẦU\nĐây là dòng nội dung thứ nhất.\n\nNỘI DUNG CHÍNH\nĐây là dòng nội dung thứ hai.",
      },
    }),
    terminate: vi.fn().mockResolvedValue({}),
  }),
}));

describe("OCR Formatter", () => {
  it("should format plain text, group paragraphs, and guess uppercase short lines as headings", () => {
    const rawOcr = "GIỚI THIỆU DỰ ÁN\nĐây là dòng thứ nhất.\nĐây là dòng thứ hai.\n\nKẾT QUẢ ĐẠT ĐƯỢC\nHoàn thành 100% chỉ tiêu.";
    const markdown = formatOcrTextToMarkdown(rawOcr);

    expect(markdown).toContain("Đây là văn bản được trích xuất bằng OCR thử nghiệm");
    expect(markdown).toContain("## GIỚI THIỆU DỰ ÁN <!-- heading-guessed -->");
    expect(markdown).toContain("## KẾT QUẢ ĐẠT ĐƯỢC <!-- heading-guessed -->");
    expect(markdown).toContain("Đây là dòng thứ nhất. Đây là dòng thứ hai.");
    expect(markdown).toContain("Hoàn thành 100% chỉ tiêu.");
  });
});

describe("performOcrOnCanvas", () => {
  it("should complete recognition on a mock canvas using mocked worker", async () => {
    const mockCanvas = {} as HTMLCanvasElement;
    const text = await performOcrOnCanvas(mockCanvas);
    expect(text).toContain("MỞ ĐẦU");
    expect(text).toContain("NỘI DUNG CHÍNH");
  });
});
