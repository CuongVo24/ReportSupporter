# Báo cáo Kiểm tra Xuất bản Đa Mẫu tài liệu (Export Validation Report)

Báo cáo này tài liệu hóa kết quả kiểm định xuất bản (HTML/PDF/DOCX) trên 3 mẫu tài liệu chính: **Báo cáo đồ án phần mềm (Software Project)**, **Báo cáo thực hành (Lab Report)**, và **Báo cáo thực tập (Internship Report)**.

---

## 🔎 Kịch bản Kiểm tra Xuất bản

Các tệp tin được xuất bản từ các mẫu tài liệu trên đã được đối chiếu chéo về tính nhất quán (parity) giữa giao diện xem trước (preview) và các định dạng xuất bản. Toàn bộ các kiểm tra này đã được tự động hóa bằng các kiểm thử thực tế trong [multi-template-validation.test.ts](file:///E:/ReportSupporter/src/modules/export/multi-template-validation.test.ts):

1. **Cover Page Parity**: Trang bìa hiển thị đầy đủ tên trường, tiêu đề báo cáo, học phần, thông tin giảng viên hướng dẫn và thành viên thực hiện. Các thành viên được tách dòng đúng cách trong DOCX. Tự động xác thực thông qua so khớp từ khóa metadata (Trường, Giảng viên, Thành viên) trong HTML, bản in PDF (`*.print.html`), và cấu trúc DOCX.
2. **Page-Break Parity**: Ngắt trang chính xác giữa trang bìa, mục lục và các phần nội dung chính (Section H1). Xác thực thông qua việc dò tìm sự xuất hiện của marker `class="page-break"` phân tách đúng phân đoạn.
3. **Caption Numbering Parity**: Tiêu đề hình ảnh và bảng biểu được đánh số đúng thứ tự phân cấp hoặc liên tục theo cấu hình, không bị lệch hoặc mất tiêu đề ở các định dạng khác nhau. Tự động kiểm tra việc tiêm tự động định danh `Hình 1: ...` và `Bảng 1: ...` vào kết quả xuất ra HTML, PDF (`*.print.html`), và cấu trúc DOCX.

---

## 📊 Ma trận Kết quả Kiểm tra (Validation Matrix)

| Mẫu tài liệu (Template) | Định dạng HTML | Định dạng PDF (Browser Print) | Định dạng Word (DOCX) | Trạng thái Parity |
|---|---|---|---|---|
| **Software Project Report** | ✅ Đạt (Tự động) | ✅ Đạt (Tự động) | ✅ Đạt (Tự động) | Đạt chuẩn nhất quán |
| **Lab Report** | ✅ Đạt (Tự động) | ✅ Đạt (Tự động) | ✅ Đạt (Tự động) | Đạt chuẩn nhất quán |
| **Internship Report** | ✅ Đạt (Tự động) | ✅ Đạt (Tự động) | ✅ Đạt (Tự động) | Đạt chuẩn nhất quán |

---

## 🛠️ Lệch phát hiện & Localized Fixes

- **Lệch phát hiện**: Không phát hiện lỗi lệch cấu trúc hoặc lỗi biên dịch nghiêm trọng nào giữa các định dạng xuất bản trên cả 3 template. Toàn bộ các xác nhận chất lượng (Cover Page, Page-Break, Caption Numbering) được kiểm chứng tự động qua tệp tin test [multi-template-validation.test.ts](file:///E:/ReportSupporter/src/modules/export/multi-template-validation.test.ts) đạt kết quả 100% Passed.
- **Localized Fixes**: Không yêu cầu sửa đổi mã nguồn do tính năng xuất bản đã hoạt động ổn định và chính xác theo đúng cấu trúc CanonicalTypes đã thỏa thuận.

---

## 🏁 Kết luận

Cơ chế xuất bản đa mẫu tài liệu của ReportSupporter đạt tiêu chuẩn ổn định cho phiên bản thử nghiệm (Beta). Không có lỗi phá vỡ tính bất biến hoặc làm sai lệch nội dung báo cáo.
