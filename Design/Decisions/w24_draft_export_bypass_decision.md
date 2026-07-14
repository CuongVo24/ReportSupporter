# Quyết định Thiết kế — Có Cho Phép "Xuất Bản Nháp" Bỏ Qua P0 (Watermark DRAFT)?

## 1. Bối cảnh & Vấn đề
Khi xuất bản báo cáo (HTML, PDF, DOCX), nếu báo cáo còn bất kỳ lỗi nghiêm trọng (P0) nào (ví dụ: thiếu minh chứng link github bắt buộc, thiếu link video/demo/deploy, hoặc có hình ảnh cục bộ chưa được nhúng), hệ thống sẽ chặn cứng việc xuất bản.
Điều này dẫn đến phản hồi từ người dùng:
- Trong quá trình soạn thảo dở dang, sinh viên không thể xuất thử file Word/PDF để kiểm tra bố cục trang, lề trang, hay định dạng in ấn thực tế.
- Việc chặn cứng cả luồng xem thử gây cảm giác khó chịu và bất tiện cho quy trình làm việc.

Tuy nhiên, nếu nới lỏng gate preflight hoặc tạo ra "Đường xuất nháp" không được kiểm soát chặt chẽ, sinh viên có thể vô tình nộp nhầm bản in nháp còn lỗi nghiêm trọng này lên hệ thống chấm bài, phá hỏng mục tiêu bảo vệ chất lượng bản nộp của gate W23-A.

## 2. Quyết định (Đã chọn Nhánh A)
**Nhánh (a) — Giữ nguyên gate P0 cứng. Người dùng sử dụng Preview trực tiếp trong ứng dụng để kiểm tra bố cục. Bổ sung hướng dẫn microcopy trực quan tại Dialog chặn.**

### Lý do lựa chọn:
1. **Bảo đảm chất lượng tuyệt đối của Bản nộp:** Tránh mọi nguy cơ sinh viên nộp nhầm tệp tin thiếu minh chứng bắt buộc lên hệ thống (điều này dẫn đến trượt môn lập tức). Việc giữ gate chặn cứng là biện pháp bảo vệ bắt buộc và tối cao.
2. **Preview trong ứng dụng đã được tối ưu hóa:** Ứng dụng đã cung cấp chế độ xem trước thời gian thực (Preview Pane) có khả năng mô phỏng bố cục rất chính xác. Đặc biệt ở W24 Fix (A), các lỗi ảnh vỡ chưa nhúng đã được xử lý hiển thị placeholder sạch sẽ và an toàn, chặn hoàn toàn các yêu cầu mạng lỗi. Do đó, người dùng có thể hoàn toàn kiểm tra bố cục, cấu trúc, và định dạng in ấn trực tiếp ngay trong app mà không cần thiết phải sinh file xuất bản nháp.
3. **Tránh làm phức tạp hoá quy trình (Over-engineering):** Nhánh (b) đòi hỏi xây dựng thêm cơ chế chèn watermark chéo trang phức tạp, xử lý hậu tố tên file `-NHAP`, lọc tách lịch sử xuất bản trong DB, và phân loại lại hệ thống lỗi P0. Việc này nằm ngoài phạm vi sửa lỗi và làm tăng độ phức tạp của mã nguồn một cách không cần thiết.

### Kế hoạch Triển khai Polish (W24):
1. **Cải tiến microcopy tại Dialog chặn xuất bản:**
   - Thay thế các thông báo kỹ thuật khô khan bằng hướng dẫn chi tiết, thân thiện.
   - Chỉ rõ cho người dùng: *"Bạn vẫn có thể sử dụng khung xem trước (Preview) trực tiếp trong ứng dụng để kiểm tra bố cục trang in một cách nhanh chóng và chính xác mà không cần xuất bản tệp."*
2. **Bổ sung liên kết/nút bấm nhanh hoặc hướng dẫn:**
   - Hướng dẫn người dùng tập trung sửa các lỗi P0 hiển thị trong tab **Soát lỗi** để nhanh chóng mở khoá tính năng xuất bản chính thức.
