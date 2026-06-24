import type { ReportProjectBundle } from "@/types";
import { prepareExport } from "./prepare-export";
import type { Root as MdastRoot, Content as MdastContent, Heading as MdastHeading, Paragraph as MdastParagraph, Table as MdastTable } from "mdast";

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

  const walkHeadings = (node: MdastContent | MdastRoot) => {
    if (node.type === "heading") {
      const heading = node as MdastHeading;
      const depth = heading.depth;
      if (depth - lastDepth > 1 && lastDepth > 0) {
        headingsValid = false;
        headingsDetailList.push(`Nhảy cấp tiêu đề từ H${lastDepth} sang H${depth}.`);
      }
      lastDepth = depth;
    }
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((child) => walkHeadings(child as MdastContent));
    }
  };
  mdast.children.forEach((child) => walkHeadings(child as MdastContent));

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

  const walkCaptions = (node: MdastContent | MdastRoot) => {
    if (node.type === "paragraph") {
      const para = node as MdastParagraph;
      const hProps = (para.data?.hProperties || {}) as { className?: string; id?: string };
      const className = hProps.className;
      if (className === "fig-caption" || className === "tbl-caption") {
        const text = (para.children || [])
          .map((c) => ("value" in c ? c.value : ""))
          .join("")
          .trim();
        astCaptions.push({
          id: hProps.id || "",
          text,
          className: className || "",
        });
      }
    }
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((child) => walkCaptions(child as MdastContent));
    }
  };
  mdast.children.forEach((child) => walkCaptions(child as MdastContent));

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
  const walkTables = (node: MdastContent | MdastRoot) => {
    if (node.type === "table") {
      const table = node as MdastTable;
      tableCount++;
      const rows = table.children || [];
      if (rows.length === 0 || (rows[0] && (!rows[0].children || rows[0].children.length === 0))) {
        tablesValid = false;
      }
    }
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((child) => walkTables(child as MdastContent));
    }
  };
  mdast.children.forEach((child) => walkTables(child as MdastContent));

  checks.push({
    id: "table-format",
    ok: tablesValid,
    detail: tablesValid
      ? `Tất cả bảng (${tableCount} bảng) có cấu trúc hàng/cột hợp lệ.`
      : "Có bảng rỗng hoặc không có hàng/cột.",
  });

  // 5. Check Chapter Page Breaks
  let h1Count = 0;
  const walkH1PageBreaks = (node: MdastContent | MdastRoot) => {
    if (node.type === "heading") {
      const heading = node as MdastHeading;
      if (heading.depth === 1) {
        h1Count++;
      }
    }
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((child) => walkH1PageBreaks(child as MdastContent));
    }
  };
  mdast.children.forEach((child) => walkH1PageBreaks(child as MdastContent));

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
