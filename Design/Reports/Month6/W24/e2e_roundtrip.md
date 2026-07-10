# E2E Round-trip Scenario & Verification Report

- **Lane / Week:** Core / Month 6 / W24
- **Date:** 2026-07-10
- **Status:** PASS

Tài liệu này ghi lại các bước thực hiện kịch bản kiểm thử khép kín (End-to-End Round-trip) cho hệ thống Ingestion (Universal Import) của ReportSupporter.

---

## Kịch bản chính: Luồng tài liệu chuẩn (DOCX, PDF, XLSX, PPTX)

### Bước 1: Kéo thả nhiều tệp tin (Batch Ingestion)
- **Hành động:** Kéo thả đồng thời 4 tệp tin mẫu từ thư mục `Design/ContractForAI/Core/month6/W23` và `W21`:
  1. `report-word.docx` (DOCX mẫu)
  2. `report-word.pdf` (PDF mẫu)
  3. `spreadsheet.xlsx` (Excel mẫu)
  4. `defense-ppt.pptx` (PowerPoint mẫu)
- **Kết quả ghi nhận:**
  - Giao diện `UniversalImportDropzone` lập tức hiển thị 4 tệp tin trong hàng đợi.
  - Các tệp tin được phân phối chạy nền trong dedicated Web Workers (`import.worker.ts`).
  - Thanh tiến trình per-file cập nhật động: `Đang đọc các dòng của bảng...`, `Trích xuất văn bản từ PDF...` kèm phần trăm tăng dần.
  - Cả 4 tệp tin chuyển sang trạng thái xanh lá (Success) lần lượt.

### Bước 2: Xem trước và tinh chỉnh cấu trúc (Preview Dialog)
- **Hành động:** Dialog xem trước (`ImportPreviewDialog`) tự động mở ra với 4 tab đại diện cho 4 tệp tin:
  - **Tab report-word.docx:** Chọn chế độ nhập "Chèn thêm vào cuối" (append).
  - **Tab report-word.pdf:** Nhấn nút giảm cấp (decrease level) H1 -> H2 cho chương thứ 2; tiêu đề con tự động cascade lùi cấp tương ứng.
  - **Tab spreadsheet.xlsx:** Chọn bỏ chọn (exclude) trang tính "Sheet2" do không có nội dung cần thiết; bảng hiển thị dạng GFM Grid trong PreviewPane.
  - **Tab defense-ppt.pptx:** Xem danh sách slide. Trích xuất ghi chú slide (speaker notes) hiển thị đúng dưới dạng blockquote.
- **Phân tích lỗi (IssuesPanel):**
  - Panel bên phải hiển thị 2 cảnh báo cấu trúc suy đoán tiêu đề (`heading-guessed`) của file PDF và 1 cảnh báo bảng bị lệch cột (`table-flattened`) của file Excel.
- **Kết quả ghi nhận:**
  - Mọi thao tác loại trừ/tăng giảm cấp tiêu đề lập tức đồng bộ sang khung xem trước markdown bên trái (`PreviewPane`) mà không hề giật lag.

### Bước 3: Commit và Chỉnh sửa trong Workspace
- **Hành động:** Nhấn nút `Nhập báo cáo (3 cảnh báo)` trên Dialog:
  - Dữ liệu của 4 tệp tin được ghép tuần tự và nạp vào báo cáo chính trong workspace.
  - Mở workspace soạn thảo và tiến hành viết thêm 1 đoạn văn bản giới thiệu ở đầu chương DOCX.
- **Kết quả ghi nhận:**
  - Nội dung được nạp nhanh chóng, cấu trúc Markdown hiển thị chuẩn xác trong editor.

### Bước 4: Xuất bản báo cáo (Export Round-trip)
- **Hành động:** Gọi tính năng Export của ReportSupporter để xuất tài liệu ra 3 định dạng: HTML, PDF, và DOCX.
- **Kết quả ghi nhận:**
  - Cả 3 file xuất bản thành công.
  - Mở các file xuất bản bằng mắt thường: cấu trúc tiêu đề, danh sách, bảng biểu và blockquote được giữ nguyên vẹn như tài liệu gốc trước khi import. Luồng khép kín hoạt động hoàn hảo.

---

## Kịch bản phụ: PDF quét ảnh & Nhận diện chữ (OCR)

### Bước 1: Kéo thả PDF quét ảnh (Scan Detection)
- **Hành động:** Kéo thả tệp tin scan `scan-vn.pdf` vào dropzone.
- **Kết quả ghi nhận:**
  - File PDF được xử lý hoàn tất. Dialog xem trước hiển thị tab `scan-vn.pdf`.
  - Trên panel Cảnh báo (WarningsPanel) hiển thị rõ cảnh báo đỏ: `Trang 1: bản scan — chưa trích được chữ`.
  - Trong PreviewPane hiển thị placeholder: `> [Trang 1: bản scan — chưa trích được chữ. Thử OCR (experimental) ở bản W24.]`

### Bước 2: Chạy OCR (Thử nghiệm cục bộ)
- **Hành động:**
  1. Click bật checkbox `Thử nghiệm nhận diện chữ (OCR) (experimental)` ở khung cấu hình.
  2. Nút `[🔍 Thử OCR (experimental)]` lập tức xuất hiện ngay dưới tên section `Trang 1` trong SectionControls.
  3. Click vào nút "Thử OCR".
- **Kết quả ghi nhận:**
  - Web Worker khởi tạo cục bộ, tải file WASM và dữ liệu ngôn ngữ cục bộ `/ocr/*` (0 cuộc gọi mạng ra internet).
  - Trạng thái cập nhật per-section: `Đang nhận diện chữ... (35%)`.
  - Khi hoàn thành, placeholder biến mất; văn bản chữ tiếng Việt có dấu được trích xuất và hiển thị chuẩn xác trong PreviewPane; tiêu đề tiếng Việt in hoa được đoán thành công và gắn tag `<!-- heading-guessed -->`.
  - Danh sách cảnh báo tự động lọc bỏ cảnh báo scanned-page của trang vừa chạy OCR.

### Bước 3: Hủy OCR (Cancel Flow)
- **Hành động:** Chạy lại tiến trình OCR và click vào nút `Hủy` khi tiến độ đạt 45%.
- **Kết quả ghi nhận:**
  - Tiến trình dừng ngay lập tức.
  - Worker bị terminate và giải phóng CPU thread.
  - Trạng thái trả về nút bấm "Thử OCR" ban đầu, không xảy ra crash hoặc đơ giao diện.
