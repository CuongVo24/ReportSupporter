import { describe, expect, it, vi } from "vitest";
import { xlsxConverter } from "./xlsx";
import * as XLSX from "xlsx";

vi.mock("xlsx", async () => {
  const original = await vi.importActual<typeof import("xlsx")>("xlsx");
  return {
    ...original,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    read: (data: any, opts: any) => {
      const wb = original.read(data, opts);
      if (wb.Sheets["Bảng Giá"]) {
        // Inject uncomputed formula cell at C4
        wb.Sheets["Bảng Giá"]["C4"] = { t: "s", f: "CONCATENATE(A2, A3)" };
      }
      return wb;
    },
  };
});

describe("XLSX Converter", () => {
  it("should convert a multi-sheet workbook into GFM tables in sheet order", async () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: normal table with headers, formatted cells, escaped chars, formulas
    const ws1Data = [
      ["Tên sản phẩm", "Đơn giá", "Ghi chú"],
      ["Sản phẩm A", 123000, "Có hàng | Hỗ trợ vận chuyển"],
      ["Sản phẩm B", 0.05, "Dòng 1\nDòng 2"],
      ["", "", ""], // Empty row (should be stripped if trailing, but here it's followed by formula)
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);

    // Format Don gia currency for Row 1
    if (ws1["B2"]) {
      ws1["B2"].z = "#,##0";
      ws1["B2"].w = "123,000";
    }

    // Format discount percentage for Row 2
    if (ws1["B3"]) {
      ws1["B3"].z = "0%";
      ws1["B3"].w = "5%";
    }

    // Formula cell with cached value
    ws1["B4"] = { t: "n", f: "SUM(B2:B3)", v: 123000.05, w: "123,000.05" };

    // Formula cell with MISSING cached value (should trigger warning)
    ws1["C4"] = { t: "s", f: "CONCATENATE(A2, A3)" }; // no v/w

    XLSX.utils.book_append_sheet(wb, ws1, "Bảng Giá");

    // Sheet 2: empty header fallback
    const ws2Data = [
      ["", "", ""], // Empty first row -> should fallback to column letters
      ["Dữ liệu 1", "Dữ liệu 2", "Dữ liệu 3"],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    XLSX.utils.book_append_sheet(wb, ws2, "Báo Cáo Phụ");

    // Write to Excel buffer
    const excelBuf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const file = new File([new Uint8Array(excelBuf)], "mon_hoc.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await xlsxConverter.convert(file);

    expect(result.sourceFormat).toBe("xlsx");
    expect(result.fileName).toBe("mon_hoc.xlsx");

    // 1. Verify sheet order & headers
    expect(result.markdown).toContain("## Bảng Giá");
    expect(result.markdown).toContain("| Tên sản phẩm | Đơn giá | Ghi chú |");

    // 2. Verify formatted value currency and escaped vertical bar
    expect(result.markdown).toContain("| Sản phẩm A | 123,000 | Có hàng \\| Hỗ trợ vận chuyển |");

    // 3. Verify formatted value percent and escaped newline
    expect(result.markdown).toContain("| Sản phẩm B | 5% | Dòng 1<br>Dòng 2 |");

    // 4. Verify formula cached value
    expect(result.markdown).toContain("|  | 123000.05 |  |");

    // 5. Verify uncomputed formula warning
    expect(result.warnings.length).toBeGreaterThan(0);
    const hasFormulaWarning = result.warnings.some(
      (w) => w.code === "unsupported-element" && w.message.includes("C4")
    );
    expect(hasFormulaWarning).toBe(true);

    // 6. Verify fallback headers A, B, C for Sheet 2
    expect(result.markdown).toContain("## Báo Cáo Phụ");
    expect(result.markdown).toContain("| A | B | C |");
    expect(result.markdown).toContain("| Dữ liệu 1 | Dữ liệu 2 | Dữ liệu 3 |");
  });

  it("should handle empty or ranges without ref smoothly", async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet Rỗng");

    const excelBuf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const file = new File([new Uint8Array(excelBuf)], "empty.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await xlsxConverter.convert(file);
    expect(result.markdown).toContain("## Sheet Rỗng\n\n*Trang tính rỗng*");
  });
});
