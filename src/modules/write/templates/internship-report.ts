import type { TemplateSchema } from "@/types";

export const internshipReportTemplate: TemplateSchema = {
  id: "internship-report",
  name: "Báo cáo thực tập",
  description: "Báo cáo kết quả quá trình thực tập tại cơ quan hoặc doanh nghiệp.",
  metadataFields: [
    {
      key: "school",
      label: "Trường / Khoa",
      type: "text",
      required: true,
      placeholder: "Đại học Bách Khoa ...",
    },
    {
      key: "company",
      label: "Công ty thực tập",
      type: "text",
      required: true,
      placeholder: "Công ty TNHH Phần mềm ABC",
    },
    {
      key: "mentor",
      label: "Người hướng dẫn (Mentor)",
      type: "text",
      required: true,
      placeholder: "Nguyễn Văn A - Trưởng phòng kỹ thuật",
    },
    {
      key: "position",
      label: "Vị trí thực tập",
      type: "text",
      required: true,
      placeholder: "Thực tập sinh Lập trình Web",
    },
    {
      key: "members",
      label: "Sinh viên thực tập",
      type: "textList",
      required: true,
      placeholder: "Họ tên - MSSV",
    },
  ],
  sections: [
    {
      title: "Tổng quan về Công ty",
      order: 0,
      status: "draft",
      starterMarkdown: "# Tổng quan về Công ty\n\nGiới thiệu về doanh nghiệp, phòng ban thực tập, lĩnh vực hoạt động.\n",
    },
    {
      title: "Nội dung Công việc",
      order: 1,
      status: "draft",
      starterMarkdown: "# Nội dung Công việc\n\nMô tả chi tiết các công việc, dự án được giao thực hiện tại doanh nghiệp.\n",
    },
    {
      title: "Kỹ năng đạt được",
      order: 2,
      status: "draft",
      starterMarkdown: "# Kỹ năng đạt được\n\nTóm tắt các kiến thức, công nghệ và kỹ năng mềm tích lũy được sau quá trình thực tập.\n",
    },
    {
      title: "Tự đánh giá",
      order: 3,
      status: "draft",
      starterMarkdown: "# Tự đánh giá\n\nĐánh giá kết quả của bản thân so với yêu cầu, điểm mạnh và điểm cần cải thiện.\n",
    },
    {
      title: "Đánh giá của người hướng dẫn",
      order: 4,
      status: "draft",
      starterMarkdown: "# Đánh giá của người hướng dẫn\n\nÝ kiến phản hồi, nhận xét và điểm đánh giá từ người hướng dẫn tại doanh nghiệp.\n",
    },
    {
      title: "Tài liệu tham khảo",
      order: 5,
      status: "draft",
      starterMarkdown: "# Tài liệu tham khảo\n\n1. Sách hướng dẫn thực tập, tài liệu kỹ thuật nội bộ công ty...\n",
    },
  ],
  requiredSections: ["Tổng quan về Công ty", "Nội dung Công việc", "Tự đánh giá", "Đánh giá của người hướng dẫn"],
  requiredEvidenceKinds: [],
  requiresToc: true,
};
