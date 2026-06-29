import type { ReportProjectBundle } from "@/types";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import { buildCaptionRegistry } from "@/modules/format";

export interface ExportIssue {
  severity: "error" | "warning";
  code: "IMG_NOT_EMBEDDED" | "HEADING_EMPTY" | "HEADING_LEVEL_JUMP" | "CAPTION_MISSING" | "MERMAID_INVALID";
  message: string;
  sectionId?: string;
}

function getFlatText(nodes: unknown[]): string {
  if (!nodes) return "";
  let text = "";
  for (const node of nodes) {
    if (node && typeof node === "object") {
      const n = node as Record<string, unknown>;
      if ("value" in n && typeof n.value === "string") {
        text += n.value;
      } else if ("children" in n && Array.isArray(n.children)) {
        text += getFlatText(n.children);
      }
    }
  }
  return text;
}

/**
 * Validates the project bundle before export.
 * Returns a list of issues categorized by severity (error blocks by default but bypassable, warning alerts).
 */
export function validateExport(bundle: ReportProjectBundle): { ok: boolean; issues: ExportIssue[] } {
  const issues: ExportIssue[] = [];
  const sections = bundle.project.sections;
  const assets = bundle.assets || [];

  const parsedSections = sections.map((sec) => {
    const ast = parseMarkdown(sec.markdown);
    return { sec, ast };
  });

  // 1. Validate Headings
  const allHeadings: { depth: number; text: string; sectionId: string }[] = [];
  for (const { sec, ast } of parsedSections) {
    const walk = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const n = node as Record<string, unknown>;
      if (n.type === "heading") {
        const depth = typeof n.depth === "number" ? n.depth : 0;
        const children = Array.isArray(n.children) ? n.children : [];
        allHeadings.push({
          depth,
          text: getFlatText(children).trim(),
          sectionId: sec.id,
        });
      }
      if (n.children && Array.isArray(n.children)) {
        n.children.forEach(walk);
      }
    };
    walk(ast);
  }

  // Heading Empty Check
  for (const h of allHeadings) {
    if (!h.text) {
      issues.push({
        severity: "warning",
        code: "HEADING_EMPTY",
        message: `Tiêu đề cấp ${h.depth} bị trống.`,
        sectionId: h.sectionId,
      });
    }
  }

  // Heading Level Jump Check
  let prevDepth = 0;
  for (const h of allHeadings) {
    const d = h.depth;

    if (prevDepth === 0) {
      if (d > 1) {
        issues.push({
          severity: "warning",
          code: "HEADING_LEVEL_JUMP",
          message: `Tài liệu bắt đầu bằng tiêu đề cấp ${d} (nhảy qua tiêu đề cấp 1).`,
          sectionId: h.sectionId,
        });
      }
    } else {
      if (d > prevDepth + 1) {
        issues.push({
          severity: "warning",
          code: "HEADING_LEVEL_JUMP",
          message: `Nhảy cấp tiêu đề từ cấp ${prevDepth} sang cấp ${d} (bỏ qua cấp ${prevDepth + 1}).`,
          sectionId: h.sectionId,
        });
      }
    }
    prevDepth = d;
  }

  // 2. Validate Images & Tables
  const registry = buildCaptionRegistry(
    parsedSections.map((p) => ({ id: p.sec.id, ast: p.ast })),
    bundle.formatSettings
  );

  for (const { sec, ast } of parsedSections) {
    const walk = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const n = node as Record<string, unknown>;

      if (n.type === "image") {
        const url = typeof n.url === "string" ? n.url : "";

        let isEmbeddable = false;
        if (url.startsWith("data:")) {
          isEmbeddable = true;
        } else {
          const match = url.match(/^(?:asset|image):([a-zA-Z0-9_-]+)/);
          if (match) {
            const assetId = match[1];
            const assetExists = assets.some((a) => a.id === assetId);
            if (assetExists) {
              isEmbeddable = true;
            }
          }
        }

        if (!isEmbeddable) {
          issues.push({
            severity: "error",
            code: "IMG_NOT_EMBEDDED",
            message: `Hình ảnh "${url}" chưa được nhúng. Ảnh này sẽ không hiển thị khi xuất PDF/Word.`,
            sectionId: sec.id,
          });
        }
      }

      if (n.type === "code" && n.lang === "mermaid") {
        const value = typeof n.value === "string" ? n.value.trim() : "";
        if (!value) {
          issues.push({
            severity: "warning",
            code: "MERMAID_INVALID",
            message: "Khối biểu đồ Mermaid trống.",
            sectionId: sec.id,
          });
        } else if (!/^(graph|flowchart|sequenceDiagram|gantt|classDiagram|stateDiagram|erDiagram|journey|pie|quadrantChart|c4Context)/i.test(value)) {
          issues.push({
            severity: "warning",
            code: "MERMAID_INVALID",
            message: "Biểu đồ Mermaid không bắt đầu bằng kiểu biểu đồ hợp lệ (vd: graph, flowchart).",
            sectionId: sec.id,
          });
        }
      }

      if (n.children && Array.isArray(n.children)) {
        n.children.forEach(walk);
      }
    };
    walk(ast);
  }

  // 3. Caption Missing Check from Registry
  for (const entry of registry) {
    if (!entry.text.trim()) {
      issues.push({
        severity: "warning",
        code: "CAPTION_MISSING",
        message: `Mục "${entry.label}" thiếu nội dung mô tả (chú thích).`,
        sectionId: entry.sectionId,
      });
    }
  }

  return {
    ok: !issues.some((i) => i.severity === "error"),
    issues,
  };
}
