# Public Demo & Beta Evidence - ReportSupporter

Tài liệu này hướng dẫn cách chạy bản thử nghiệm (Public Demo) của hệ thống **ReportSupporter** và lưu trữ các minh chứng (Evidence) hoàn thành giai đoạn thử nghiệm (Beta).

---

## 🚀 Hướng dẫn chạy Demo cục bộ (Local Demo)

Hệ thống được thiết kế theo triết lý **Workspace-first**, trang đầu tiên khi truy cập là không gian làm việc trực tiếp, không qua trang quảng cáo/landing page.

### Các bước khởi chạy:
1. **Cài đặt thư viện**:
   ```bash
   npm install
   ```
2. **Khởi động môi trường phát triển**:
   ```bash
   npm run dev
   ```
3. **Truy cập**: Mở trình duyệt và truy cập địa chỉ [http://localhost:3000](http://localhost:3000).

---

## 🔒 Kiểm chứng E2E với AI OFF (No-AI Demo)

ReportSupporter hoạt động đầy đủ chức năng cốt lõi và không phụ thuộc vào AI (AI là tính năng tùy chọn thêm). Khi AI tắt hoặc chưa được cấu hình:
- Trình biên tập Markdown hoạt động bình thường, hỗ trợ phím tắt và kéo thả ảnh.
- Bộ kiểm tra định dạng (Quality Checker) hoạt động tức thời, chấm điểm sẵn sàng và tìm lỗi định dạng.
- Hệ thống hỗ trợ quản lý minh chứng (Evidence Kit) và chèn mã QR tự động.
- Tính năng xuất bản (Export) ra 3 định dạng HTML, PDF, DOCX hoạt động chính xác.
- Giao diện thuyết trình (Slides Outline, Speaker Script, Q&A) tự động sinh dàn bài thuyết trình từ nội dung Markdown thô.

---

## 📁 Danh sách tệp tin xuất bản mẫu (Export Samples)

Các tệp tin mẫu đã được xuất bản thành công từ 3 mẫu tài liệu chính:

### 1. Mẫu Đồ án Phần mềm (Software Project Report)
- **HTML**: `Design/Reports/Month3/W12/samples/software-project.html`
- **PDF**: `Design/Reports/Month3/W12/samples/software-project.pdf`
- **DOCX**: `Design/Reports/Month3/W12/samples/software-project.docx`

### 2. Mẫu Báo cáo Thực hành (Lab Report)
- **HTML**: `Design/Reports/Month3/W12/samples/lab-report.html`
- **PDF**: `Design/Reports/Month3/W12/samples/lab-report.pdf`
- **DOCX**: `Design/Reports/Month3/W12/samples/lab-report.docx`

### 3. Mẫu Báo cáo Thực tập (Internship Report)
- **HTML**: `Design/Reports/Month3/W12/samples/internship-report.html`
- **PDF**: `Design/Reports/Month3/W12/samples/internship-report.pdf`
- **DOCX**: `Design/Reports/Month3/W12/samples/internship-report.docx`

*(Các tệp tin mẫu trên đều chứa định dạng tiêu chuẩn, đánh số phân cấp tiêu đề tự động, và phụ lục minh chứng đính kèm mã QR).*
