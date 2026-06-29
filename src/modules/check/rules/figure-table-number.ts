import type { CheckRule, CheckContext, ReportIssue, CaptionEntry } from "@/types";
import { buildCaptionRegistry } from "@/modules/format/caption-registry";

/**
 * Rule: figure-table-number
 * Warns if figure or table numbers are out of sequence, or if manually-typed
 * numbers conflict with the system's generated numbering.
 */
export const figureTableNumberRule: CheckRule = {
  id: "figure-table-number",
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    // 1. Build the unified caption registry
    const sections = Object.entries(ctx.sectionAsts).map(([id, ast]) => ({
      id,
      ast,
    }));
    const captionRegistry = buildCaptionRegistry(sections, ctx.bundle.formatSettings);

    const figures = captionRegistry.filter((c) => c.kind === "figure");
    const tables = captionRegistry.filter((c) => c.kind === "table");

    const numberingType = ctx.bundle.formatSettings.captionNumbering || "per-chapter";

    // 2. Check sequential integrity
    checkSequence(figures, numberingType, issues);
    checkSequence(tables, numberingType, issues);

    // 3. Check author typed conflicts
    for (const entry of captionRegistry) {
      if (entry.authorNumber) {
        const systemNum = entry.label.replace(/^(?:hình|bảng|figure|table)\s*/i, "").trim();
        if (entry.authorNumber !== systemNum) {
          issues.push({
            id: "figure-table-number",
            severity: "warning",
            module: "check",
            message: `Số thứ tự tự gõ không khớp với số tự động tính toán (Nhập: "${entry.authorNumber}", Hệ thống: "${systemNum}").`,
            suggestion: `Sửa nhãn số hoặc bật thiết lập "Tôn trọng số tác giả" trong tùy chọn định dạng.`,
            sectionId: entry.sectionId,
          });
        }
      }
    }

    return issues;
  },
};

function checkSequence(
  entries: CaptionEntry[],
  numberingType: "continuous" | "per-chapter",
  issues: ReportIssue[]
) {
  if (entries.length === 0) return;

  if (numberingType === "continuous") {
    let expected = 1;
    for (const entry of entries) {
      const numStr = entry.authorNumber || entry.label.replace(/^(?:hình|bảng|figure|table)\s*/i, "").trim();
      const current = parseInt(numStr, 10);
      if (isNaN(current)) continue;

      if (current !== expected) {
        issues.push({
          id: "figure-table-number",
          severity: "warning",
          module: "check",
          message: `Số thứ tự ${entry.kind === "figure" ? "hình" : "bảng"} không liên tục: Phát hiện "${entry.label}" nhưng kỳ vọng số tiếp theo là "${expected}".`,
          suggestion: "Đánh lại số thứ tự hình/bảng hoặc sử dụng tính năng đánh số tự động.",
          sectionId: entry.sectionId,
        });
        expected = current;
      }
      expected++;
    }
  } else {
    // per-chapter
    const chapterCounters = new Map<string, number>();
    for (const entry of entries) {
      const numStr = entry.authorNumber || entry.label.replace(/^(?:hình|bảng|figure|table)\s*/i, "").trim();
      const parts = numStr.split(".");
      if (parts.length < 2) continue;
      const chapter = parts[0];
      const seq = parseInt(parts[1], 10);
      if (isNaN(seq)) continue;

      const expected = (chapterCounters.get(chapter) || 0) + 1;
      if (seq !== expected) {
        issues.push({
          id: "figure-table-number",
          severity: "warning",
          module: "check",
          message: `Số thứ tự ${entry.kind === "figure" ? "hình" : "bảng"} không liên tục trong chương: Phát hiện "${entry.label}" nhưng kỳ vọng số tiếp theo là "${chapter}.${expected}".`,
          suggestion: "Đánh lại số thứ tự hình/bảng hoặc sử dụng tính năng đánh số tự động.",
          sectionId: entry.sectionId,
        });
        chapterCounters.set(chapter, seq);
      } else {
        chapterCounters.set(chapter, expected);
      }
    }
  }
}
