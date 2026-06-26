# Báo cáo Visual QA — Tuần 15 Day 2

Ghi nhận kết quả rà soát chất lượng hiển thị (Visual QA) cho toàn bộ workspace của ReportSupporter theo các tiêu chuẩn trong hướng dẫn Art Direction (`Design/Frontend/0.ArtDirection.md` §11 & §6).

---

## 🧭 Khung tiêu chí rà soát

Mỗi màn hình/panel được đối chiếu qua 6 câu hỏi tự đánh giá (§11):
1. **Tính từ thép (§1):** Màn hình phục vụ tính từ nào (Calm - Điềm tĩnh / Focused - Tập trung / Trustworthy - Đáng tin)?
2. **Hành động chính (§3.6):** Có duy nhất 1 hành động chính (primary), các hành động khác đã lùi xuống secondary/ghost?
3. **Trạng thái thiết kế (§3.3):** Đã thiết kế đủ các trạng thái (empty, loading, error, disabled) chưa?
4. **Ý nghĩa của màu (§3.2 / §7):** Mọi màu sắc có mang ngữ nghĩa cụ thể (severity/primary) hay dùng để trang trí?
5. **Anti-patterns (§6):** Có vi phạm lỗi thiết kế nào (card dày đặc, gradient sặc sỡ, emoji thô trong UI vận hành...) không?
6. **Thành phần dùng chung (§3.7):** Đã sử dụng đúng các primitives và patterns dùng chung chưa?

---

## 📊 Kết quả đánh giá & Khắc phục chi tiết theo màn

### 1. App Shell (Khung ứng dụng tổng thể)
*   **Trạng thái:** `PASS`
*   **Đánh giá theo §11:**
    1.  *Tính từ:* **Calm** và **Trustworthy** — Thiết kế chia cột rõ ràng, nền slate nhạt làm nền tảng, đường viền mảnh `slate-300` làm biên giới thay vì đổ bóng dày.
    2.  *Hành động chính:* Header tối giản hiển thị tên dự án, trạng thái lưu thầm và nút "Tạo report".
    3.  *Trạng thái:* Hỗ trợ đóng mở cột trái/phải linh hoạt, có chế độ collapsed rail khi thu nhỏ.
    4.  *Màu sắc:* Slate trung tính ngự trị (~90%), chỉ dùng màu xanh primary cho trạng thái active.
    5.  *Anti-pattern:* Không vi phạm.
    6.  *Component chung:* Sử dụng layout mẫu từ `AppShell.md`.

---

### 2. Màn soạn thảo (Write Panel)
*   **Trạng thái:** `FIXED` (Đã sửa lỗi emoji)
*   **Đánh giá theo §11:**
    1.  *Tính từ:* **Focused** — Khung soạn thảo Markdown rộng rãi, font chữ mono với line-height `1.6` hỗ trợ gõ lâu không mỏi.
    2.  *Hành động chính:* Viết và chỉnh sửa văn bản. Các phím hỗ trợ AI lùi xuống dưới thanh bar phụ.
    3.  *Trạng thái:* Hỗ trợ loading viết lại, tone giọng.
    4.  *Màu sắc:* Giữ màu trung tính slate, không lạm dụng màu sắc trong trình soạn thảo.
    5.  *Anti-pattern:* Đã loại bỏ hoàn toàn các emoji thô (`✨`, `⏳`, `⚠️`, `↩️`) trong thanh hỗ trợ AI (`AiAssistBar.tsx` và `UserControlBar.tsx`), thay thế bằng các icon vector Lucide (`Sparkles`, `AlertTriangle`, `RotateCcw`) và các chuỗi trạng thái text sạch.
    6.  *Component chung:* Tích hợp trình soạn thảo CodeMirror 6 theo đặc tả.

---

### 3. Người soát (Checker Panel)
*   **Trạng thái:** `PASS`
*   **Đánh giá theo §11:**
    1.  *Tính từ:* **Trustworthy** — Bảng hiển thị lỗi và cảnh báo phân cấp rõ ràng theo severity, có điểm sẵn sàng nộp (readiness score) trực quan để đo đạc tiến độ chính xác.
    2.  *Hành động chính:* Nút chạy soát báo cáo (primary).
    3.  *Trạng thái:* Đầy đủ trạng thái: trước khi soát (empty state chỉ rõ nhiệm vụ), đang soát (loading), và kết quả soát (danh sách lỗi hoặc success state khi sạch lỗi).
    4.  *Màu sắc:* Sử dụng bộ màu chức năng severity chuẩn của hệ thống (`--rs-color-severity-error`, `--rs-color-severity-warning`, `--rs-color-severity-info`).
    5.  *Anti-pattern:* Không dùng emoji trong danh sách lỗi hay badge.
    6.  *Component chung:* Sử dụng primitive `Badge` và `SuccessState` tiêu chuẩn.

---

