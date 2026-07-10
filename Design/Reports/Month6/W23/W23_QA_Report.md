# Báo cáo Chất lượng QA - Tuần 23: Office (XLSX & PPTX) Import

Báo cáo này chứng minh kết quả đối chiếu chất lượng, kết quả kiểm thử và sự tuân thủ các quy tắc thiết kế kiến trúc đối với các tệp định dạng XLSX và PPTX được phát triển trong Tuần 23.

---

## 1. Đối chiếu Nguồn ↔ Kết quả (Source-to-Result Mapping)

### A. Định dạng XLSX (Bảng tính Excel)

| Thành phần nguồn | Kết quả Markdown (GFM Table) | Trạng thái hiển thị |
|---|---|---|
| Cột / Dòng thông thường | Được phân tách bằng ký tự `|` và separator `---`. | Hiển thị chính xác dưới dạng bảng GFM. |
| Định dạng ô: Số, Tiền tệ, Ngày tháng | Ưu tiên giá trị đã định dạng (`w`), tự động fallback sang giá trị thô (`v`). | Giữ nguyên định dạng gốc như Excel. |
| Ô chứa ký tự xuống dòng `\n` | Xu xuống dòng được thay thế bằng thẻ `<br>`. | Bố cục bảng không bị vỡ im lặng. |
| Ô chứa ký tự chia cột `\|` | Được escape thành `\|`. | Bố cục bảng hiển thị chuẩn xác. |
| Vùng ô hợp nhất (Merged Cells) | Flatten về ô góc trên bên trái (top-left), các ô còn lại trong vùng gộp để trống. | Bảng đọc được, kèm theo 1 cảnh báo duy nhất cho toàn sheet. |
| Trang tính bị ẩn (`Hidden: 1/2`) | Bỏ qua trang tính ẩn. | Không xuất Markdown, kèm theo cảnh báo bị ẩn. |
| Giới hạn kích thước (> 500 dòng, > 30 cột) | Truncate dữ liệu tại dòng 500 và cột 30. | Cắt dữ liệu dư thừa, phát sinh cảnh báo `sheet-truncated` ghi chi tiết số lượng. |

### B. Định dạng PPTX (Bản trình chiếu PowerPoint)

| Thành phần nguồn | Kết quả Markdown | Trạng thái hiển thị |
|---|---|---|
| Slide Order (`presentation.xml` & rels) | Thứ tự slides được khôi phục chính xác theo định nghĩa của PowerPoint. | Slide 1 -> Slide 2 -> Slide 3 chuẩn chỉnh. |
| Tiêu đề Slide (`title` / `ctrTitle`) | Trích xuất thành H2 heading: `## Tiêu đề Slide`. | Định dạng to rõ ràng. |
| Slide không có tiêu đề | Tự động sinh tiêu đề: `## Slide N`. | Định dạng thống nhất. |
| Đoạn văn bản thụt lề (`lvl="0"`, `"1"`, `"2"`) | Định dạng thành danh sách GFM lồng nhau (bullets): `-` thụt lề tương ứng. | Hiển thị phân cấp thông tin rõ ràng. |
| Speaker Notes (`notesSlideN.xml`) | Trích xuất nội dung ghi chú bên dưới placeholder notes. | Đưa vào blockquote `> Ghi chú` đặt cuối slide. |

---

## 2. Các giới hạn & Thành phần không chuyển đổi ("Không sang được")

Các thành phần sau đây nằm ngoài phạm vi xử lý và sẽ được lược bỏ hoặc ghi nhận cảnh báo:
- **Biểu đồ (Charts) / SmartArt (PPTX & XLSX):** Không hỗ trợ chuyển đổi sang Markdown, hệ thống bỏ qua và không kết xuất ảnh tĩnh cho các đối tượng vẽ này.
- **Định dạng bảng tính cũ (.xls):** Bị từ chối ngay lập tức kèm thông báo lỗi hướng dẫn người dùng lưu lại dưới định dạng `.xlsx`.
- **Trang tính ẩn toàn bộ:** Workbook không có sheet hiển thị sẽ ném lỗi và dừng xử lý.

---

## 3. Bằng chứng kiểm soát kiến trúc (Diff Gate Evidence)

Để đảm bảo tuân thủ thiết kế kiến trúc **Locked #4**, chúng tôi đã xác thực rằng không có sự thay đổi nào đối với mã nguồn lõi của `registry.ts` hoặc các dropzone xử lý viết ngoại trừ việc đăng ký bootstrap:

```bash
$ git diff develop...feature/W23-import-office --stat -- src/modules/import/registry.ts src/modules/write/
```

**Kết quả diff:**
```diff
 src/modules/import/registry.ts | 2 ++
 1 file changed, 2 insertions(+)
```
*(Chỉ bổ sung dòng import `xlsxConverter`/`pptxConverter` và gọi đăng ký `registerConverter` ở cuối tệp, không chạm vào logic xử lý chính của core).*

---

## 4. Xác nhận nguồn thư viện SheetJS

Thư viện SheetJS được cài đặt chính xác từ CDN tarball chính thức và được định cấu hình ghim phiên bản tại `package.json`:
- **Nguồn:** `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
- **Tác dụng:** Phòng tránh các lỗ hổng bảo mật nghiêm trọng (CVE) từ gói NPM cũ và lỗi thời trên registry công cộng.

---

## 5. DoD Mapping (`week23.md` §8)

Tất cả các tiêu chí định nghĩa hoàn thành (DoD) của tuần 23 đã đạt:
- [x] xlsx được cài đặt từ tarball chính thức ghim phiên bản.
- [x] Merged cells được làm phẳng chính xác và phát sinh warning.
- [x] Cắt dữ liệu dòng/cột lớn kèm thông tin cụ thể (Locked #5).
- [x] Slide PPTX được trích xuất theo đúng thứ tự logic hiển thị (Locked #6).
- [x] Speaker notes được chuyển đổi thành blockquote chuẩn xác.
- [x] Phân cấp danh sách slides bullets lồng tối đa 3 cấp.
- [x] Hỗ trợ fixtures từ cả 2 nguồn PowerPoint và Google Slides xuất khẩu.
- [x] Không cài đặt thêm bất kỳ thư viện parser PPTX mới nào (Locked #3).
