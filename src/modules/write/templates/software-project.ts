import type { TemplateSchema } from "@/types";

/**
 * Seed template for a software-project report (Vietnamese).
 * Section titles & starter markdown carry NO chapter numbers — Format owns numbering (1.Write §3.3).
 */
export const softwareProjectTemplate: TemplateSchema = {
  id: "software-project",
  name: "Báo cáo đồ án phần mềm",
  description: "Khung báo cáo cho đồ án/dự án phần mềm theo nhóm.",
  metadataFields: [
    {
      key: "school",
      label: "Trường / Khoa",
      type: "text",
      required: true,
      placeholder: "Đại học ...",
    },
    {
      key: "course",
      label: "Học phần",
      type: "text",
      required: false,
      placeholder: "Nhập môn Công nghệ phần mềm",
    },
    { key: "lecturer", label: "Giảng viên hướng dẫn", type: "text", required: false },
    {
      key: "members",
      label: "Thành viên nhóm",
      type: "textList",
      required: true,
      placeholder: "Họ tên - MSSV",
    },
  ],
  sections: [
    {
      title: "Mở đầu",
      order: 0,
      status: "draft",
      starterMarkdown: "# Mở đầu\n\nGiới thiệu bối cảnh, mục tiêu và phạm vi đề tài.\n",
    },
    {
      title: "Thành viên & Phân công",
      order: 1,
      status: "draft",
      starterMarkdown:
        "# Thành viên & Phân công\n\n| Thành viên | Nhiệm vụ |\n| --- | --- |\n| ... | ... |\n",
    },
    {
      title: "Triển khai",
      order: 2,
      status: "draft",
      starterMarkdown: "# Triển khai\n\nMô tả kiến trúc, công nghệ và cách hiện thực.\n",
    },
    {
      title: "Kiểm thử",
      order: 3,
      status: "draft",
      starterMarkdown: "# Kiểm thử\n\nKịch bản kiểm thử và kết quả.\n",
    },
    {
      title: "Kết luận",
      order: 4,
      status: "draft",
      starterMarkdown: "# Kết luận\n\nTổng kết kết quả đạt được và hướng phát triển.\n",
    },
    {
      title: "Tài liệu tham khảo",
      order: 5,
      status: "draft",
      starterMarkdown: "# Tài liệu tham khảo\n\n1. ...\n",
    },
    {
      title: "Minh chứng",
      order: 6,
      status: "draft",
      starterMarkdown: "# Minh chứng\n\nLiên kết GitHub, video demo, deploy.\n",
    },
  ],
  requiredSections: ["Mở đầu", "Triển khai", "Kiểm thử", "Kết luận", "Tài liệu tham khảo"],
  requiredEvidenceKinds: ["github", "video", "deploy"],
  requiresToc: true,
};
