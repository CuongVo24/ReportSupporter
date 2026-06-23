import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { getTemplateSchema, findNodes } from "./utils";
import type { Link as MdastLink } from "mdast";

/**
 * Checks if a string looks like a valid URL (has protocol and host).
 */
function isValidUrl(urlStr: string): boolean {
  try {
    new URL(urlStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rule: missing-project-links
 * Triggers for software templates if no GitHub, demo, or deploy links are found in project metadata or AST link nodes.
 */
export const missingProjectLinksRule: CheckRule = {
  id: "missing-project-links",
  severity: "error",
  detect: ["ast", "meta"],
  run(ctx: CheckContext): ReportIssue[] {
    // Only apply to software projects
    if (ctx.templateId !== "software-project") {
      return [];
    }

    const keywords = ["github", "demo", "deploy", "source"];
    let hasLink = false;

    // 1. Check project metadata values for matches
    const metadata = ctx.bundle.project.metadata;
    for (const key in metadata) {
      const val = metadata[key];
      const items = Array.isArray(val) ? val : [val];
      for (const item of items) {
        if (typeof item === "string" && isValidUrl(item)) {
          const lowerItem = item.toLowerCase();
          if (keywords.some((kw) => lowerItem.includes(kw))) {
            hasLink = true;
            break;
          }
        }
      }
      if (hasLink) {
        break;
      }
    }

    // 2. Check AST link nodes if metadata check didn't find any links
    if (!hasLink) {
      for (const ast of Object.values(ctx.sectionAsts)) {
        const links = findNodes(ast, "link") as MdastLink[];
        for (const link of links) {
          if (link.url && isValidUrl(link.url)) {
            const lowerUrl = link.url.toLowerCase();
            if (keywords.some((kw) => lowerUrl.includes(kw))) {
              hasLink = true;
              break;
            }
          }
        }
        if (hasLink) {
          break;
        }
      }
    }

    if (!hasLink) {
      return [
        {
          id: "missing-project-links",
          severity: "error",
          module: "check",
          message: "Thêm link source (GitHub), demo, và deploy cho báo cáo phần mềm.",
          suggestion: "Cung cấp link dự án trong phần thiết lập thông tin báo cáo hoặc thêm liên kết trực tiếp trong nội dung Markdown.",
        },
      ];
    }
    return [];
  },
};

/**
 * Rule: missing-required-evidence
 * Triggers if any mandatory evidence kinds declared by the template are missing from the bundle.
 */
export const missingRequiredEvidenceRule: CheckRule = {
  id: "missing-required-evidence",
  severity: "error",
  detect: ["meta"],
  run(ctx: CheckContext): ReportIssue[] {
    const template = getTemplateSchema(ctx.templateId);
    if (!template) {
      return [];
    }

    const requiredKinds = template.requiredEvidenceKinds || [];
    const providedKinds = new Set(ctx.bundle.evidence.map((e) => e.kind));
    const issues: ReportIssue[] = [];

    for (const kind of requiredKinds) {
      if (!providedKinds.has(kind)) {
        issues.push({
          id: "missing-required-evidence",
          severity: "error",
          module: "check",
          message: `Thêm minh chứng bắt buộc trong Evidence Kit (GitHub/demo/deploy/video). Missing kind: ${kind}.`,
          suggestion: `Vui lòng thêm một minh chứng loại "${kind}" trong danh sách Evidence Kit.`,
        });
      }
    }

    return issues;
  },
};

/**
 * Rule: broken-evidence-url-shape
 * Triggers if any evidence item contains a malformed URL. Performs no network requests.
 */
export const brokenEvidenceUrlShapeRule: CheckRule = {
  id: "broken-evidence-url-shape",
  severity: "warning",
  detect: ["meta"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];
    const evidenceList = ctx.bundle.evidence || [];

    for (const item of evidenceList) {
      if (item.url && !isValidUrl(item.url)) {
        issues.push({
          id: "broken-evidence-url-shape",
          severity: "warning",
          module: "check",
          message: "Kiểm tra lại định dạng URL minh chứng; Checker không gọi mạng để test link sống.",
          suggestion: `Sửa lại URL không hợp lệ "${item.url}" của minh chứng "${item.title}". URL phải có định dạng đầy đủ (vd: https://...).`,
        });
      }
    }

    return issues;
  },
};
