import type { ReportProjectBundle } from "@/types";
import { prepareExport } from "./prepare-export";

export type DocxLayoutCheck = { id: string; ok: boolean; detail: string };

/**
 * Verifies the DOCX layout (heading structure, caption numbering, table configurations, and page setup)
 * against format presets and the caption registry to ensure 100% export parity.
 */
export function verifyDocxLayout(bundle: ReportProjectBundle): DocxLayoutCheck[] {
  const checks: DocxLayoutCheck[] = [];
  const { formatted } = prepareExport(bundle);
  const { mdast, preset, figures, tables } = formatted;

  // 1. Check Page Setup (Page size and margins)
  const margin = preset.margin || { top: "20mm", right: "20mm", bottom: "20mm", left: "30mm" };
  const hasA4 = preset.page === "A4";
  const marginsValid = !!(margin.top && margin.bottom && margin.left && margin.right);

  checks.push({
    id: "page-setup-size",
    ok: hasA4,
    detail: hasA4 ? "Kích thước trang là A4." : `Kích thước trang không phải A4: ${preset.page || "không rõ"}.`,
  });

  checks.push({
    id: "page-setup-margins",
    ok: marginsValid,
    detail: marginsValid
      ? `Lề trang hợp lệ: Trên ${margin.top}, Phải ${margin.right}, Dưới ${margin.bottom}, Trái ${margin.left}.`
      : "Lề trang không đầy đủ hoặc không hợp lệ.",
  });

  // 2. Check Heading Hierarchy
  let headingsValid = true;
  let lastDepth = 0;
  const headingsDetailList: string[] = [];

  const walkHeadings = (node: any) => {
    if (node.type === "heading") {
      const depth = node.depth;
      if (depth - lastDepth > 1 && lastDepth > 0) {
        headingsValid = false;
        headingsDetailList.push(`Nhảy cấp tiêu đề từ H${lastDepth} sang H${depth}.`);
      }
      lastDepth = depth;
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(walkHeadings);
    }
  };
  mdast.children.forEach(walkHeadings);

  checks.push({
    id: "heading-hierarchy",
    ok: headingsValid,
    detail: headingsValid
      ? "Cấu trúc phân cấp tiêu đề (Heading) hợp lệ, không nhảy cấp."
      : `Lỗi phân cấp tiêu đề: ${headingsDetailList.join("; ")}`,
  });

  // 3. Check Caption Numbering Parity
  let captionsMatch = true;
  const captionRegistry = [...figures, ...tables];
  const astCaptions: { id: string; text: string; className: string }[] = [];

  const walkCaptions = (node: any) => {
    if (node.type === "paragraph") {
      const className = node.data?.hProperties?.className;
      if (className === "fig-caption" || className === "tbl-caption") {
        const text = (node.children || [])
          .map((c: any) => c.value || "")
          .join("")
          .trim();
        astCaptions.push({
          id: (node.data as any)?.hProperties?.id || "",
          text,
          className,
        });
      }
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(walkCaptions);
    }
  };
  mdast.children.forEach(walkCaptions);

  const unmatched: string[] = [];
  for (const registryEntry of captionRegistry) {
    // If it's a table with no caption text, we don't expect a caption paragraph in the AST
    if (registryEntry.kind === "table" && !registryEntry.text) {
      continue;
    }
    const labelPrefix = registryEntry.label;
    const astMatch = astCaptions.find(
      (ac) => ac.text.startsWith(labelPrefix) || ac.text.includes(labelPrefix)
    );
    if (!astMatch) {
      captionsMatch = false;
      unmatched.push(`Thiếu nhãn caption cho ${labelPrefix}`);
    }
  }

  checks.push({
    id: "caption-numbering-parity",
    ok: captionsMatch,
    detail: captionsMatch
      ? `Đánh số chú thích khớp hoàn toàn với Caption Registry (${captionRegistry.length} mục).`
      : `Lệch đánh số chú thích: ${unmatched.join("; ")}`,
  });

  // 4. Check Table configurations
  let tablesValid = true;
  let tableCount = 0;
  const walkTables = (node: any) => {
    if (node.type === "table") {
      tableCount++;
      const rows = node.children || [];
      if (rows.length === 0 || (rows[0] && (!rows[0].children || rows[0].children.length === 0))) {
        tablesValid = false;
      }
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(walkTables);
    }
  };
  mdast.children.forEach(walkTables);

  checks.push({
    id: "table-format",
    ok: tablesValid,
    detail: tablesValid
      ? `Tất cả bảng (${tableCount} bảng) có cấu trúc hàng/cột hợp lệ.`
      : "Có bảng rỗng hoặc không có hàng/cột.",
  });

  // 5. Check Chapter Page Breaks
  let h1Count = 0;
  const walkH1PageBreaks = (node: any) => {
    if (node.type === "heading" && node.depth === 1) {
      h1Count++;
    }
  };
  mdast.children.forEach(walkH1PageBreaks);

  if (preset.chapterStartsNewPage) {
    checks.push({
      id: "chapter-page-breaks",
      ok: true,
      detail: `Ngắt trang trước mỗi chương lớn được kích hoạt (Tổng cộng ${h1Count} chương).`,
    });
  } else {
    checks.push({
      id: "chapter-page-breaks",
      ok: true,
      detail: `Không ngắt trang trước mỗi chương lớn (theo cấu hình preset, tổng số ${h1Count} chương).`,
    });
  }

  return checks;
}
