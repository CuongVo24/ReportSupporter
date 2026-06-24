# Checker Samples - Week 3 Validation

This document contains a sample project structure and markdown contents designed to trigger each of the checker rules registered in `RULES_REGISTRY` exactly once, illustrating how issues are detected and how the readiness score is calculated.

---

## 1. Project Bundle & Metadata Configuration
To trigger project-wide metadata and evidence checks, the report is initialized with the following configuration:

- **Template ID**: `software-project` (Requires TOC, Conclusion, References, Member Allocation Table, GitHub repository link, Demo link, and Deploy evidence).
- **Metadata**:
  - `school`: "Trường Công nghệ"
  - `members`: ["Nguyễn Văn A"]
  - (Note: `github` and `demo` links are intentionally left blank in metadata).
- **Evidence**:
  - `e1`: kind `video`, URL `https://youtube.com/watch?v=123`
  - `e2`: kind `deploy`, URL `not-a-valid-url-format` (Triggers `broken-evidence-url-shape`)
  - (Note: `github` evidence kind is missing, triggering `missing-required-evidence`).
- **Format Settings**:
  - `includeToc`: `false` (Triggers `toc-disabled`).

---

## 2. Document Content (Sections Markdown)

### Section 1: Mở đầu
```markdown
# 1. Mở đầu

Đây là nội dung mở đầu của dự án. TODO: cần bổ sung thêm chi tiết ở đây.

### Chi tiết mục tiêu
Chúng tôi thực hiện mục tiêu này bằng cách viết code:
```
const x = 1;
```

#### Bảng dữ liệu mẫu
| Cột 1 | Cột 2 | Cột 3 | Cột 4 | Cột 5 | Cột 6 | Cột 7 |
|---|---|---|---|---|---|---|
| A | B | C | D | E | F | G |

![Sơ đồ kiến trúc](asset:architecture-diagram)
![Sơ đồ lỗi](asset:ghost-image)
```

---

## 3. Triggered Rules Mapping

| Rule ID | Severity | Cause in Sample | Suggestion / Message |
| :--- | :---: | :--- | :--- |
| `toc-disabled` | warning | `includeToc` format setting is `false` | Bật TOC trong Thiết lập định dạng để báo cáo có Trang mục lục. |
| `missing-conclusion` | error | Missing a section matching the "Kết luận" title | Thiếu mục Kết luận — tạo section tiêu đề Kết luận. |
| `missing-references` | error | Missing a section matching the "Tài liệu tham khảo" title | Thiếu mục Tài liệu tham khảo — tạo section tiêu đề Tài liệu tham khảo. |
| `missing-member-table` | warning | No table exists representing member allocation | Dự án nhóm/công nghệ thiếu bảng phân công thành viên. |
| `missing-project-links` | error | No GitHub or demo links in metadata or markdown | Báo cáo công nghệ thiếu link mã nguồn GitHub hoặc link chạy thử demo. |
| `missing-required-evidence` | error | Missing mandatory `github` evidence kind | Thiếu minh chứng bắt buộc loại: github |
| `broken-evidence-url-shape` | warning | Evidence URL `not-a-valid-url-format` is invalid | Link minh chứng deploy sai định dạng URL. |
| `skipped-heading-level` | warning | Heading jumps from `# 1. Mở đầu` (h1) to `### Chi tiết mục tiêu` (h3) | Heading nhảy cấp từ h1 sang h3. |
| `hardcoded-heading-number` | warning | Heading starts with hardcoded `"1. "` | Heading bắt đầu bằng số chương hard-coded (vd # 1. Mở đầu). |
| `empty-section` | warning | (If we have a section with only a heading, e.g. a placeholder section) | Section còn trống — viết nội dung hoặc xoá section. |
| `missing-captions` | warning | Table has no adjacent caption starting with "Bảng" or "Table" | Bảng biểu thiếu caption liền kề. |
| `broken-image` | error | Reference to `asset:ghost-image` which is not present in bundle assets | Tham chiếu ảnh không tồn tại: "asset:ghost-image". |
| `table-too-wide` | info | Table has 7 columns (exceeding the limit of 6 columns) | Bảng có nhiều cột (7 cột) có thể tràn trang A4. |
| `placeholder-text` | warning | Text contains placeholder `"TODO:"` | Phát hiện nội dung placeholder còn sót ("TODO:"). |
| `code-block-no-lang` | warning | Fenced code block has no language tag | Code block thiếu khai báo ngôn ngữ. |

---

## 4. Score Calculation

- **Base Score**: 100
- **Deductions**:
  - 5 Errors (`missing-conclusion`, `missing-references`, `missing-project-links`, `missing-required-evidence`, `broken-image`): `5 * -15 = -75`
  - 9 Warnings (`toc-disabled`, `missing-member-table`, `broken-evidence-url-shape`, `skipped-heading-level`, `hardcoded-heading-number`, `empty-section`, `missing-captions`, `placeholder-text`, `code-block-no-lang`): `9 * -5 = -45`
  - 1 Info (`table-too-wide`): `1 * -1 = -1`
- **Raw Score**: `100 - 75 - 45 - 1 = -21`
- **Clamped Score**: **0** (Red Band: "Chưa nên nộp")
