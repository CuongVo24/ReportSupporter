import { describe, expect, it } from "vitest";
import { checkDraft } from "./check-draft";
import type { ImportDraft, ReportProjectBundle } from "@/types";

describe("checkDraft", () => {
  const currentBundle: ReportProjectBundle = {
    project: {
      id: "proj-1",
      title: "Báo cáo mẫu",
      templateId: "academic-report",
      metadata: {},
      sections: [],
      updatedAt: new Date().toISOString(),
    },
    assets: [],
    evidence: [],
    formatSettings: {
      presetId: "academic-default",
      includeToc: false,
      includeListOfFigures: false,
      includeListOfTables: false,
      captionNumbering: "continuous",
    },
    schemaVersion: 1,
  };

  it("should run checker rules on draft and map output issues to module 'import'", () => {
    const draft: ImportDraft = {
      result: {
        sourceFormat: "markdown",
        fileName: "test.md",
        markdown: "```\nconsole.log(123);\n```",
        assets: [],
        warnings: [],
        convertedAt: new Date().toISOString(),
      },
      sections: [
        {
          id: "import-sec-0",
          order: 0,
          title: "Code Section",
          markdown: "```\nconsole.log(123);\n```",
          status: "draft",
          revision: 0,
        },
      ],
      mode: "append",
    };

    const issues = checkDraft(draft, currentBundle);

    // Should find the code block no language issue
    const noLangIssue = issues.find((i) => i.id === "code-block-no-lang");
    expect(noLangIssue).toBeDefined();
    expect(noLangIssue?.module).toBe("import");
    expect(noLangIssue?.severity).toBe("warning");
    expect(noLangIssue?.sectionId).toBe("import-sec-0");
  });

  it("should return empty array if draft has no sections", () => {
    const draft: ImportDraft = {
      result: {
        sourceFormat: "markdown",
        fileName: "test.md",
        markdown: "",
        assets: [],
        warnings: [],
        convertedAt: new Date().toISOString(),
      },
      sections: [],
      mode: "append",
    };

    const issues = checkDraft(draft, currentBundle);
    expect(issues).toEqual([]);
  });
});
