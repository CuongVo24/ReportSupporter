import type { CheckRule, CheckContext, ReportIssue } from "@/types";

const RULE_ID = "code-block-no-lang";
const SUGGESTION = "Thêm ngôn ngữ cho code block (vd ```ts) để highlight & export đúng.";

const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;

export const codeLanguageRule: CheckRule = {
  id: RULE_ID,
  severity: "warning",
  detect: ["text"],
  run(ctx: CheckContext): ReportIssue[] {
    const issues: ReportIssue[] = [];

    for (const section of ctx.bundle.project.sections) {
      const lines = section.markdown.split("\n");
      let openFence: string | null = null;

      lines.forEach((text, index) => {
        const match = FENCE.exec(text);
        if (!match) return;
        const marker = match[2];
        const info = match[3].trim();

        if (openFence) {
          // A fence line while open closes the block only if markers are compatible.
          if (marker[0] === openFence[0] && marker.length >= openFence.length) openFence = null;
          return;
        }

        openFence = marker;
        if (info.length === 0) {
          issues.push({
            id: RULE_ID,
            severity: "warning",
            module: "check",
            message: "Code block thiếu khai báo ngôn ngữ.",
            suggestion: SUGGESTION,
            sectionId: section.id,
            line: index + 1,
          });
        }
      });
    }
    return issues;
  },
};


