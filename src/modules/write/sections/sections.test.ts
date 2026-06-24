import { describe, it, expect } from "vitest";
import { buildMemberResponsibility } from "./member-responsibility";
import { buildProjectTimeline } from "./project-timeline";
import { softwareProjectTemplate } from "../templates/software-project";
import { internshipReportTemplate } from "../templates/internship-report";
import { createProjectFromTemplate } from "../create-project";
import { runChecker } from "@/modules/check";

describe("Reusable Section Builders", () => {
  describe("buildMemberResponsibility", () => {
    it("should return GFM table with default row when no members are passed", () => {
      const result = buildMemberResponsibility();
      expect(result).toContain("# Thành viên & Phân công");
      expect(result).toContain("| Thành viên | Vai trò | Nhiệm vụ |");
      expect(result).toContain("| --- | --- | --- |");
      expect(result).toContain("| ... | ... | ... |");
    });

    it("should return GFM table populating passed members list", () => {
      const members = ["Nguyễn Văn A - 123456", "Trần Thị B - 654321"];
      const result = buildMemberResponsibility(members);
      expect(result).toContain("Nguyễn Văn A - 123456");
      expect(result).toContain("Trần Thị B - 654321");
      expect(result.split("\n").filter(line => line.includes("|")).length).toBe(4); // 1 header + 1 separator + 2 data rows
    });
  });

  describe("buildProjectTimeline", () => {
    it("should return GFM table with stages, milestones and description", () => {
      const result = buildProjectTimeline();
      expect(result).toContain("# Nội dung Công việc");
      expect(result).toContain("Mô tả chi tiết các công việc, dự án được giao thực hiện tại doanh nghiệp.");
      expect(result).toContain("| Giai đoạn | Mốc | Mô tả |");
      expect(result).toContain("| --- | --- | --- |");
    });
  });

  describe("Template Integration", () => {
    it("should embed member responsibility builder into software-project template starter markdown", () => {
      const bundle = createProjectFromTemplate(softwareProjectTemplate);
      const section = bundle.project.sections.find(s => s.title === "Thành viên & Phân công");
      expect(section).toBeDefined();
      expect(section!.markdown).toContain("# Thành viên & Phân công");
      expect(section!.markdown).toContain("| Thành viên | Vai trò | Nhiệm vụ |");
    });

    it("should embed project timeline builder into internship-report template starter markdown", () => {
      const bundle = createProjectFromTemplate(internshipReportTemplate);
      const section = bundle.project.sections.find(s => s.title === "Nội dung Công việc");
      expect(section).toBeDefined();
      expect(section!.markdown).toContain("# Nội dung Công việc");
      expect(section!.markdown).toContain("| Giai đoạn | Mốc | Mô tả |");
    });
  });

  describe("Checker Compatibility", () => {
    it("should satisfy missing-member-table rule for software-project when member table is present", () => {
      const bundle = createProjectFromTemplate(softwareProjectTemplate, {
        metadata: {
          school: "Đại học",
          members: ["Nguyễn Văn A"],
        },
      });

      // Add minimum required fields and sections to avoid other unrelated checker errors (like missing-conclusion etc)
      const testBundle = {
        ...bundle,
        project: {
          ...bundle.project,
          sections: bundle.project.sections.map(s => {
            if (s.title === "Mở đầu") return { ...s, markdown: "# Mở đầu\nNội dung mở đầu\n" };
            if (s.title === "Triển khai") return { ...s, markdown: "# Triển khai\nNội dung triển khai\n" };
            if (s.title === "Kiểm thử") return { ...s, markdown: "# Kiểm thử\nNội dung kiểm thử\n" };
            if (s.title === "Kết luận") return { ...s, markdown: "# Kết luận\nNội dung kết luận\n" };
            if (s.title === "Tài liệu tham khảo") return { ...s, markdown: "# Tài liệu tham khảo\n1. Tham chiếu\n" };
            return s;
          }),
        },
        evidence: [
          { id: "e1", kind: "github" as const, title: "Repo", url: "https://github.com/a/b", qrEnabled: true, createdAt: "" },
          { id: "e2", kind: "video" as const, title: "Video", url: "https://youtube.com/watch?v=123", qrEnabled: true, createdAt: "" },
          { id: "e3", kind: "deploy" as const, title: "Deploy", url: "https://my-demo.com", qrEnabled: true, createdAt: "" },
        ],
      };

      const checkResult = runChecker(testBundle);
      const hasMemberTableWarning = checkResult.issues.some(issue => issue.id === "missing-member-table");
      expect(hasMemberTableWarning).toBe(false);
    });

    it("should satisfy missing-member-table rule for internship-report when timeline table is present", () => {
      const bundle = createProjectFromTemplate(internshipReportTemplate, {
        metadata: {
          school: "Đại học",
          company: "Công ty",
          mentor: "Người hướng dẫn",
          position: "Thực tập sinh",
          members: ["Nguyễn Văn A"],
        },
      });

      const testBundle = {
        ...bundle,
        project: {
          ...bundle.project,
          sections: bundle.project.sections.map(s => {
            if (s.title === "Tổng quan về Công ty") return { ...s, markdown: "# Tổng quan về Công ty\nNội dung\n" };
            if (s.title === "Tự đánh giá") return { ...s, markdown: "# Tự đánh giá\nNội dung\n" };
            if (s.title === "Đánh giá của người hướng dẫn") return { ...s, markdown: "# Đánh giá của người hướng dẫn\nNội dung\n" };
            return s;
          }),
        },
      };

      const checkResult = runChecker(testBundle);
      const hasMemberTableWarning = checkResult.issues.some(issue => issue.id === "missing-member-table");
      expect(hasMemberTableWarning).toBe(false);
    });
  });
});
