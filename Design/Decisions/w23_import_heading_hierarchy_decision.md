# Quyết định Thiết kế — Phân cấp Heading khi Nhập tài liệu (Import Heading Hierarchy)

## 1. Bối cảnh & Vấn đề
Khi nhập file tài liệu (`.md`, `.docx`, `.pdf`, v.v.), hệ thống tự động quét các thẻ tiêu đề (heading `# H1`, `## H2`, `### H3`) và tách mỗi tiêu đề cùng nội dung tương ứng thành một mục riêng biệt trong danh sách mục lục (Navigation).
Hiện tại, danh sách này được làm phẳng (flat-section list): tiêu đề `## H2` cũng được tách thành một mục top-level tương tự như `# H1` thay vì lồng thành mục con (sub-section). Điều này dẫn đến:
- Mục lục hiển thị phẳng ngang hàng (ví dụ: "Chương Một", "Phần 1.1", "Chương Hai" đều là mục cấp cao).
- Ở màn hình Xem trước nội dung nhập (Import Preview), giao diện hiển thị nhãn "H+0" (chênh lệch cấp heading) cho phép tăng/giảm cấp nhưng gây bối rối cho người dùng do không có giải thích rõ ràng.

## 2. Quyết định (Đã chọn Nhánh A)
**Nhánh (a) — Flat-section là chủ đích thiết kế hiện tại của hệ thống.**

### Lý do lựa chọn:
1. **Kiến trúc Dữ liệu Đơn giản:** Mô hình lưu trữ và quản lý tài liệu hiện tại của ứng dụng được xây dựng hoàn toàn dựa trên danh sách mục phẳng (`ReportSection[]` lưu trong `ReportProject`). Việc thay đổi sang danh sách lồng cấp (nested sections) đòi hỏi phải sửa đổi cấu trúc dữ liệu, cơ chế lưu trữ (localstorage/snapshots), bộ kéo thả sắp xếp lại (DND), cơ chế chấm điểm sẵn sàng (checker), và bộ máy sinh tệp xuất bản (TOC/DOCX/HTML). Đây là sự thay đổi IA vô cùng lớn và phức tạp, vượt quá phạm vi khắc phục lỗi hồi quy của tuần W23.
2. **Quy trình Biên tập Phân mảnh:** Ứng dụng khuyến khích người dùng biên tập tài liệu theo các phần độc lập. Sau khi xuất bản, hệ thống sẽ tự động gộp các phần và sinh mục lục có phân cấp hoàn chỉnh (nhờ cấu trúc heading thực tế trong văn bản). Do đó, việc lưu trữ phẳng là hợp lý để đơn giản hóa giao diện viết bài.

### Kế hoạch Triển khai (W23/W24):
1. **Giải thích nhãn "H+0":** Thay thế ký hiệu viết tắt kỹ thuật "H+0" bằng nhãn thân thiện hơn hoặc tooltip giải thích cụ thể:
   - Thay vì nhãn "H+0", "H+1", "H-1" khó hiểu, có thể hiển thị trực tiếp cấp độ heading kết quả (ví dụ: `Cấp: H1`, `Cấp: H2`).
   - Thêm tooltip giải thích cho các nút tăng/giảm cấp tiêu đề.
2. **Bổ sung tùy chọn gộp khi Import (Feature W24+):** Thiết kế giao diện nhập cho phép người dùng tùy chọn chỉ tách theo tiêu đề cấp lớn (ví dụ: chỉ tách khi gặp `# H1`), các tiêu đề con cấp thấp hơn sẽ được gộp chung vào nội dung của mục cha thay vì tách phẳng ra toàn bộ.
