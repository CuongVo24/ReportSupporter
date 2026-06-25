# Present Module - Slide Outline, Timeline & Speaker Samples

This document presents sample deterministic outputs generated offline for the **Present module** in ReportSupporter. It highlights the mapping of sections, markdown contents, and evidence items to slide outlines, timeline slot durations, and speaker contiguous block allocations.

---

## 1. Software Project Template (`software-project`)

This sample shows the output for a software project report with 3 members and 3 evidence references (GitHub, video, and deployment).

### Input Metadata
- **school**: `"Đại học Bách Khoa"`
- **members**: `["Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Châu"]`
- **evidence**:
  - `ev-git`: GitHub repository (`https://github.com/CuongVo24/ReportSupporter`)
  - `ev-video`: Video Demo (`https://youtube.com/demo-video`)
  - `ev-deploy`: Deploy URL (`https://report-supporter.vercel.app`)

### Output Slide Outline & Timeline Allocation
* **Limit Seconds**: `600s` (10 minutes)
* **Total Estimated Duration**: `648s` (over limit: **Warning - Over Limit**)

| Slide ID | Section ID | Slide Title | Bullets | Evidence Refs | Estimated Duration | Assigned Speaker |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `sec-0-slide-0` | `sec-0` | Mở đầu | - Giới thiệu bối cảnh, mục tiêu và phạm vi đề tài. | None | 83s | Nguyễn Văn An (`sp-1`) |
| `sec-1-slide-0` | `sec-1` | Thành viên & Phân công | - Bảng phân công nhiệm vụ chi tiết cho các thành viên. | None | 87s | Nguyễn Văn An (`sp-1`) |
| `sec-2-slide-0` | `sec-2` | Triển khai | - Mô tả kiến trúc, công nghệ và cách hiện thực. | None | 83s | Nguyễn Văn An (`sp-1`) |
| `sec-3-slide-0` | `sec-3` | Kiểm thử | - Kịch bản kiểm thử và kết quả. | None | 75s | Trần Thị Bình (`sp-2`) |
| `sec-4-slide-0` | `sec-4` | Kết luận | - Tổng kết kết quả đạt được và hướng phát triển. | None | 84s | Trần Thị Bình (`sp-2`) |
| `sec-5-slide-0` | `sec-5` | Tài liệu tham khảo | - Sách, bài báo và tài liệu trực tuyến sử dụng trong đồ án. | None | 89s | Lê Hoàng Châu (`sp-3`) |
| `sec-6-slide-0` | `sec-6` | Minh chứng | - Liên kết GitHub, video demo, deploy. | `ev-git`, `ev-video`, `ev-deploy` | 123s | Lê Hoàng Châu (`sp-3`) |

### Speaker Block Allocation Summary
- **Nguyễn Văn An (`sp-1`)**: Slide 0, 1, 2 (3 slides, contiguous)
- **Trần Thị Bình (`sp-2`)**: Slide 3, 4 (2 slides, contiguous)
- **Lê Hoàng Châu (`sp-3`)**: Slide 5, 6 (2 slides, contiguous)

---

## 2. Lab Report Template (`lab-report`)

This sample shows the output for a chemistry/database laboratory report with 2 members and no evidence references.

### Input Metadata
- **school**: `"Đại học Bách Khoa"`
- **subject**: `"Hệ quản trị cơ sở dữ liệu"`
- **labNumber**: `"Bài thực hành số 1"`
- **members**: `["Phạm Văn Dũng", "Hoàng Minh Anh"]`
- **evidence**: None

### Output Slide Outline & Timeline Allocation
* **Limit Seconds**: `900s` (15 minutes)
* **Total Estimated Duration**: `608s` (over limit: **No**)

| Slide ID | Section ID | Slide Title | Bullets | Evidence Refs | Estimated Duration | Assigned Speaker |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `sec-0-slide-0` | `sec-0` | Mục tiêu | - Nêu rõ mục tiêu của bài thực hành thí nghiệm. | None | 83s | Phạm Văn Dũng (`sp-1`) |
| `sec-1-slide-0` | `sec-1` | Thành viên & Phân công | - Bảng phân công nhiệm vụ chi tiết cho các thành viên. | None | 87s | Phạm Văn Dũng (`sp-1`) |
| `sec-2-slide-0` | `sec-2` | Phương pháp | - Mô tả các bước tiến hành thực hiện thí nghiệm, công cụ sử dụng. | None | 92s | Phạm Văn Dũng (`sp-1`) |
| `sec-3-slide-0` | `sec-3` | Kết quả | - Bảng dữ liệu kết quả, sơ đồ, ảnh chụp màn hình minh họa kết quả. | None | 93s | Phạm Văn Dũng (`sp-1`) |
| `sec-4-slide-0` | `sec-4` | Thảo luận | - Phân tích kết quả, so sánh lý thuyết với thực tế thí nghiệm. | None | 91s | Hoàng Minh Anh (`sp-2`) |
| `sec-5-slide-0` | `sec-5` | Kết luận | - Đánh giá mức độ hoàn thành mục tiêu bài thực hành. | None | 85s | Hoàng Minh Anh (`sp-2`) |
| `sec-6-slide-0` | `sec-6` | Tài liệu tham khảo | - Sách hướng dẫn thực hành môn học... | None | 78s | Hoàng Minh Anh (`sp-2`) |

### Speaker Block Allocation Summary
- **Phạm Văn Dũng (`sp-1`)**: Slide 0, 1, 2, 3 (4 slides, contiguous)
- **Hoàng Minh Anh (`sp-2`)**: Slide 4, 5, 6 (3 slides, contiguous)

---

## 3. Evidence Link Reference Error Check (Warning Bullet Sample)

When an evidence reference in the markdown content points to a URL that has been deleted or is missing from the project evidence metadata list, ReportSupporter prepends a warning bullet warning the user.

### Input Markdown in Section "Triển khai"
```markdown
# Triển khai dự án

Chúng tôi đã deploy hệ thống lên trang web tại [Bản demo](https://broken-deploy-link-example.com/demo).
```

### Metadata Evidence List
```json
[]
```

### Generated Slide Bullets
1. "Chúng tôi đã deploy hệ thống lên trang web tại Bản demo."
2. `[Cảnh báo: Minh chứng đã bị xóa]`
