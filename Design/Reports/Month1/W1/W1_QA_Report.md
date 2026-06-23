# Báo cáo Đảm bảo Chất lượng Tuần 1 (Week 1 QA Report)

- **Nhánh Git (Branch):** `feature/W1-project-bootstrap`
- **Commit cha gần nhất:** `12967467a7f9f63b580c9d8a90b940e30918adee`
- **Thời gian lập báo cáo:** 2026-06-23

---

## 1. Kết quả kiểm tra chất lượng tự động (Quality Gates)

Tất cả các chất lượng tự động (Quality Gates) đều đã vượt qua thành công mà không có lỗi hay cảnh báo:

- **TypeScript Typecheck (`npm run typecheck`):** Thành công (Green).
- **Linter (`npm run lint`):** Thành công (Green - 0 errors, 0 warnings).
- **Unit Tests (`npm test`):** Thành công (Green - 21/21 tests passed).
- **Production Build (`npm run build`):** Thành công (Green - Tệp build được tối ưu hóa thành công).
  - Chi tiết build log được ghi nhận tại [build_output.txt](file:///e:/ReportSupporter/Design/Reports/Month1/W1/build_output.txt).

---

## 2. Kết quả kiểm tra thủ công (Manual Acceptance Checks)

Các tính năng lõi của Tuần 1 đã được kiểm thử trực tiếp trên môi trường local:

- **Giao diện làm việc chính (Workspace-first UI):** Route `/` render trực tiếp giao diện Workspace, không thông qua trang landing page tiếp thị.
- **Biên tập & Xem trước (Edit -> Preview):** Textarea kiểm soát giá trị nhập liệu Markdown và cập nhật ngay lập tức sang màn hình xem trước (Preview Pane).
- **Sao lưu nháp tự động (Autosave):** Thay đổi nội dung soạn thảo được tự động ghi nhận và đồng bộ xuống IndexedDB thông qua thư viện `idb`, dữ liệu được khôi phục chính xác khi tải lại trang.
- **Bảng kiểm lỗi (Checker Panel):** Nút kiểm lỗi nhận diện chính xác các lỗi văn bản thô (placeholder `TODO`/`lorem ipsum`, code block thiếu khai báo ngôn ngữ) và nhóm chúng lại theo severity để hiển thị trên panel.
- **Export Stubs:**
  - `exportHtml` hoạt động chính xác, xuất ra file HTML đầy đủ thông tin metadata, sắp xếp các section đúng theo trường `order` và thực hiện escape HTML an toàn cho toàn bộ nội dung người dùng nhập.
  - `exportPdf` và `exportDocx` trả về kết quả lỗi hợp lệ chứa thông tin `"not implemented until W4"` thay vì throw lỗi làm gián đoạn chương trình.

---

## 3. Các giới hạn đã biết của W1 & Ghi chú chuyển giao W2/W4

- **Trình Checker ở W1:** Chỉ chạy kiểm tra văn bản thô đồng bộ trên main thread thay vì chạy background Web Worker với AST. Bộ parser remark/rehype và AST checker engine đầy đủ sẽ được phát triển ở Tuần 3.
- **Trình Biên tập (Editor):** Đang sử dụng thẻ textarea tiêu chuẩn được kiểm soát (controlled textarea). Sẽ chuyển sang Rich Editor ở Tuần 2.
- **Bộ máy Export (Export Services):** Hiện tại PDF và DOCX chỉ là các stub placeholder trả về kết quả lỗi dạng đối tượng `ExportResult` để cố định giao tiếp (interface contract). Việc render PDF bằng browser print hoặc Puppeteer và tạo tệp DOCX thực tế sẽ được thực hiện vào Tuần 4.
