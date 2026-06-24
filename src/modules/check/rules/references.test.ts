import { describe, it, expect } from "vitest";
import { referencesRule } from "./references";
import { parseMarkdown } from "@/lib/markdown-pipeline";
import type { CheckContext } from "@/types";

describe("References Section check rule", () => {
  const createMockContext = (markdown: string): CheckContext => {
    const ast = parseMarkdown(markdown);
    return {
      templateId: "software-project",
      bundle: {
        schemaVersion: 1,
        project: {
          id: "proj-1",
          title: "My Project",
          templateId: "software-project",
          metadata: {
            school: "BK",
            members: ["A"],
          },
          sections: [
            {
              id: "sec-1",
              order: 1,
              title: "Tài liệu tham khảo",
              markdown,
              status: "draft",
            },
          ],
          updatedAt: new Date().toISOString(),
        },
        assets: [],
        evidence: [],
        formatSettings: {
          presetId: "academic-default",
          includeToc: true,
          includeListOfFigures: false,
          includeListOfTables: false,
          captionNumbering: "continuous",
        },
      },
      sectionAsts: {
        "sec-1": ast,
      },
    };
  };

  it("should warn if the References section is empty", () => {
    const markdown = "## Tài liệu tham khảo";
    const ctx = createMockContext(markdown);
    const issues = referencesRule.run(ctx);

    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("references-format");
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].message).toContain("Tài liệu tham khảo trống");
  });

  it("should warn if reference entries are too short or incomplete", () => {
    const markdown = `
## References
- [1] Short
- [2] Nguyễn Văn A. Sách demo, 2026.
    `;
    const ctx = createMockContext(markdown);
    const issues = referencesRule.run(ctx);

    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("references-format");
    expect(issues[0].message).toContain("quá ngắn hoặc thiếu thông tin");
  });

  it("should warn if reference entries are out of numeric order", () => {
    const markdown = `
## Danh mục tài liệu tham khảo
- [1] Nguyễn Văn A. Sách A, 2026.
- [3] Trần Văn B. Sách B, 2026.
- [2] Lê Văn C. Sách C, 2026.
    `;
    const ctx = createMockContext(markdown);
    const issues = referencesRule.run(ctx);

    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("references-format");
    expect(issues[0].message).toContain("Thứ tự tài liệu tham khảo không đúng");
  });

  it("should not produce any issues for valid references", () => {
    const markdown = `
## Tài liệu tham khảo
1. Nguyễn Văn A. Sách A, 2026. NXB Trẻ.
2. Trần Văn B. Sách B, 2026. NXB Giáo Dục.
3. Lê Văn C. Sách C, 2026. NXB Khoa Học.
    `;
    const ctx = createMockContext(markdown);
    const issues = referencesRule.run(ctx);

    expect(issues).toHaveLength(0);
  });
});
