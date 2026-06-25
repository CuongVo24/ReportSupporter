import { describe, it, expect } from "vitest";
import { generateSpeakerScript } from "./generate-script";
import type { SlideOutline, EvidenceItem } from "@/types";

describe("generateSpeakerScript", () => {
  const mockEvidence: EvidenceItem[] = [
    {
      id: "ev-1",
      kind: "video",
      title: "Video demo sản phẩm",
      url: "https://youtube.com/demo",
      qrEnabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "ev-2",
      kind: "github",
      title: "Mã nguồn Github",
      url: "https://github.com/test/repo",
      qrEnabled: false,
      createdAt: new Date().toISOString(),
    },
  ];

  it("should generate a deterministic script for each slide based on title and bullets", () => {
    const outlines: SlideOutline[] = [
      {
        id: "slide-1",
        fromSectionId: "sec-1",
        order: 0,
        title: "1. Mở đầu",
        bullets: ["Mục tiêu dự án", "Phạm vi nghiên cứu"],
        evidenceRefs: [],
      },
    ];

    const result = generateSpeakerScript(outlines, mockEvidence);
    expect(result).toHaveLength(1);
    expect(result[0].slideId).toBe("slide-1");
    expect(result[0].script).toContain("Sau đây, chúng ta sẽ cùng tìm hiểu về phần: 1. Mở đầu.");
    expect(result[0].script).toContain("Ý thứ 1 là, Mục tiêu dự án");
    expect(result[0].script).toContain("Ý thứ 2 là, Phạm vi nghiên cứu");
  });

  it("should generate cues for evidence references", () => {
    const outlines: SlideOutline[] = [
      {
        id: "slide-2",
        fromSectionId: "sec-2",
        order: 1,
        title: "2. Demo và thực nghiệm",
        bullets: ["Xem video giới thiệu để rõ chi tiết"],
        evidenceRefs: ["ev-1", "ev-2"],
      },
    ];

    const result = generateSpeakerScript(outlines, mockEvidence);
    expect(result).toHaveLength(1);
    expect(result[0].cues).toContain("mở demo Video demo sản phẩm");
    expect(result[0].cues).toContain("mở demo Mã nguồn Github");
  });

  it("should generate cues for figure/table captions found in title or bullets", () => {
    const outlines: SlideOutline[] = [
      {
        id: "slide-3",
        fromSectionId: "sec-3",
        order: 2,
        title: "3. Sơ đồ kiến trúc (Hình 1)",
        bullets: [
          "Báo cáo chi tiết ở Bảng 2.1 của tài liệu.",
          "Mô tả quy trình hoạt động.",
        ],
        evidenceRefs: [],
      },
    ];

    const result = generateSpeakerScript(outlines, mockEvidence);
    expect(result).toHaveLength(1);
    expect(result[0].cues).toContain("chỉ vào Hình 1");
    expect(result[0].cues).toContain("chỉ vào Bảng 2.1");
  });

  it("should return empty cues if there are no evidence references or captions", () => {
    const outlines: SlideOutline[] = [
      {
        id: "slide-4",
        fromSectionId: "sec-4",
        order: 3,
        title: "4. Kết luận",
        bullets: ["Hoàn thành các mục tiêu.", "Định hướng phát triển."],
        evidenceRefs: [],
      },
    ];

    const result = generateSpeakerScript(outlines, mockEvidence);
    expect(result).toHaveLength(1);
    expect(result[0].cues).toEqual([]);
  });

  it("should be deterministic (same input produces same output)", () => {
    const outlines: SlideOutline[] = [
      {
        id: "slide-1",
        fromSectionId: "sec-1",
        order: 0,
        title: "1. Mở đầu (Hình 1)",
        bullets: ["Mục tiêu dự án"],
        evidenceRefs: ["ev-1"],
      },
    ];

    const run1 = generateSpeakerScript(outlines, mockEvidence);
    const run2 = generateSpeakerScript(outlines, mockEvidence);

    expect(run1).toEqual(run2);
  });
});
