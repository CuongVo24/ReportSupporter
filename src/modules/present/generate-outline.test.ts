import { describe, it, expect } from "vitest";
import type { ReportSection, EvidenceItem } from "@/types";
import { generateSlideOutline } from "./generate-outline";

describe("generateSlideOutline", () => {
  const mockEvidence: EvidenceItem[] = [
    {
      id: "ev-github",
      kind: "github",
      title: "GitHub Repository",
      url: "https://github.com/CuongVo24/ReportSupporter",
      qrEnabled: true,
      createdAt: "2026-06-25T00:00:00Z",
    },
    {
      id: "ev-video",
      kind: "video",
      title: "Demo Video",
      url: "https://youtube.com/watch?v=123",
      qrEnabled: false,
      createdAt: "2026-06-25T00:00:00Z",
    },
  ];

  it("should generate slides preserving report section order and numbered headings", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-intro",
        order: 1,
        title: "Giới thiệu",
        status: "draft",
        markdown: "# Giới thiệu\n\nĐây là chương giới thiệu bối cảnh. Mục tiêu của chúng tôi là xây dựng ReportSupporter.\n\n## Lý do chọn đề tài\n\nChúng tôi muốn giải quyết các khó khăn trong làm báo cáo.\n",
      },
      {
        id: "sec-impl",
        order: 2,
        title: "Hiện thực",
        status: "draft",
        markdown: "# Triển khai hệ thống\n\nKiến trúc phần mềm được thiết kế theo MVC. Xem thêm tại [Mã nguồn](https://github.com/CuongVo24/ReportSupporter).\n",
      },
    ];

    const slides = generateSlideOutline(sections, mockEvidence);

    // Should have 3 slides:
    // 1. # Giới thiệu (H1)
    // 2. ## 1.1 Lý do chọn đề tài (H2)
    // 3. # Triển khai hệ thống (H1, which will be numbered 2.)
    expect(slides).toHaveLength(3);

    // Verify order and slide structures
    expect(slides[0]).toEqual({
      id: "sec-intro-slide-0",
      fromSectionId: "sec-intro",
      order: 0,
      title: "1. Giới thiệu",
      bullets: ["Đây là chương giới thiệu bối cảnh."],
      evidenceRefs: [],
    });

    expect(slides[1]).toEqual({
      id: "sec-intro-slide-1",
      fromSectionId: "sec-intro",
      order: 1,
      title: "1.1. Lý do chọn đề tài",
      bullets: ["Chúng tôi muốn giải quyết các khó khăn trong làm báo cáo."],
      evidenceRefs: [],
    });

    expect(slides[2]).toEqual({
      id: "sec-impl-slide-0",
      fromSectionId: "sec-impl",
      order: 2,
      title: "2. Triển khai hệ thống",
      bullets: ["Kiến trúc phần mềm được thiết kế theo MVC."],
      evidenceRefs: ["ev-github"],
    });
  });

  it("should discard empty sections or sections with only whitespace", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-intro",
        order: 1,
        title: "Giới thiệu",
        status: "draft",
        markdown: "# Giới thiệu\n\nCó nội dung.\n",
      },
      {
        id: "sec-empty-1",
        order: 2,
        title: "Chương rỗng",
        status: "draft",
        markdown: "",
      },
      {
        id: "sec-empty-2",
        order: 3,
        title: "Chương whitespace",
        status: "draft",
        markdown: "   \n   \n",
      },
    ];

    const slides = generateSlideOutline(sections);
    expect(slides).toHaveLength(1);
    expect(slides[0].fromSectionId).toBe("sec-intro");
  });

  it("should generate a fallback slide for non-empty sections that lack H1/H2 headings", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-no-headings",
        order: 1,
        title: "Nội dung tự do",
        status: "draft",
        markdown: "Đây là một đoạn văn tự do không có tiêu đề. Câu thứ hai.",
      },
    ];

    const slides = generateSlideOutline(sections);
    expect(slides).toHaveLength(1);
    expect(slides[0]).toEqual({
      id: "sec-no-headings-slide-0",
      fromSectionId: "sec-no-headings",
      order: 0,
      title: "Nội dung tự do",
      bullets: ["Đây là một đoạn văn tự do không có tiêu đề."],
      evidenceRefs: [],
    });
  });

  it("should cap bullets list to 5 items per slide", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-bullets",
        order: 1,
        title: "Nhiều bullets",
        status: "draft",
        markdown: `
# Tiêu đề
- Bullet 1
- Bullet 2
- Bullet 3
- Bullet 4
- Bullet 5
- Bullet 6
- Bullet 7
        `,
      },
    ];

    const slides = generateSlideOutline(sections);
    expect(slides).toHaveLength(1);
    expect(slides[0].bullets).toHaveLength(5);
    expect(slides[0].bullets).toEqual([
      "Bullet 1",
      "Bullet 2",
      "Bullet 3",
      "Bullet 4",
      "Bullet 5",
    ]);
  });

  it("should handle nested lists correctly without duplication", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-nested",
        order: 1,
        title: "Nested",
        status: "draft",
        markdown: `
# Tiêu đề
- Item 1
  - Nested A
  - Nested B
- Item 2
        `,
      },
    ];

    const slides = generateSlideOutline(sections);
    expect(slides).toHaveLength(1);
    expect(slides[0].bullets).toEqual([
      "Item 1",
      "Nested A",
      "Nested B",
      "Item 2",
    ]);
  });

  it("should extract H3+ headings as bullets", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-h3",
        order: 1,
        title: "H3",
        status: "draft",
        markdown: `
# H1 Title
### Subsubsection 1
Paragraph under h3.
        `,
      },
    ];

    const slides = generateSlideOutline(sections);
    expect(slides).toHaveLength(1);
    expect(slides[0].bullets).toEqual([
      "Subsubsection 1",
      "Paragraph under h3.",
    ]);
  });

  it("should map evidenceRefs from images and link URLs", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-evidence",
        order: 1,
        title: "Evidence",
        status: "draft",
        markdown: `
# Slide Title
Chúng tôi có link github [Repo](https://github.com/CuongVo24/ReportSupporter) và một ảnh minh chứng:
![Alt](https://youtube.com/watch?v=123)
        `,
      },
    ];

    const slides = generateSlideOutline(sections, mockEvidence);
    expect(slides).toHaveLength(1);
    expect(slides[0].evidenceRefs).toEqual(["ev-github", "ev-video"]);
  });

  it("should handle broken evidence references by omitting from evidenceRefs and adding warning bullet", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-broken",
        order: 1,
        title: "Broken Ref",
        status: "draft",
        markdown: `
# Slide Title
[GitHub Repo](https://github.com/CuongVo24/ReportSupporter)
[Deleted Deploy](https://deleted-app.vercel.app)
        `,
      },
    ];

    // Only provide the github evidence item. The deploy item is deleted/missing.
    const slides = generateSlideOutline(sections, [mockEvidence[0]]);
    expect(slides).toHaveLength(1);
    expect(slides[0].evidenceRefs).toEqual(["ev-github"]); // matches repo but vercel is omitted
    expect(slides[0].bullets).not.toContain("[Cảnh báo: Minh chứng đã bị xóa]");
    expect(slides[0].brokenEvidenceNotes).toEqual(["[Cảnh báo: Minh chứng đã bị xóa]"]);
  });

  it("should be deterministic (same input yields same output)", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-det",
        order: 1,
        title: "Chương",
        status: "draft",
        markdown: "# Tiêu đề\n\nNội dung một. Nội dung hai.\n",
      },
    ];

    const result1 = generateSlideOutline(sections, mockEvidence);
    const result2 = generateSlideOutline(sections, mockEvidence);
    expect(result1).toEqual(result2);
  });

  it("should number headings correctly even when there is inline markdown or text discrepancies across sections", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-1",
        order: 1,
        title: "Section 1",
        status: "draft",
        markdown: "# Chương **độc nhất**\n\nNội dung chương 1.\n",
      },
      {
        id: "sec-2",
        order: 2,
        title: "Section 2",
        status: "draft",
        markdown: "# Chương trùng lặp\n\nNội dung chương 2.\n",
      },
    ];

    const slides = generateSlideOutline(sections);
    expect(slides).toHaveLength(2);
    expect(slides[0].title).toBe("1. Chương độc nhất");
    expect(slides[1].title).toBe("2. Chương trùng lặp");
  });

  it("should number multiple H2 headings across sections correctly in standard chapter flow", () => {
    const sections: ReportSection[] = [
      {
        id: "sec-1",
        order: 1,
        title: "Section 1",
        status: "draft",
        markdown: "# Chương 1\n\n## Mục 1.1\n\n## Mục 1.2\n",
      },
      {
        id: "sec-2",
        order: 2,
        title: "Section 2",
        status: "draft",
        markdown: "# Chương 2\n\n## Mục 2.1\n",
      },
    ];

    const slides = generateSlideOutline(sections);
    expect(slides).toHaveLength(5);
    expect(slides[0].title).toBe("1. Chương 1");
    expect(slides[1].title).toBe("1.1. Mục 1.1");
    expect(slides[2].title).toBe("1.2. Mục 1.2");
    expect(slides[3].title).toBe("2. Chương 2");
    expect(slides[4].title).toBe("2.1. Mục 2.1");
  });
});
