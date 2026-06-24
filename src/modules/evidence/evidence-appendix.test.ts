import { describe, it, expect } from "vitest";
import type { EvidenceItem } from "@/types";
import { buildEvidenceAppendix } from "./evidence-appendix";

describe("buildEvidenceAppendix", () => {
  it("should return empty string when evidence list is empty or undefined", () => {
    expect(buildEvidenceAppendix([])).toBe("");
    // @ts-expect-error - testing fallback for javascript environments
    expect(buildEvidenceAppendix(null)).toBe("");
  });

  it("should output valid GFM table for valid evidence list", () => {
    const items: EvidenceItem[] = [
      {
        id: "1",
        kind: "github",
        title: "Report Supporter repo",
        url: "https://github.com/CuongVo24/ReportSupporter",
        note: "Trang mã nguồn chính",
        qrEnabled: true,
        createdAt: "2026-06-24T00:00:00Z",
      },
      {
        id: "2",
        kind: "video",
        title: "Demo video",
        url: "https://youtube.com/demo",
        qrEnabled: false,
        createdAt: "2026-06-24T00:00:00Z",
      },
    ];

    const result = buildEvidenceAppendix(items);
    
    // Check heading
    expect(result).toContain("## Phụ lục minh chứng");

    // Check table headers
    expect(result).toContain("| Loại | Tiêu đề | Liên kết | Ghi chú |");
    expect(result).toContain("| --- | --- | --- | --- |");

    // Check row 1
    expect(result).toContain("| Mã nguồn (GitHub) | Report Supporter repo | [Liên kết](https://github.com/CuongVo24/ReportSupporter) | Trang mã nguồn chính |");

    // Check row 2
    expect(result).toContain("| Video demo | Demo video | [Liên kết](https://youtube.com/demo) |  |");
  });

  it("should handle optional url correctly (renders empty cell)", () => {
    const items: EvidenceItem[] = [
      {
        id: "1",
        kind: "other",
        title: "Offline doc",
        qrEnabled: true,
        createdAt: "2026-06-24T00:00:00Z",
      },
    ];

    const result = buildEvidenceAppendix(items);
    expect(result).toContain("| Minh chứng khác | Offline doc |  |  |");
  });

  it("should escape | and replace newlines in cells", () => {
    const items: EvidenceItem[] = [
      {
        id: "1",
        kind: "drive",
        title: "Tài liệu | File chính",
        url: "https://drive.google.com/xyz?id=1|2",
        note: "Chú ý:\n- Đọc kỹ hướng dẫn\r\n- Check log",
        qrEnabled: true,
        createdAt: "2026-06-24T00:00:00Z",
      },
    ];

    const result = buildEvidenceAppendix(items);

    // | should be escaped to \|
    expect(result).toContain("Tài liệu \\| File chính");
    expect(result).toContain("[Liên kết](https://drive.google.com/xyz?id=1\\|2)");

    // Newlines should be replaced with spaces
    expect(result).toContain("Chú ý: - Đọc kỹ hướng dẫn - Check log");
    
    // Ensure no raw | breaks columns
    // The row pattern should match the escaped content
    expect(result).toContain("| Tài liệu (Google Drive) | Tài liệu \\| File chính | [Liên kết](https://drive.google.com/xyz?id=1\\|2) | Chú ý: - Đọc kỹ hướng dẫn - Check log |");
  });
});
