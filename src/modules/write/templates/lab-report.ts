import type { TemplateSchema } from "@/types";

export const labReportTemplate: TemplateSchema = {
  id: "lab-report",
  name: "Báo cáo thực hành",
  description: "Báo cáo kết quả thí nghiệm hoặc thực hành môn học.",
  metadataFields: [
    {
      key: "school",
      label: "Trường / Khoa",
      type: "text",
      required: true,
      placeholder: "Đại học Bách Khoa ...",
    },
    {
      key: "subject",
      label: "Môn học",
      type: "text",
      required: true,
      placeholder: "Hệ quản trị cơ sở dữ liệu",
    },
    {
      key: "labNumber",
      label: "Bài thực hành số",
      type: "text",
      required: true,
      placeholder: "Bài thực hành số 1",
    },
    {
      key: "lecturer",
      label: "Giảng viên hướng dẫn",
      type: "text",
      required: false,
    },
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
      title: "Mục tiêu",
      order: 0,
      status: "draft",
      starterMarkdown: "# Mục tiêu\n\nNêu rõ mục tiêu của bài thực hành thí nghiệm.\n",
    },
    {
      title: "Phương pháp",
      order: 1,
      status: "draft",
      starterMarkdown: "# Phương pháp\n\nMô tả các bước tiến hành thực hiện thí nghiệm, công cụ sử dụng.\n",
    },
    {
      title: "Kết quả",
      order: 2,
      status: "draft",
      starterMarkdown: "# Kết quả\n\nBảng dữ liệu kết quả, sơ đồ, ảnh chụp màn hình minh họa kết quả.\n",
    },
    {
      title: "Thảo luận",
      order: 3,
      status: "draft",
      starterMarkdown: "# Thảo luận\n\nPhân tích kết quả, so sánh lý thuyết với thực tế thí nghiệm.\n",
    },
    {
      title: "Kết luận",
      order: 4,
      status: "draft",
      starterMarkdown: "# Kết luận\n\nĐánh giá mức độ hoàn thành mục tiêu bài thực hành.\n",
    },
    {
      title: "Tài liệu tham khảo",
      order: 5,
      status: "draft",
      starterMarkdown: "# Tài liệu tham khảo\n\n1. Sách hướng dẫn thực hành môn học...\n",
    },
  ],
  requiredSections: ["Mục tiêu", "Phương pháp", "Kết quả", "Kết luận", "Tài liệu tham khảo"],
  requiredEvidenceKinds: [],
  requiresToc: false,
};
