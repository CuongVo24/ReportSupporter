# 📖 Báo Cáo QA & Đánh Giá Chất Lượng — Tuần 21

> **Giai đoạn:** Phase 5 — Universal Import (Tuần 21)
> **Branch:** `feature/W21-import-foundation`

---

## 🧭 Khung Tiêu Chí Đối Chiếu & DoD Map

Bảng đối chiếu tiến độ với đặc tả **Definition of Done (DoD)** của Tuần 21 (`Design/RoadMap/week_21-22-23-24/week21.md` §8):

| # | Tiêu chí DoD | Trạng thái | Minh chứng |
|---|---|---|---|
| 1 | `npm run lint` + `typecheck` + `build` xanh; Vitest xanh toàn bộ | ✅ Đạt | Toàn bộ 4 gates đều xanh (`build_output.txt`). |
| 2 | Registry định tuyến chính xác (extension + MIME, max 50MB, thông báo lỗi định dạng lạ) | ✅ Đạt | Trách nhiệm xử lý trong `registry.ts` và `UniversalImportDropzone.tsx`. |
| 3 | Đường import `.md` cũ hoạt động nguyên trạng | ✅ Đạt | Regression test `markdown-import.test.ts` vẫn xanh 100%. |
| 4 | DOCX fixtures: heading/list/bảng/ảnh chuyển đổi đúng; ảnh thành `ReportAsset` | ✅ Đạt | Snapshot test trọn flow trong `import-flow.test.ts` khớp dữ liệu. |
| 5 | Các heading sau import không chứa số chương cứng | ✅ Đạt | `stripHeadingNumbers` loại bỏ thành công dạng "1.", "1.1", "1.2.3". |
| 6 | Ngăn chặn rò rỉ `rehype-remark`, `remark-stringify`, `mammoth` ra ngoài module Import | ✅ Đạt | Ràng buộc tự động qua `module-boundary.test.ts`. |
| 7 | Cập nhật tài liệu QA và build log đầy đủ | ✅ Đạt | Lưu trữ tại thư mục này (`Design/Reports/Month6/W21/`). |

---

## 📊 Kết Quả Đối Chiếu Thực Tế Trực Quan (Fixtures)

Bộ fixtures thực tế được dịch chuyển từ các văn bản mẫu tiếng Việt thực tế:

### 1. `vn_mon_hoc_report.docx` (Báo cáo môn học mẫu)
*   **Mô tả nguồn:** Tài liệu Word chứa cấu trúc báo cáo chuẩn: Title, Heading 1, 2, 3 đánh số cứng dạng `I.`, `1.1`, `1.1.1`, danh sách có dấu chấm tròn, bảng biểu điểm số.
*   **Kết quả chuyển đổi:**
    *   Markdown & sections được phân tách sạch đẹp.
    *   Các số chương cứng như `1.1 Cơ sở lý thuyết` được làm sạch thành `## Cơ sở lý thuyết`.
    *   Bảng biểu chuyển thành bảng GitHub Flavored Markdown (GFM) chính xác.
*   **Cảnh báo phát sinh:** 0 cảnh báo.

### 2. `vn_anh_nhung_report.docx` (Báo cáo nhúng hình ảnh)
*   **Mô tả nguồn:** Báo cáo đồ án có chứa các hình ảnh đồ hoạ nhúng trực tiếp dạng base64 trong file Word, bao gồm cả ảnh dung lượng lớn.
*   **Kết quả chuyển đổi:**
    *   Các ảnh nhỏ hơn 5MB được trích xuất thành `ReportAsset` base64 độc lập, lưu vào IndexedDB.
    *   Các tham chiếu hình ảnh trong Markdown được ghi lại thành dạng `![alt](asset:<uuid>)`.
*   **Cảnh báo phát sinh:**
    *   `image-skipped`: Phát sinh đối với ảnh vượt quá giới hạn 5MB, thay thế link ảnh bằng `image-skipped` để tránh crash/tràn bộ nhớ IndexedDB của trình duyệt.

### 3. `vn_track_changes_report.docx` (Báo cáo bật chế độ theo dõi sửa đổi)
*   **Mô tả nguồn:** Tài liệu có bật chế độ Track Changes (có văn bản bị gạch bỏ và thêm mới chưa được Accept) và chứa một số heading đánh số cứng.
*   **Kết quả chuyển đổi:**
    *   Mammoth tự động flatten văn bản theo chế độ edit cuối cùng.
    *   Các số chương cứng được strip sạch.
*   **Cảnh báo phát sinh:**
    *   `unsupported-element`: Cảnh báo đối với các thành phần track-changes thô mà mammoth chuyển đổi không giữ được toàn vẹn style gốc.

---

## 🔒 Giới Hạn & Nội Dung Không Sang Được (Warnings & Limitations)

> [!WARNING]
> Theo đúng tinh thần trung thực của `VibeCode.md` Locked #6, dưới đây là các giới hạn kỹ thuật đã được ghi nhận:

1.  **Dung lượng ảnh nhúng:** Hệ thống từ chối các ảnh nhúng base64 có dung lượng ước tính > 5MB để bảo vệ cơ sở dữ liệu IndexedDB local của người dùng. Cảnh báo `image-skipped` được hiển thị rõ ràng trên màn hình.
2.  **Định dạng phông chữ tinh xảo (Fidelity):** Mọi phông chữ Times New Roman, màu chữ, kích cỡ chữ tùy biến trong Word đều bị lược bỏ để chuyển về Markdown thuần khiết. Đây là thiết kế chủ ý (by-design) để nhường quyền quyết định hiển thị cho module Format A4.
3.  **Bảng biểu quá phức tạp:** Các ô merge ngang/dọc phức tạp (merged cells) của Word sẽ được Mammoth flatten phẳng để giữ nội dung thay vì giữ nguyên layout bảng bị vỡ.

---

## 🛡️ Boundary Gate Enforcement

Để bảo đảm tính tách biệt kiến trúc, bài kiểm tra tự động `module-boundary.test.ts` quét toàn bộ dự án định kỳ:
-   **Quy tắc:** Chỉ duy nhất thư mục `src/modules/import/` được phép import từ `mammoth`, `rehype-remark`, và `remark-stringify`.
-   **Đánh giá:** Đạt. CI/Vitest sẽ báo lỗi đỏ lập tức nếu có lập trình viên nào cố tình import thư viện dịch ngược này ở ngoài biên giới module.

---

## 🏆 Đánh Giá Chung

Module Import của Tuần 21 đã sẵn sàng bàn giao cho các tuần tiếp theo (PDF/XLSX/PPTX) nhờ có bộ xương registry và dropzone thống nhất, đồng thời giữ nguyên vẹn luồng làm việc với tệp `.md` cũ.
