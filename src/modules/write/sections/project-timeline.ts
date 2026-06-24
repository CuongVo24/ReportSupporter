/**
 * Builder function to generate a milestone/timeline block.
 */
export function buildProjectTimeline(): string {
  let markdown = "# Nội dung Công việc\n\n";
  markdown += "Mô tả chi tiết các công việc, dự án được giao thực hiện tại doanh nghiệp.\n\n";
  markdown += "## Kế hoạch & Tiến độ thực hiện\n\n";
  markdown += "| Giai đoạn | Mốc | Mô tả |\n";
  markdown += "| --- | --- | --- |\n";
  markdown += "| ... | ... | ... |\n";

  return markdown;
}
