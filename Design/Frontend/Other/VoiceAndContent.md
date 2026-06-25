# 🗣️ VOICE & CONTENT (Microcopy)

> **AI RULE:** Giọng = điềm tĩnh, rõ ràng, tôn trọng, không hô hào (`0.ArtDirection.md` §1, §9). **Tiếng Việt 100%** (A5); chỉ giữ nguyên thuật ngữ: **Markdown · PDF · DOCX · HTML · TOC**. Không emoji trong copy vận hành.

---

## 1. 🎚️ NGUYÊN TẮC

| Nguyên tắc | ✅ | ❌ |
| :--- | :--- | :--- |
| Nút = **động từ** rõ | "Xuất PDF", "Tạo report", "Lưu" | "OK", "Submit", "Đồng ý" |
| Lỗi = **giúp đỡ, không trách** | "Thiếu mục Kết luận — thêm trước khi nộp." | "Bạn đã quên Kết luận!" |
| Nói **kết quả thật** | "Đã xuất PDF" | "Thành công!" (chung chung) |
| Ngắn, 1 ý/câu | "Tiêu đề không được để trống." | đoạn dài giải thích |
| Trung tính, không cảm thán | — | "Tuyệt vời!", "Rất tiếc 😢" |

---

## 2. 🔘 NHÃN NÚT CHUẨN (Button)

| Ngữ cảnh | Nhãn |
| :--- | :--- |
| Tạo báo cáo mới | **Tạo report** |
| Lưu metadata | **Lưu** |
| Xuất | **Xuất PDF** / **Xuất DOCX** / **Xuất HTML** |
| Chạy kiểm tra | **Kiểm tra** |
| Xoá (danger) | **Xoá** (confirm: **Xoá section**) |
| Huỷ trong dialog | **Huỷ** |
| Đóng | **Đóng** (icon-only: `aria-label="Đóng"`) |
| Thêm mục/evidence | **Thêm mục** / **Thêm minh chứng** |

> Đang xử lý → giữ nhãn + spinner (Button loading), **không** đổi thành "Đang...".

---

## 3. 🏷️ NHÃN TRẠNG THÁI (Badge)

| Nhóm | Giá trị → nhãn hiển thị |
| :--- | :--- |
| severity | `error`→**Lỗi** · `warning`→**Cảnh báo** · `info`→**Gợi ý** |
| readiness | `good`→**Sẵn sàng nộp** · `medium`→**Còn cảnh báo** · `low`→**Còn lỗi chặn** |
| section status | `draft`→**Nháp** · `review`→**Đang soát** · `done`→**Xong** |

> Badge luôn kèm icon (Lucide) — nhãn chữ là phần a11y bắt buộc, không bỏ.

---

## 4. ⚠️ MESSAGE LỖI / VALIDATE

| Tình huống | Copy |
| :--- | :--- |
| Field trống bắt buộc | "{Tên field} không được để trống." |
| Thiếu mục báo cáo | "Thiếu mục {tên} — thêm trước khi nộp." |
| Bảng quá rộng (info) | "Bảng có thể tràn lề trang — cân nhắc thu gọn cột." |
| Heading nhảy cấp (warning) | "Tiêu đề nhảy cấp ({từ}→{tới}) — kiểm tra lại cấu trúc." |
| Export fail | "Xuất {định dạng} chưa xong. Thử lại?" + nút **Thử lại** |
| Lỗi đọc dữ liệu (IndexedDB) | "Không mở được dữ liệu cục bộ. Tải lại trang để thử lại." |

> Message gắn ngữ cảnh (cạnh field / trong preview), không gom toàn cục mơ hồ.

---

## 5. 🫙 EMPTY-STATE COPY

| Chỗ rỗng | Tiêu đề | Phụ đề | Nút |
| :--- | :--- | :--- | :--- |
| Chưa có report | "Chưa có báo cáo nào" | "Tạo báo cáo đầu tiên để bắt đầu viết." | **Tạo report** |
| Report chưa có section | "Báo cáo trống" | "Thêm mục đầu tiên để bắt đầu." | **Thêm mục** |
| Checker — 0 issue (tích cực) | "Không có lỗi" | "Báo cáo đạt các kiểm tra hiện tại." | — |
| Checker — chưa chạy | "Chưa kiểm tra" | "Chạy kiểm tra để soát lỗi trước khi nộp." | **Kiểm tra** |
| Evidence rỗng | "Chưa có minh chứng" | "Thêm liên kết minh chứng cho báo cáo." | **Thêm minh chứng** |

> Phân biệt rõ **rỗng-tích-cực** (0 lỗi = tốt, không CTA) vs **rỗng-chưa-bắt-đầu** (có CTA dẫn lối).

---

## 6. 📣 FEEDBACK / TOAST COPY

| Sự kiện | Variant | Copy |
| :--- | :--- | :--- |
| Autosave xong | (inline/quiet, không toast) | "Đã lưu" |
| Xuất xong | success | "Đã xuất {định dạng}" + action **Mở file** |
| Kiểm tra xong | success | "Đã kiểm tra — {n} vấn đề" |
| Lỗi nhẹ | error | "{nêu lỗi}." + action **Thử lại** (không tự tắt) |
| Xoá có thể hoàn tác | info | "Đã xoá {tên}" + action **Hoàn tác** |

---

## 7. 🪟 CONFIRM DIALOG COPY

| Tác vụ | Title | Body | Nút |
| :--- | :--- | :--- | :--- |
| Xoá section | "Xoá section này?" | "Hành động không thể hoàn tác." | **Huỷ** · **Xoá section** (danger) |
| Xuất khi còn lỗi | "Vẫn xuất dù còn lỗi?" | "Báo cáo còn {n} lỗi chặn. Nên sửa trước khi nộp." | **Huỷ** · **Vẫn xuất** |

---

## 8. 📎 CROSS-REFS
- `0.ArtDirection.md` §9 · `3.Patterns/EmptyStates.md` / `ErrorStates.md` / `FormValidation.md` / `Feedback.md`
- `2.Components/*` (mỗi component lấy nhãn từ đây) · `Modules/3.Check.md` (message issue gốc).
