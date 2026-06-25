import { describe, it, expect } from "vitest";
import { generateReadme } from "./generate-readme";
import type { ReportProjectBundle } from "@/types";

describe("generateReadme", () => {
  const baseBundle: ReportProjectBundle = {
    project: {
      id: "proj-1",
      title: "Hệ thống Quản lý Báo cáo",
      templateId: "software",
      metadata: {},
      sections: [],
      updatedAt: "2026-06-24T12:00:00Z",
    },
    assets: [],
    evidence: [],
    formatSettings: {
      presetId: "academic-default",
      includeToc: true,
      includeListOfFigures: true,
      includeListOfTables: true,
      captionNumbering: "continuous",
    },
    schemaVersion: 1,
  };

  it("should generate a simple title-only README if no metadata or evidence is provided", () => {
    const readme = generateReadme(baseBundle);
    expect(readme).toBe("# Hệ thống Quản lý Báo cáo\n");
  });

  it("should format all metadata fields and members list correctly", () => {
    const bundle: ReportProjectBundle = {
      ...baseBundle,
      project: {
        ...baseBundle.project,
        metadata: {
          school: "Đại học Bách Khoa",
          course: "Công nghệ phần mềm",
          lecturer: "TS. Nguyễn Văn A",
          date: "Tháng 6, 2026",
          members: ["Trần Văn B", "Lê Thị C"],
        },
      },
    };

    const readme = generateReadme(bundle);
    expect(readme).toContain("# Hệ thống Quản lý Báo cáo");
    expect(readme).toContain("## Thông tin dự án");
    expect(readme).toContain("- **Trường:** Đại học Bách Khoa");
    expect(readme).toContain("- **Học phần:** Công nghệ phần mềm");
    expect(readme).toContain("- **Giảng viên hướng dẫn:** TS. Nguyễn Văn A");
    expect(readme).toContain("- **Ngày thực hiện:** Tháng 6, 2026");
    expect(readme).toContain("### Thành viên thực hiện");
    expect(readme).toContain("- Trần Văn B");
    expect(readme).toContain("- Lê Thị C");
  });

  it("should handle single member string and omit missing fields", () => {
    const bundle: ReportProjectBundle = {
      ...baseBundle,
      project: {
        ...baseBundle.project,
        metadata: {
          school: "Trường Đại học KHTN",
          members: "Trần Văn B",
        },
      },
    };

    const readme = generateReadme(bundle);
    expect(readme).toContain("- **Trường:** Trường Đại học KHTN");
    expect(readme).not.toContain("Học phần");
    expect(readme).not.toContain("Giảng viên hướng dẫn");
    expect(readme).not.toContain("Ngày thực hiện");
    expect(readme).toContain("### Thành viên thực hiện");
    expect(readme).toContain("- Trần Văn B");
    expect(readme).not.toContain("undefined");
  });

  it("should format evidence items correctly", () => {
    const bundle: ReportProjectBundle = {
      ...baseBundle,
      evidence: [
        {
          id: "ev-1",
          kind: "github",
          title: "Repository chính",
          url: "https://github.com/user/repo",
          note: "Chứa mã nguồn Frontend và Backend",
          qrEnabled: true,
          createdAt: "2026-06-24T12:00:00Z",
        },
        {
          id: "ev-2",
          kind: "video",
          title: "Video giới thiệu sản phẩm",
          url: "https://youtube.com/watch?v=123",
          qrEnabled: false,
          createdAt: "2026-06-24T12:00:00Z",
        },
      ],
    };

    const readme = generateReadme(bundle);
    expect(readme).toContain("## Danh sách minh chứng");
    expect(readme).toContain("- **Mã nguồn (GitHub):** [Repository chính](https://github.com/user/repo) - Chứa mã nguồn Frontend và Backend");
    expect(readme).toContain("- **Video demo:** [Video giới thiệu sản phẩm](https://youtube.com/watch?v=123)");
  });

  it("should produce the exact same output for the same input (deterministic)", () => {
    const bundle: ReportProjectBundle = {
      ...baseBundle,
      project: {
        ...baseBundle.project,
        metadata: {
          school: "Trường X",
          course: "Môn Y",
          members: ["Sinh viên A"],
        },
      },
      evidence: [
        {
          id: "ev-1",
          kind: "deploy",
          title: "Link deploy",
          url: "https://deploy.app",
          qrEnabled: true,
          createdAt: "2026-06-24T12:00:00Z",
        },
      ],
    };

    const readme1 = generateReadme(bundle);
    const readme2 = generateReadme(bundle);
    expect(readme1).toBe(readme2);
  });
});
