import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import type { Heading as MdastHeading, PhrasingContent } from "mdast";
import { numberHeadings } from "@/modules/format/number-headings";
import { stripHeadingNumberPrefix } from "@/modules/format/strip-heading-number";

function getHeadingText(nodes: PhrasingContent[]): string {
  let text = "";
  for (const node of nodes) {
    if ("value" in node && typeof node.value === "string") {
      text += node.value;
    } else if ("children" in node && Array.isArray(node.children)) {
      text += getHeadingText(node.children as PhrasingContent[]);
    }
  }
  return text;
}

/**
 * Rule: duplicate-heading
 * Warns if heading text or generated anchor ID is duplicated across the document.
 */
export const duplicateHeadingRule: CheckRule = {
  id: "duplicate-heading",
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];
    const headings: { depth: number; text: string; sectionId: string; line?: number }[] = [];

    // 1. Gather all headings with position information
    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const walk = (node: unknown) => {
        if (!node) return;
        const n = node as { type: string; children?: unknown[]; depth?: number; position?: { start?: { line?: number } } };
        if (n.type === "heading") {
          const heading = n as unknown as MdastHeading;
          const rawText = getHeadingText(heading.children).trim();
          const text = stripHeadingNumberPrefix(rawText);
          headings.push({
            depth: heading.depth,
            text,
            sectionId,
            line: heading.position?.start?.line,
          });
        }
        if (n.children && Array.isArray(n.children)) {
          n.children.forEach(walk);
        }
      };
      walk(ast);
    }

    // 2. Compute anchor IDs
    const numbered = numberHeadings(headings, ctx.bundle.formatSettings);

    // 3. Count frequencies of IDs and heading text
    const idCounts = new Map<string, number>();
    const textCounts = new Map<string, number>();
    for (const h of numbered) {
      idCounts.set(h.id, (idCounts.get(h.id) || 0) + 1);
      const cleanText = h.text.trim().toLowerCase();
      textCounts.set(cleanText, (textCounts.get(cleanText) || 0) + 1);
    }

    // 4. Report issues
    for (let i = 0; i < numbered.length; i++) {
      const h = numbered[i];
      const orig = headings[i];
      const cleanText = h.text.trim().toLowerCase();
      const isIdDup = idCounts.get(h.id)! > 1;
      const isTextDup = textCounts.get(cleanText)! > 1;

      if (isIdDup || isTextDup) {
        issues.push({
          id: "duplicate-heading",
          severity: "warning",
          module: "check",
          message: isIdDup
            ? `Tiêu đề trùng lặp: "${h.text}" (sinh ra ID neo trùng lặp "${h.id}").`
            : `Tiêu đề có nội dung trùng lặp: "${h.text}".`,
          suggestion: "Đổi tên tiêu đề hoặc làm cho nó khác biệt hơn để tránh gây nhầm lẫn.",
          sectionId: orig.sectionId,
          line: orig.line,
        });
      }
    }

    return issues;
  },
};
