import { describe, it, expect } from "vitest";
import { buildInitialSections } from "./buildInitialSections";
import { getTemplate } from "./templates";
import { runChecker } from "@/modules/check";
import type { ReportProjectBundle } from "@/types";

describe("buildInitialSections helper", () => {
  it("should generate standard skeleton for non-README templates", () => {
    const template = getTemplate("software-project")!;
    const metadata = {
      school: "Đại học",
      course: "Môn học",
      lecturer: "Giảng viên",
      members: ["Thành viên A"],
    };

    const sections = buildInitialSections(template, metadata);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].title).toBe("Mở đầu");
  });

  it("should parse README and prepend Member table section with order 0 for readme-report template", () => {
    const template = getTemplate("readme-report")!;
    const metadata = {
      school: "Đại học Bách Khoa",
      members: ["Nguyễn Văn A - 123456", "Trần Thị B - 654321"],
      readmeContent: "# Project Title\n\nProject description\n\n## Usage\n\nRun npm start.\n",
    };

    const sections = buildInitialSections(template, metadata);
    
    // We expect: 1 member section + 2 imported sections (Title, Usage) = 3 sections
    expect(sections).toHaveLength(3);

    // 1. Member section at order 0
    expect(sections[0].title).toBe("Thành viên & Phân công");
    expect(sections[0].order).toBe(0);
    expect(sections[0].markdown).toContain("Nguyễn Văn A - 123456");
    expect(sections[0].markdown).toContain("| Thành viên | Vai trò | Nhiệm vụ |");

    // 2. First README section shifted to order 1
    expect(sections[1].title).toBe("Project Title");
    expect(sections[1].order).toBe(1);
    expect(sections[1].markdown).toContain("# Project Title\n\nProject description");

    // 3. Second README section shifted to order 2
    expect(sections[2].title).toBe("Usage");
    expect(sections[2].order).toBe(2);
    expect(sections[2].markdown).toContain("## Usage\n\nRun npm start.");
  });

  it("should satisfy missing-member-table rule for readme-report", () => {
    const template = getTemplate("readme-report")!;
    const metadata = {
      school: "Đại học Bách Khoa",
      members: ["Nguyễn Văn A"],
      readmeContent: "# Project\nDescription",
    };

    const sections = buildInitialSections(template, metadata);

    const bundle: ReportProjectBundle = {
      project: {
        id: "proj-1",
        title: "Báo cáo từ README",
        templateId: template.id,
        metadata: {
          school: "Đại học Bách Khoa",
          members: ["Nguyễn Văn A"],
        },
        sections,
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
      schemaVersion: 1,
    };

    const checkResult = runChecker(bundle);
    const hasMemberTableWarning = checkResult.issues.some(issue => issue.id === "missing-member-table");
    expect(hasMemberTableWarning).toBe(false);
  });

  it("should NOT prepend Member table section if the metadata contains 1 member or fewer (individual report)", () => {
    const template = getTemplate("readme-report")!;
    const metadata = {
      school: "Đại học Bách Khoa",
      members: ["Nguyễn Văn A - 123456"],
      readmeContent: "# Project Title\n\nProject description\n",
    };

    const sections = buildInitialSections(template, metadata);
    // Since it's an individual report, no member table should be prepended.
    // Length should be 1 (just the imported section), and its order should be 0.
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Project Title");
    expect(sections[0].order).toBe(0);
  });

  it("should NOT prepend Member table section if README content is empty", () => {
    const template = getTemplate("readme-report")!;
    const metadata = {
      school: "Đại học Bách Khoa",
      members: ["Nguyễn Văn A - 123456", "Trần Thị B - 654321"],
      readmeContent: "",
    };

    const sections = buildInitialSections(template, metadata);
    // Empty README content means 0 imported sections. Prepend should be skipped.
    expect(sections).toHaveLength(0);
  });
});
