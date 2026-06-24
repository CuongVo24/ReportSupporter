import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { getTemplateSchema, findNodes, getFlatText } from "./utils";
import type { Heading as MdastHeading } from "mdast";

/**
 * Helper to check if any heading text matches the target section title or fallback keywords.
 */
function hasSectionHeading(headingTexts: string[], targetName: string, fallbackKeywords: string[]): boolean {
  const targetLower = targetName.toLowerCase();
  // Check primary match (case-insensitive or partial match)
  if (headingTexts.some((h) => h.toLowerCase().includes(targetLower))) {
    return true;
  }
  // Check fallback keywords
  return headingTexts.some((h) =>
    fallbackKeywords.some((keyword) => h.toLowerCase().includes(keyword.toLowerCase()))
  );
}

/**
 * Rule: toc-disabled
 * Triggers if the template requires a Table of Contents but includeToc is disabled in settings.
 */
export const tocDisabledRule: CheckRule = {
  id: "toc-disabled",
  severity: "warning",
  detect: ["meta"],
  run(ctx: CheckContext): ReportIssue[] {
    const template = getTemplateSchema(ctx.templateId);
    const requiresToc = template?.requiresToc ?? false;
    const includeToc = ctx.bundle.formatSettings.includeToc;

    if (requiresToc && !includeToc) {
      return [
        {
          id: "toc-disabled",
          severity: "warning",
          module: "check",
          message: "Template báo cáo này nên có mục lục — bật Table of Contents trong Format.",
          suggestion: "Bật Table of Contents trong thiết lập định dạng.",
        },
      ];
    }
    return [];
  },
};

/**
 * Rule: missing-conclusion
 * Triggers if the Conclusion section heading is missing from the document.
 */
export const missingConclusionRule: CheckRule = {
  id: "missing-conclusion",
  severity: "error",
  detect: ["ast", "meta"],
  run(ctx: CheckContext): ReportIssue[] {
    const template = getTemplateSchema(ctx.templateId);
    
    // Determine if "Kết luận" is a required section
    const requiredSections = template?.requiredSections || [];
    const hasRequiredConclusion = requiredSections.some(
      (s) => s.toLowerCase().includes("kết luận") || s.toLowerCase().includes("conclusion")
    );

    // If template declares required sections and conclusion isn't one of them, skip the rule
    if (template && requiredSections.length > 0 && !hasRequiredConclusion) {
      return [];
    }

    // Collect all headings from all section ASTs
    const headingTexts: string[] = [];
    for (const ast of Object.values(ctx.sectionAsts)) {
      const headings = findNodes(ast, "heading") as MdastHeading[];
      for (const h of headings) {
        headingTexts.push(getFlatText(h.children).trim());
      }
    }

    const targetName = requiredSections.find(
      (s) => s.toLowerCase().includes("kết luận") || s.toLowerCase().includes("conclusion")
    ) || "Kết luận";

    if (!hasSectionHeading(headingTexts, targetName, ["kết luận", "conclusion"])) {
      return [
        {
          id: "missing-conclusion",
          severity: "error",
          module: "check",
          message: "Thêm phần Kết luận để tổng kết kết quả & hướng phát triển.",
          suggestion: "Tạo một heading Kết luận (hoặc Conclusion).",
        },
      ];
    }
    return [];
  },
};

/**
 * Rule: missing-references
 * Triggers if the References section heading is missing from the document.
 */
export const missingReferencesRule: CheckRule = {
  id: "missing-references",
  severity: "error",
  detect: ["ast", "meta"],
  run(ctx: CheckContext): ReportIssue[] {
    const template = getTemplateSchema(ctx.templateId);
    
    // Determine if "Tài liệu tham khảo" is a required section
    const requiredSections = template?.requiredSections || [];
    const hasRequiredReferences = requiredSections.some(
      (s) => s.toLowerCase().includes("tài liệu tham khảo") || s.toLowerCase().includes("reference")
    );

    // If template declares required sections and references isn't one of them, skip the rule
    if (template && requiredSections.length > 0 && !hasRequiredReferences) {
      return [];
    }

    // Collect all headings
    const headingTexts: string[] = [];
    for (const ast of Object.values(ctx.sectionAsts)) {
      const headings = findNodes(ast, "heading") as MdastHeading[];
      for (const h of headings) {
        headingTexts.push(getFlatText(h.children).trim());
      }
    }

    const targetName = requiredSections.find(
      (s) => s.toLowerCase().includes("tài liệu tham khảo") || s.toLowerCase().includes("reference")
    ) || "Tài liệu tham khảo";

    if (!hasSectionHeading(headingTexts, targetName, ["tài liệu tham khảo", "references"])) {
      return [
        {
          id: "missing-references",
          severity: "error",
          module: "check",
          message: "Thêm mục Tài liệu tham khảo (References).",
          suggestion: "Tạo một heading Tài liệu tham khảo (hoặc References).",
        },
      ];
    }
    return [];
  },
};

/**
 * Rule: missing-member-table
 * Triggers for group/software templates if no table is found in any section to detail member roles/tasks.
 */
export const missingMemberTableRule: CheckRule = {
  id: "missing-member-table",
  severity: "warning",
  detect: ["ast", "meta"],
  run(ctx: CheckContext): ReportIssue[] {
    const template = getTemplateSchema(ctx.templateId);
    
    const members = ctx.bundle.project.metadata.members;
    const isMultipleMembers = Array.isArray(members) && members.length > 1;

    // Check if it is a group/software template and has multiple members
    const isGroupTemplate = (template?.id === "software-project" || 
      template?.metadataFields.some((f) => f.key === "members" && f.type === "textList")) &&
      isMultipleMembers;

    if (!isGroupTemplate) {
      return [];
    }

    // Count tables in all sections
    let tableCount = 0;
    for (const ast of Object.values(ctx.sectionAsts)) {
      const tables = findNodes(ast, "table");
      tableCount += tables.length;
    }

    if (tableCount === 0) {
      return [
        {
          id: "missing-member-table",
          severity: "warning",
          module: "check",
          message: "Thêm bảng phân công nhiệm vụ thành viên.",
          suggestion: "Tạo một bảng GFM phân công vai trò và công việc của các thành viên trong nhóm.",
        },
      ];
    }
    return [];
  },
};
