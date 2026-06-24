# Template Samples & Linter Integration Outcomes

This document details the structures, generated skeletons, and checker results for the four advanced templates in Week 6.

---

## 1. Báo cáo đồ án phần mềm (software-project)

### Schema Definition
- **ID**: `software-project`
- **Metadata Fields**: `school` (text, req), `course` (text), `lecturer` (text), `members` (textList, req)
- **Required Sections**: `["Mở đầu", "Triển khai", "Kiểm thử", "Kết luận", "Tài liệu tham khảo"]`
- **Required Evidence**: `["github", "video", "deploy"]`
- **Requires TOC**: `true`

### Generated Skeleton Sections
1. **Mở đầu**: `# Mở đầu\n\nGiới thiệu bối cảnh, mục tiêu và phạm vi đề tài.\n`
2. **Thành viên & Phân công**: *(Generated dynamically from `buildMemberResponsibility()`)*
   ```markdown
   # Thành viên & Phân công

   | Thành viên | Vai trò | Nhiệm vụ |
   | --- | --- | --- |
   | ... | ... | ... |
   ```
3. **Triển khai**: `# Triển khai\n\nMô tả kiến trúc, công nghệ và cách hiện thực.\n`
4. **Kiểm thử**: `# Kiểm thử\n\nKịch bản kiểm thử và kết quả.\n`
5. **Kết luận**: `# Kết luận\n\nTổng kết kết quả đạt được và hướng phát triển.\n`
6. **Tài liệu tham khảo**: `# Tài liệu tham khảo\n\n1. ...\n`
7. **Minh chứng**: `# Minh chứng\n\nLiên kết GitHub, video demo, deploy.\n`

---

## 2. Báo cáo thực hành (lab-report)

### Schema Definition
- **ID**: `lab-report`
- **Metadata Fields**: `school` (text, req), `subject` (text, req), `labNumber` (text, req), `lecturer` (text), `members` (textList, req)
- **Required Sections**: `["Mục tiêu", "Phương pháp", "Kết quả", "Kết luận", "Tài liệu tham khảo"]`
- **Required Evidence**: `[]`
- **Requires TOC**: `false`

### Generated Skeleton Sections
1. **Mục tiêu**: `# Mục tiêu\n\nObjective descriptions...\n`
2. **Phương pháp**: `# Phương pháp\n\nMethodology and steps...\n`
3. **Kết quả**: `# Kết quả\n\nResults and observations...\n`
4. **Thảo luận**: `# Thảo luận\n\nDiscussion and analysis...\n`
5. **Kết luận**: `# Kết luận\n\nConclusion...\n`
6. **Tài liệu tham khảo**: `# Tài liệu tham khảo\n\n1. ...\n`

---

## 3. Báo cáo thực tập (internship-report)

### Schema Definition
- **ID**: `internship-report`
- **Metadata Fields**: `school` (text, req), `company` (text, req), `mentor` (text, req), `position` (text, req), `members` (textList, req)
- **Required Sections**: `["Tổng quan về Công ty", "Nội dung Công việc", "Tự đánh giá", "Đánh giá của người hướng dẫn"]`
- **Required Evidence**: `[]`
- **Requires TOC**: `true`

### Generated Skeleton Sections
1. **Tổng quan về Công ty**: `# Tổng quan về Công ty\n\nGiới thiệu về doanh nghiệp, phòng ban thực tập, lĩnh vực hoạt động.\n`
2. **Nội dung Công việc**: *(Generated dynamically from `buildProjectTimeline()`)*
   ```markdown
   # Nội dung Công việc

   Mô tả chi tiết các công việc, dự án được giao thực hiện tại doanh nghiệp.

   ## Kế hoạch & Tiến độ thực hiện

   | Giai đoạn | Mốc | Mô tả |
   | --- | --- | --- |
   | ... | ... | ... |
   ```
3. **Kỹ năng đạt được**: `# Kỹ năng đạt được\n\nTóm tắt các kiến thức, công nghệ và kỹ năng mềm tích lũy được sau quá trình thực tập.\n`
4. **Tự đánh giá**: `# Tự đánh giá\n\nĐánh giá kết quả của bản thân so với yêu cầu, điểm mạnh và điểm cần cải thiện.\n`
5. **Đánh giá của người hướng dẫn**: `# Đánh giá của người hướng dẫn\n\nÝ kiến phản hồi, nhận xét và điểm đánh giá từ người hướng dẫn tại doanh nghiệp.\n`
6. **Tài liệu tham khảo**: `# Tài liệu tham khảo\n\n1. Sách hướng dẫn thực tập, tài liệu kỹ thuật nội bộ công ty...\n`

---

## 4. Báo cáo từ README (readme-report)

### Schema Definition
- **ID**: `readme-report`
- **Metadata Fields**: `school` (text, req), `members` (textList, req), `readmeContent` (text, req - renders as `<textarea>`)
- **Required Sections**: `[]`
- **Required Evidence**: `[]`
- **Requires TOC**: `true`

### Generated Skeleton (Example)
Given this input README:
```markdown
Leading explanation about the project.

# Installation
Instructions to install.

# Usage
Instructions to run.
```

The importer `importReadme()` parses this into 3 sections:
1. **Mở đầu**:
   ```markdown
   # Mở đầu
   Leading explanation about the project.
   ```
2. **Installation**:
   ```markdown
   # Installation
   Instructions to install.
   ```
3. **Usage**:
   ```markdown
   # Usage
   Instructions to run.
   ```

---

## 5. Sample Checker Outcomes (Rule Integration)

### Example 1: Missing Required Section
If an `internship-report` project lacks the `"Tổng quan về Công ty"` heading, the checker triggers the `missing-sections` rule:

```json
{
  "id": "missing-conclusion",
  "severity": "error",
  "module": "check",
  "message": "Thêm phần Kết luận để tổng kết kết quả & hướng phát triển.",
  "suggestion": "Tạo một heading Kết luận (hoặc Conclusion)."
}
```
*(Note: If "Kết luận" is not in the active template's `requiredSections` - like `internship-report` - this warning is skipped, preventing false-positives).*

### Example 2: Missing Table of Contents (TOC)
If `requiresToc` is `true` for a template (like `software-project` or `internship-report`), but the user unchecks "Table of Contents" in the format configuration:

```json
{
  "id": "toc-disabled",
  "severity": "warning",
  "module": "check",
  "message": "Template báo cáo này nên có mục lục — bật Table of Contents trong Format.",
  "suggestion": "Bật Table of Contents trong thiết lập định dạng."
}
```
*(Note: If `requiresToc` is `false` - like `lab-report` - this warning is skipped).*
