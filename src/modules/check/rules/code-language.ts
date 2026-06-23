import type { CheckRule, CheckContext, ReportIssue } from "@/types";
import { findNodes } from "./utils";
import type { Code as MdastCode } from "mdast";

const RULE_ID = "code-block-no-lang";
const SUGGESTION = "Thêm ngôn ngữ cho code block (vd ```ts) để highlight & export đúng.";

export const codeLanguageRule: CheckRule = {
  id: RULE_ID,
  severity: "warning",
  detect: ["ast"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    for (const [sectionId, ast] of Object.entries(ctx.sectionAsts)) {
      const codeNodes = findNodes(ast, "code") as MdastCode[];

      for (const node of codeNodes) {
        if (!node.lang || node.lang.trim().length === 0) {
          issues.push({
            id: RULE_ID,
            severity: "warning",
            module: "check",
            message: "Code block thiếu khai báo ngôn ngữ.",
            suggestion: SUGGESTION,
            sectionId,
            line: node.position?.start.line,
          });
        }
      }
    }

    return issues;
  },
};



