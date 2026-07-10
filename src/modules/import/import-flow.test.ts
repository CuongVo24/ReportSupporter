import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { convertImportFile } from "./registry";
import { buildMarkdownImportDraft } from "../write/markdown-import";

describe("DOCX Import Flow Snapshot and Verification", () => {
  const getFixtureFile = (filename: string): File => {
    const filePath = path.resolve(process.cwd(), "src/modules/import/__fixtures__", filename);
    const buffer = fs.readFileSync(filePath);
    return new File([buffer], filename, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  };

  it("should process vn_mon_hoc_report.docx successfully with multi-level headings, lists, and tables", async () => {
    const file = getFixtureFile("vn_mon_hoc_report.docx");
    const result = await convertImportFile(file);

    // Verify raw convert result
    expect(result.sourceFormat).toBe("docx");
    expect(result.fileName).toBe("vn_mon_hoc_report.docx");
    expect(result.markdown).toContain("BÁO CÁO MÔN HỌC KIỂM THỬ PHẦN MỀM");
    expect(result.markdown).toContain("I. Giới thiệu chung");
    // Verify stripHeadingNumbers works for 1.1 and 1.1.1 (the numbers should be stripped)
    // 1.1 Cơ sở lý thuyết -> should become Cơ sở lý thuyết
    expect(result.markdown).toContain("## Cơ sở lý thuyết");
    // 1.1.1 Mục tiêu kiểm thử -> should become Mục tiêu kiểm thử
    expect(result.markdown).toContain("### Mục tiêu kiểm thử");

    // Verify lists and tables are preserved in markdown
    expect(result.markdown).toContain("Tăng độ bao phủ mã nguồn (code coverage) trên 80%.");
    expect(result.markdown).toContain("STT");
    expect(result.markdown).toContain("Tên ca kiểm thử");
    expect(result.markdown).toContain("Kết quả");
    expect(result.markdown).toContain("Kiểm tra Đăng nhập");

    // Build the final ImportDraft
    const draft = await buildMarkdownImportDraft(
      result.fileName,
      result.markdown,
      result.assets,
      [],
      undefined,
      result.sourceFormat
    );

    // Verify draft structure
    expect(draft.result.sourceFormat).toBe("docx");
    expect(draft.sections.length).toBeGreaterThan(0);
    // Title is inferred from HeadingLevel.TITLE in docx
    expect(draft.sections[0].title).toBe("BÁO CÁO MÔN HỌC KIỂM THỬ PHẦN MỀM");

    // Capture Snapshots
    expect(draft.result.markdown).toMatchSnapshot("vn_mon_hoc_report_markdown");
    expect(draft.sections).toMatchSnapshot("vn_mon_hoc_report_sections");
    expect(draft.result.warnings).toMatchSnapshot("vn_mon_hoc_report_warnings");
  });

  it("should process vn_anh_nhung_report.docx successfully and capture warning on skipped images", async () => {
    const file = getFixtureFile("vn_anh_nhung_report.docx");
    const result = await convertImportFile(file);

    expect(result.sourceFormat).toBe("docx");
    expect(result.fileName).toBe("vn_anh_nhung_report.docx");
    
    // Mammoth warnings regarding images
    expect(result.warnings.length).toBeGreaterThan(0);
    const hasImageWarning = result.warnings.some(
      (w) => w.code === "image-skipped" && w.message.includes("Bỏ qua hình ảnh trong tệp DOCX")
    );
    expect(hasImageWarning).toBe(true);

    const draft = await buildMarkdownImportDraft(
      result.fileName,
      result.markdown,
      result.assets,
      [],
      undefined,
      result.sourceFormat
    );

    expect(draft.result.markdown).toMatchSnapshot("vn_anh_nhung_report_markdown");
    expect(draft.sections).toMatchSnapshot("vn_anh_nhung_report_sections");
    expect(draft.result.warnings).toMatchSnapshot("vn_anh_nhung_report_warnings");
  });

  it("should process vn_track_changes_report.docx successfully with hardcoded numbered headings and edits", async () => {
    const file = getFixtureFile("vn_track_changes_report.docx");
    const result = await convertImportFile(file);

    expect(result.sourceFormat).toBe("docx");
    expect(result.fileName).toBe("vn_track_changes_report.docx");
    // Verify stripHeadingNumbers works for "1. Giới thiệu tổng quan" -> "Giới thiệu tổng quan"
    expect(result.markdown).toContain("# Giới thiệu tổng quan");
    // "1.2 Kết quả đạt được sau chỉnh sửa" -> "Kết quả đạt được sau chỉnh sửa"
    expect(result.markdown).toContain("## Kết quả đạt được sau chỉnh sửa");

    const draft = await buildMarkdownImportDraft(
      result.fileName,
      result.markdown,
      result.assets,
      [],
      undefined,
      result.sourceFormat
    );

    expect(draft.result.markdown).toMatchSnapshot("vn_track_changes_report_markdown");
    expect(draft.sections).toMatchSnapshot("vn_track_changes_report_sections");
    expect(draft.result.warnings).toMatchSnapshot("vn_track_changes_report_warnings");
  });
});
