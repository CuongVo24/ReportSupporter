import type { ImportConverter, ImportResult, ImportWarning } from "@/types";

function escapeCell(val: string): string {
  if (val.trim().length === 0) {
    return "";
  }
  let text = val.trim();
  // Escape GFM table column separator
  text = text.replace(/\|/g, "\\|");
  // Escape newlines inside cell
  text = text.replace(/\r?\n/g, "<br>");
  return text;
}

/**
 * Converter for XLSX and XLS spreadsheets using SheetJS.
 * Dynamic imports 'xlsx' for bundle optimization and parses sheets into GFM tables.
 * Implements capping, hidden sheets skipping, workbook empty checks, and merged cells flattening.
 */
export const xlsxConverter: ImportConverter = {
  format: "xlsx",
  extensions: [".xlsx", ".xls"],
  mimeTypes: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  maxBytes: 50 * 1024 * 1024, // 50MB
  convert: async (file: File, onProgress?: (progress: number) => void): Promise<ImportResult> => {
    const name = file.name.trim().toLowerCase();

    // 1. Reject old Excel format (.xls)
    if (name.endsWith(".xls")) {
      throw new Error(
        "Định dạng Excel cũ (.xls) không được hỗ trợ. Vui lòng lưu lại thành định dạng .xlsx mới hơn."
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    // Dynamic import of SheetJS for bundle optimization
    const XLSX = await import("xlsx");

    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
      cellDates: true,
      cellNF: true,
      cellText: true,
    });

    const warnings: ImportWarning[] = [];
    const mdBlocks: string[] = [];

    const totalSheets = workbook.SheetNames.length;

    // 2. Count visible sheets and fail if there are none
    let visibleSheetsCount = 0;
    for (let sIdx = 0; sIdx < totalSheets; sIdx++) {
      const sheetMeta = workbook.Workbook?.Sheets?.[sIdx];
      const isHidden = sheetMeta && (sheetMeta.Hidden === 1 || sheetMeta.Hidden === 2);
      if (!isHidden) {
        visibleSheetsCount++;
      }
    }

    if (visibleSheetsCount === 0) {
      throw new Error("Tệp Excel không chứa trang tính hiển thị nào.");
    }

    for (let sIdx = 0; sIdx < totalSheets; sIdx++) {
      const sheetName = workbook.SheetNames[sIdx];
      const sheet = workbook.Sheets[sheetName];

      // 3. Skip hidden sheets
      const sheetMeta = workbook.Workbook?.Sheets?.[sIdx];
      const isHidden = sheetMeta && (sheetMeta.Hidden === 1 || sheetMeta.Hidden === 2);
      if (isHidden) {
        warnings.push({
          code: "unsupported-element",
          message: `Trang tính bị ẩn: ${sheetName}`,
          location: `sheet "${sheetName}"`,
        });
        if (onProgress) {
          onProgress(Math.round(((sIdx + 1) / totalSheets) * 100));
        }
        continue;
      }

      const rangeRef = sheet["!ref"];
      if (!rangeRef) {
        // Empty sheet
        mdBlocks.push(`## ${sheetName}\n\n*Trang tính rỗng*`);
        if (onProgress) {
          onProgress(Math.round(((sIdx + 1) / totalSheets) * 100));
        }
        continue;
      }

      const range = XLSX.utils.decode_range(rangeRef);
      const totalRows = range.e.r - range.s.r + 1;
      const totalCols = range.e.c - range.s.c + 1;

      // 4. Row and Column limits
      const maxRows = 500;
      const maxCols = 30;

      const endRow = Math.min(range.e.r, range.s.r + maxRows - 1);
      const endCol = Math.min(range.e.c, range.s.c + maxCols - 1);

      const truncatedRowsCount = Math.max(0, totalRows - maxRows);
      const truncatedColsCount = Math.max(0, totalCols - maxCols);

      if (truncatedRowsCount > 0 || truncatedColsCount > 0) {
        let msg = "";
        if (truncatedRowsCount > 0 && truncatedColsCount > 0) {
          msg = `Đã cắt ${truncatedColsCount} cột và ${truncatedRowsCount} hàng vượt quá giới hạn (tối đa 30 cột và 500 hàng) trên trang tính ${sheetName}`;
        } else if (truncatedRowsCount > 0) {
          msg = `Đã cắt ${truncatedRowsCount} hàng vượt quá giới hạn 500 hàng trên trang tính ${sheetName}`;
        } else {
          msg = `Đã cắt ${truncatedColsCount} cột vượt quá giới hạn 30 cột trên trang tính ${sheetName}`;
        }

        warnings.push({
          code: "sheet-truncated",
          message: msg,
          location: `sheet "${sheetName}"`,
        });
      }

      // 5. Merge ranges configuration
      const merges = sheet["!merges"] || [];
      if (merges.length > 0) {
        warnings.push({
          code: "unsupported-element",
          message: "Trang tính chứa các ô hợp nhất (merged cells), bảng hiển thị có thể bị lệch",
          location: `sheet "${sheetName}"`,
        });
      }

      const isMergedNonTopLeft = (r: number, c: number): boolean => {
        for (const m of merges) {
          if (r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c) {
            if (r !== m.s.r || c !== m.s.c) {
              return true;
            }
          }
        }
        return false;
      };

      const rows: string[][] = [];

      for (let r = range.s.r; r <= endRow; r++) {
        const row: string[] = [];
        for (let c = range.s.c; c <= endCol; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          const cell = sheet[cellRef];
          let val = "";

          // Flatten merges: only top-left cell gets value
          if (cell && !isMergedNonTopLeft(r, c)) {
            // Warn if formula cell lacks a cached computed value
            if (cell.f && cell.v === undefined) {
              warnings.push({
                code: "unsupported-element",
                message: `Ô công thức chưa được tính toán: ${cellRef}`,
                location: `sheet "${sheetName}", ô ${cellRef}`,
              });
            }

            // Prefer formatted text 'w', fallback to raw value 'v'
            const rawVal = cell.w !== undefined ? cell.w : (cell.v !== undefined ? String(cell.v) : "");
            val = rawVal;
          }
          row.push(val);
        }
        rows.push(row);
      }

      let headers: string[] = [];
      let dataRows: string[][] = [];

      const colCount = endCol - range.s.c + 1;

      if (rows.length > 0) {
        const firstRow = rows[0];
        const hasHeader = firstRow.some((cell) => cell.trim().length > 0);

        if (hasHeader) {
          headers = firstRow.map((cell) => escapeCell(cell));
          dataRows = rows.slice(1);
        } else {
          // Fallback to Excel column letters A, B, C...
          headers = Array.from({ length: colCount }, (_, i) =>
            XLSX.utils.encode_col(range.s.c + i)
          );
          dataRows = rows;
        }
      }

      // Strip trailing empty rows
      while (dataRows.length > 0) {
        const lastRow = dataRows[dataRows.length - 1];
        const isEmpty = lastRow.every((cell) => cell.trim().length === 0);
        if (isEmpty) {
          dataRows.pop();
        } else {
          break;
        }
      }

      let sheetMd = `## ${sheetName}\n\n`;
      if (headers.length > 0) {
        sheetMd += `| ${headers.join(" | ")} |\n`;
        sheetMd += `| ${headers.map(() => "---").join(" | ")} |\n`;
        for (const row of dataRows) {
          const escapedRow = row.map((cell) => escapeCell(cell));
          sheetMd += `| ${escapedRow.join(" | ")} |\n`;
        }
      } else {
        sheetMd += "*Trang tính rỗng*";
      }

      mdBlocks.push(sheetMd.trim());

      if (onProgress) {
        onProgress(Math.round(((sIdx + 1) / totalSheets) * 100));
      }
    }

    return {
      sourceFormat: "xlsx",
      fileName: file.name,
      markdown: mdBlocks.join("\n\n"),
      assets: [],
      warnings,
      convertedAt: new Date().toISOString(),
    };
  },
};
