import type { TemplateSchema } from "@/types";

export const readmeReportTemplate: TemplateSchema = {
  id: "readme-report",
  name: "Báo cáo từ README",
  description: "Khởi tạo khung báo cáo tự động bằng cách nhập nội dung tệp README.md.",
  metadataFields: [
    {
      key: "school",
      label: "Trường / Khoa",
      type: "text",
      required: true,
      placeholder: "Đại học Bách Khoa ...",
    },
    {
      key: "members",
      label: "Thành viên nhóm",
      type: "textList",
      required: true,
      placeholder: "Họ tên - MSSV",
    },
    {
      key: "readmeContent",
      label: "Nội dung README.md",
      type: "text",
      required: true,
      placeholder: "Dán nội dung tệp README.md của bạn ở đây...",
    },
  ],
  sections: [],
  requiredSections: [],
  requiredEvidenceKinds: [],
  requiresToc: true,
};
