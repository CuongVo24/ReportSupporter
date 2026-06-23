import { describe, it, expect } from "vitest";
import { generateSkeleton, validateMetadata } from "./generate-skeleton";
import { softwareProjectTemplate } from "./templates/software-project";

describe("generateSkeleton", () => {
  const validMetadata = {
    title: "Đồ án Xây dựng Web App",
    school: "Đại học Công nghệ thông tin",
    course: "Công nghệ phần mềm",
    lecturer: "Nguyễn Văn A",
    members: ["Nguyễn Văn B - 20120001", "Trần Thị C - 20120002"],
  };

  it("generates correct number of sections and starter markdown", () => {
    const sections = generateSkeleton(softwareProjectTemplate, validMetadata);
    expect(sections).toHaveLength(softwareProjectTemplate.sections.length);

    sections.forEach((sec, idx) => {
      const seed = softwareProjectTemplate.sections[idx];
      expect(sec.title).toBe(seed.title);
      expect(sec.order).toBe(seed.order);
      expect(sec.markdown).toBe(seed.starterMarkdown);
      expect(sec.status).toBe("draft");
    });
  });

  it("sorts generated sections by order", () => {
    const sections = generateSkeleton(softwareProjectTemplate, validMetadata);
    const orders = sections.map(s => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

describe("validateMetadata", () => {
  it("passes when all required fields are correctly filled", () => {
    const title = "Đồ án Môn học";
    const metadata = {
      school: "Trường Đại học Bách Khoa",
      members: ["Thành viên 1"],
    };

    const errors = validateMetadata(softwareProjectTemplate, title, metadata);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns errors for missing required fields", () => {
    const title = ""; // Empty title (required)
    const metadata = {
      school: "", // Empty required text field
      members: [] as string[], // Empty required list field
    };

    const errors = validateMetadata(softwareProjectTemplate, title, metadata);
    
    expect(errors.title).toContain("Tiêu đề báo cáo");
    expect(errors.school).toContain("Trường / Khoa");
    expect(errors.members).toContain("Thành viên nhóm");
  });
});
