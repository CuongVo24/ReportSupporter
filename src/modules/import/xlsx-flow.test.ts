import { describe, expect, it } from "vitest";
import { convertImportFile } from "./registry";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

describe("XLSX Flow Snapshot and Hardening", () => {
  const fixturesDir = path.join(__dirname, "__fixtures__");

  it("should process bang_diem_merges.xlsx successfully and flatten merges with a warning", async () => {
    const filePath = path.join(fixturesDir, "bang_diem_merges.xlsx");
    const buf = fs.readFileSync(filePath);
    const file = new File([buf], "bang_diem_merges.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await convertImportFile(file);

    expect(result.sourceFormat).toBe("xlsx");
    expect(result.fileName).toBe("bang_diem_merges.xlsx");
    expect(result.markdown).toMatchSnapshot();

    // Verify warning for merged cells
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0].code).toBe("unsupported-element");
    expect(result.warnings[0].message).toContain("ô hợp nhất");
    expect(result.warnings[0].location).toBe('sheet "Bảng Điểm"');
  });

  it("should process sheet_an.xlsx successfully and skip hidden sheets with warnings", async () => {
    const filePath = path.join(fixturesDir, "sheet_an.xlsx");
    const buf = fs.readFileSync(filePath);
    const file = new File([buf], "sheet_an.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await convertImportFile(file);

    expect(result.sourceFormat).toBe("xlsx");
    expect(result.markdown).toMatchSnapshot();

    // Verify warnings for hidden sheet
    const hiddenWarning = result.warnings.find(
      (w) => w.code === "unsupported-element" && w.message.includes("bị ẩn")
    );
    expect(hiddenWarning).toBeDefined();
    expect(hiddenWarning?.location).toBe('sheet "Cấu Hình"');

    // Confirm that the hidden sheet's content is NOT in markdown
    expect(result.markdown).not.toContain("API_URL");
    expect(result.markdown).toContain("Sản phẩm A");
  });

  it("should reject old .xls format files", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "old_report.xls", {
      type: "application/vnd.ms-excel",
    });

    await expect(convertImportFile(file)).rejects.toThrow(
      "Định dạng Excel cũ (.xls) không được hỗ trợ. Vui lòng lưu lại thành định dạng .xlsx mới hơn."
    );
  });

  it("should throw error if workbook contains no visible sheets", async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["Secret Data"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Secret");
    if (!wb.Workbook) wb.Workbook = {};
    wb.Workbook.Sheets = [{ name: "Secret", Hidden: 1 }];

    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const file = new File([new Uint8Array(buf)], "all_hidden.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await expect(convertImportFile(file)).rejects.toThrow(
      "Tệp Excel không chứa trang tính hiển thị nào."
    );
  });

  it("should enforce capping limit (500 rows, 30 columns) and report exact truncated counts", async () => {
    // Generate a workbook sheet with 505 rows and 32 columns
    const wb = XLSX.utils.book_new();
    const headers = Array.from({ length: 32 }, (_, i) => `Col ${i + 1}`);
    const data = [headers];
    for (let i = 0; i < 504; i++) {
      data.push(Array.from({ length: 32 }, (_, j) => `Row ${i + 1} Col ${j + 1}`));
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "SheetCapping");

    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const file = new File([new Uint8Array(buf)], "capping.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await convertImportFile(file);

    // Verify GFM table boundaries (500 rows including header, so 1 header + 499 data rows)
    const lines = result.markdown.split("\n");
    // Verify columns count in header row (columns index from 0 to 29 -> 30 columns)
    const headerLine = lines.find((l) => l.startsWith("| Col 1 |"));
    expect(headerLine).toBeDefined();
    expect(headerLine?.split("|").length).toBe(32); // 30 columns + 2 outer pipe segments resulting in 32 items when split

    // Verify warnings contains sheet-truncated details (2 columns, 5 rows)
    const capWarning = result.warnings.find((w) => w.code === "sheet-truncated");
    expect(capWarning).toBeDefined();
    expect(capWarning?.message).toContain("Đã cắt 2 cột và 5 hàng vượt quá giới hạn");
    expect(capWarning?.location).toBe('sheet "SheetCapping"');
  });
});
