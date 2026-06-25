import { describe, it, expect } from "vitest";
import { generateDefenseQA } from "./generate-qa";
import type { ReportSection, EvidenceItem } from "@/types";

describe("generateDefenseQA", () => {
  const mockEvidence: EvidenceItem[] = [
    {
      id: "ev-deploy",
      kind: "deploy",
      title: "Production Deploy Link",
      url: "https://my-app.vercel.app",
      qrEnabled: true,
      createdAt: new Date().toISOString(),
    },
  ];

  it("should generate Q&A for scope topic if scope keywords are found in section markdown", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-1",
        order: 0,
        title: "Introduction",
        markdown: "Mục tiêu của đề tài là xây dựng workspace quản lý dự án. Phạm vi nghiên cứu trong học kỳ này.",
        status: "done",
      },
    ];

    const result = generateDefenseQA(sections);
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("scope");
    expect(result[0].relatedSectionId).toBe("sec-1");
    expect(result[0].suggestedAnswer).toBe("Mục tiêu của đề tài là xây dựng workspace quản lý dự án.");
  });

  it("should handle tech topic and deploy signal if keyword deploy or deploy evidence exists", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-2",
        order: 1,
        title: "Deployment",
        markdown: "Chúng tôi thực hiện deploy ứng dụng lên máy chủ đám mây. Quy trình triển khai tự động qua CI/CD.",
        status: "done",
      },
    ];

    const result = generateDefenseQA(sections, mockEvidence);
    const techQA = result.find((qa) => qa.topic === "tech");
    expect(techQA).toBeDefined();
    expect(techQA!.question).toContain("Quy trình triển khai");
    expect(techQA!.suggestedAnswer).toContain("Production Deploy Link");
    expect(techQA!.suggestedAnswer).toContain("https://my-app.vercel.app");
  });

  it("should return correct topics (result, limitation, future) when signals are present", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-3",
        order: 2,
        title: "Evaluation",
        markdown: "Kết quả thu được rất khả quan. Tuy nhiên hệ thống còn gặp hạn chế về hiệu năng. Trong tương lai chúng tôi sẽ nâng cấp thêm nhiều chức năng khác.",
        status: "done",
      },
    ];

    const result = generateDefenseQA(sections);
    const topics = result.map((qa) => qa.topic);
    expect(topics).toContain("result");
    expect(topics).toContain("limitation");
    expect(topics).toContain("future");

    const limitQA = result.find((qa) => qa.topic === "limitation");
    expect(limitQA!.suggestedAnswer).toBe("Tuy nhiên hệ thống còn gặp hạn chế về hiệu năng.");
  });

  it("should skip topics if there are no matching keyword signals in content", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-4",
        order: 3,
        title: "Empty content",
        markdown: "Nội dung bình thường không có từ khóa đặc biệt nào.",
        status: "done",
      },
    ];

    const result = generateDefenseQA(sections);
    expect(result).toHaveLength(0);
  });

  it("should be deterministic (same input produces same output)", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-1",
        order: 0,
        title: "Introduction",
        markdown: "Mục tiêu của đề tài là xây dựng workspace quản lý dự án. Quy trình triển khai hệ thống lên deploy.",
        status: "done",
      },
    ];

    const run1 = generateDefenseQA(sections, mockEvidence);
    const run2 = generateDefenseQA(sections, mockEvidence);
    expect(run1).toEqual(run2);
  });
});
