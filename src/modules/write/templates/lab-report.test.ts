import { describe, it, expect } from "vitest";
import { labReportTemplate } from "./lab-report";
import { generateSkeleton } from "../generate-skeleton";

describe("Lab Report Template", () => {
  it("should have correct template metadata", () => {
    expect(labReportTemplate.id).toBe("lab-report");
    expect(labReportTemplate.name).toBe("Báo cáo thực hành");
  });

  it("should generate a skeleton matching the sections in order without numbered prefixes", () => {
    const validMetadata = {
      title: "Bài thực hành 1",
      school: "Đại học Bách Khoa",
      subject: "Cơ sở dữ liệu",
      labNumber: "1",
      members: ["Nguyễn Văn A - 123456"],
    };

    const sections = generateSkeleton(labReportTemplate, validMetadata);
    expect(sections).toHaveLength(7);

    const expectedTitles = [
      "Mục tiêu",
      "Thành viên & Phân công",
      "Phương pháp",
      "Kết quả",
      "Thảo luận",
      "Kết luận",
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
    const titles = labReportTemplate.sections.map((s) => s.title);
    for (const reqSec of labReportTemplate.requiredSections) {
      expect(titles).toContain(reqSec);
    }
  });
});
