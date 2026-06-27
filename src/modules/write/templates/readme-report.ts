import type { TemplateSchema } from "@/types";

export const readmeReportTemplate: TemplateSchema = {
  id: "readme-report",
  name: "Báo cáo từ Markdown",
  description: "Khởi tạo khung báo cáo tự động bằng cách nhập nội dung tệp Markdown.",
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
      label: "Nội dung Markdown",
      type: "text",
      required: true,
      placeholder: "Dán nội dung tệp Markdown của bạn ở đây...",
    },
  ],
  sections: [],
  requiredSections: [],
  requiredEvidenceKinds: [],
  requiresToc: true,
};