### 4. Xuất bản (Export Panel)
*   **Trạng thái:** `PASS`
*   **Đánh giá theo §11:**
    1.  *Tính từ:* **Trustworthy** — Cung cấp cấu hình chính xác cho các tài liệu in, hiển thị danh sách định dạng đầu ra (HTML, PDF, DOCX).
    2.  *Hành động chính:* Nút "Xuất bản" rõ ràng.
    3.  *Trạng thái:* Trạng thái cấu hình chi tiết (dialog), danh sách lịch sử tệp đã xuất bản.
    4.  *Màu sắc:* Slate làm nền, màu primary cho hành động xuất bản.
    5.  *Anti-pattern:* Không vi phạm.
    6.  *Component chung:* Sử dụng `Dialog` và `Button` dùng chung.

---

### 5. Nộp bài (Submission Panel)
*   **Trạng thái:** `PASS`
*   **Đánh giá theo §11:**
    1.  *Tính từ:* **Trustworthy** — Hiển thị danh sách kiểm tra (checklist) điều kiện nộp bài deterministic, không cho phép đóng gói nếu có lỗi block nặng.
    2.  *Hành động chính:* Nút "Tải bộ nộp bài" (đóng gói zip).
    3.  *Trạng thái:* Trạng thái cảnh báo khi thiếu tệp xuất bản hoặc còn lỗi rà soát.
    4.  *Màu sắc:* Đỏ/vàng/xanh lá biểu diễn tính hợp lệ của danh sách kiểm tra.
    5.  *Anti-pattern:* Không sử dụng emoji vận hành.
    6.  *Component chung:* Sử dụng `Button` và `Badge` tiêu chuẩn.

---

### 6. Minh chứng (Evidence Panel)
*   **Trạng thái:** `PASS`
*   **Đánh giá theo §11:**
    1.  *Tính từ:* **Trustworthy** — Lưu trữ các tệp minh chứng đính kèm (GitHub, Drive, Demo) chuẩn chỉnh, có QR code đi kèm.
    2.  *Hành động chính:* Nút "Thêm minh chứng" ở header.
    3.  *Trạng thái:* Có empty state hướng dẫn chi tiết, trạng thái thêm mới (form) và sửa đổi.
    4.  *Màu sắc:* Slate dịu mắt, chỉ dùng màu primary cho nút hành động chính.
    5.  *Anti-pattern:* Không vi phạm.
    6.  *Component chung:* Rút ra từ components `ui/` và `states/` tiêu chuẩn.

---

### 7. Trình bày & Slide (Present Panel)
*   **Trạng thái:** `FIXED` (Đã khắc phục hoàn toàn glare dark-mode & emoji)
*   **Đánh giá theo §11:**
    1.  *Tính từ:* **Calm** & **Focused** — Quản lý slide và kịch bản nói gọn gàng, giảm phân tâm khi thuyết trình.
    2.  *Hành động chính:* Các tab chuyển đổi góc nhìn (Outline / Kịch bản / Hỏi đáp / Gợi ý).
    3.  *Trạng thái:* Hỗ trợ hiển thị gợi ý lỗi slide, đề xuất outline bằng AI.
    4.  *Màu sắc:*
        *   **Trước sửa:** Hộp gợi ý đề xuất AI bị lỗi glare nặng ở dark mode do hardcode nền xanh nhạt `#DBEAFE`.
        *   **Sau sửa:** Sử dụng token ngữ nghĩa `--rs-color-primary-bg`, tự động chuyển về màu nền xanh trong suốt dịu nhẹ `rgba(59, 130, 246, 0.12)` ở chế độ tối.
    5.  *Anti-pattern:*
        *   **Trước sửa:** Chứa hàng loạt emoji thô trong UI vận hành (tab buttons dùng `🗂️`, `🗣️`, `❓`, `⚠️`; danh sách gợi ý dùng `❌`, `⚠️`, `ℹ️`; các chủ đề Hỏi đáp dùng `🎯`, `💻`, `📊`, `⚠️`, `🚀`, `📍`; kịch bản dùng `🗣️`, `💡`, `✨`).
        *   **Sau sửa:** Thay thế toàn bộ bằng biểu tượng vector Lucide tương đương (`List`, `Mic`, `HelpCircle`, `AlertTriangle`, `Sparkles`, `Lightbulb`, `User`, `Target`, `Laptop`, `BarChart3`, `Rocket`, `MapPin`) hoặc dùng primitive `<Badge group="severity" />`.
    6.  *Component chung:* Sử dụng `Badge`, `SuccessState` tiêu chuẩn.

---

## 🔒 Cam kết thiết kế
*   Tất cả các thay đổi được thực hiện tối thiểu, không gây xáo trộn hành vi hoặc cấu trúc của các module.
*   Tuân thủ nghiêm ngặt bảng biến thiết kế trong `DesignSystem_Tokens.md`.
