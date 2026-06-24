import { describe, it, expect } from "vitest";
import { internshipReportTemplate } from "./internship-report";
import { generateSkeleton } from "../generate-skeleton";

describe("Internship Report Template", () => {
  it("should have correct template metadata", () => {
    expect(internshipReportTemplate.id).toBe("internship-report");
    expect(internshipReportTemplate.name).toBe("Báo cáo thực tập");
  });

  it("should generate a skeleton matching the sections in order without numbered prefixes", () => {
    const validMetadata = {
      title: "Báo cáo thực tập tốt nghiệp",
      school: "Đại học Bách Khoa",
      company: "Công ty ABC",
      mentor: "Mentor A",
      position: "Web Dev Intern",
      members: ["Nguyễn Văn A - 123456"],
    };

    const sections = generateSkeleton(internshipReportTemplate, validMetadata);
    expect(sections).toHaveLength(7);

    const expectedTitles = [
      "Tổng quan về Công ty",
      "Thành viên & Phân công",
      "Nội dung Công việc",
      "Kỹ năng đạt được",
      "Tự đánh giá",
      "Đánh giá của người hướng dẫn",
      "Tài liệu tham khảo",
    ];

    sections.forEach((sec, idx) => {
      expect(sec.title).toBe(expectedTitles[idx]);
      // Verify no chapter numbering prefix is hardcoded in the seed section titles
      expect(sec.title).not.toMatch(/^\d+\./);
      expect(sec.markdown).toContain(expectedTitles[idx]);
    });
  });

  it("should have all required sections present in the template's sections", () => {
    const titles = internshipReportTemplate.sections.map((s) => s.title);
    for (const reqSec of internshipReportTemplate.requiredSections) {
      expect(titles).toContain(reqSec);
    }
  });
});
