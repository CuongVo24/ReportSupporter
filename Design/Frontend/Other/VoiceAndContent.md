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

## 1.1. 🧭 TỪ VỰNG USER-FACING VS TECHNICAL

| Khái niệm | User-facing | Technical/docs nội bộ |
| :--- | :--- | :--- |
| checker / linter | **Người soát** | `checker`, `ReportIssue`, `runChecker` |
| chạy checker | **Soát báo cáo** | run check / checker pass |
| checker chưa chạy | **Chưa soát** | unchecked |
| checker xong | **Đã soát — {n} vấn đề** | check completed |
| preview/report output | **Bản nộp** | **tờ nộp** / preview A4 / report output |
| export | **Xuất PDF/DOCX/HTML** | **ra bản nộp** |

> **Rule:** `checker` và `tờ nộp` là từ trong spec/kỹ thuật. Copy người dùng ưu tiên **Người soát**, **Soát báo cáo**, **Bản nộp**, trừ khi đang nói trực tiếp về định dạng file.

---

## 2. 🔘 NHÃN NÚT CHUẨN (Button)

| Ngữ cảnh | Nhãn |
| :--- | :--- |
| Tạo báo cáo mới | **Tạo report** |
| Lưu metadata | **Lưu** |
| Xuất | **Xuất PDF** / **Xuất DOCX** / **Xuất HTML** |
| Chạy người soát | **Soát báo cáo** |
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
| Người soát — 0 issue (tích cực) | "Không có lỗi" | "Báo cáo đạt các tiêu chí soát hiện tại." | — |
| Người soát — chưa chạy | "Chưa soát" | "Soát báo cáo để rà lỗi trước khi nộp." | **Soát báo cáo** |
| Evidence rỗng | "Chưa có minh chứng" | "Thêm liên kết minh chứng cho báo cáo." | **Thêm minh chứng** |

> Phân biệt rõ **rỗng-tích-cực** (0 lỗi = tốt, không CTA) vs **rỗng-chưa-bắt-đầu** (có CTA dẫn lối).

---

## 6. 📣 FEEDBACK / TOAST COPY

| Sự kiện | Variant | Copy |
| :--- | :--- | :--- |
| Autosave xong | (inline/quiet, không toast) | "Đã lưu" |
| Xuất xong | success | "Đã xuất {định dạng}" + action **Mở file** |
| Soát xong | success | "Đã soát — {n} vấn đề" |
| Lỗi nhẹ | error | "{nêu lỗi}." + action **Thử lại** (không tự tắt) |
| Xoá có thể hoàn tác | info | "Đã xoá {tên}" + action **Hoàn tác** |

---

## 7. 🪟 CONFIRM DIALOG COPY

| Tác vụ | Title | Body | Nút |
| :--- | :--- | :--- | :--- |
| Xoá section | "Xoá section này?" | "Hành động không thể hoàn tác." | **Huỷ** · **Xoá section** (danger) |
| Xuất khi còn lỗi | "Vẫn xuất dù còn lỗi?" | "Báo cáo còn {n} lỗi chặn. Nên sửa trước khi nộp." | **Huỷ** · **Vẫn xuất** |
| Tạo báo cáo mới | "Tạo báo cáo mới?" | "Toàn bộ nội dung hiện tại sẽ bị xóa. Hành động không thể hoàn tác." | **Huỷ** · **Tạo báo cáo** (danger) |

---

## 8. ⏳ NHỊP DEADLINE & GHI NHẬN ("ấm bằng hành vi")

> **AI RULE:** Đây là copy của *trợ lý deadline thân thiện* — cá tính sống ở **đúng lúc + đúng lời**, không ở cảm thán (`0.ArtDirection.md` §12.4). Tuyệt đối không "Nhanh lên!", không emoji, không hù dọa. Nhắc *kèm một việc cụ thể*, không lo lắng chung chung. (Cần `ReportProject.deadline` — handoff §12.6.)

### 8.1 Nhắc deadline (theo thời gian còn lại)

| Còn lại | Copy mẫu | Tông |
| :--- | :--- | :--- |
| > 3 ngày | "Hạn nộp: {ngày}." | meta mờ, không nhắc chủ động |
| 1–3 ngày | "Còn {n} ngày · {việc kế tiếp}." | nhắc nhẹ |
| < 1 ngày | "Còn {n} giờ · báo cáo đang ở mức {nhãn readiness}." | nhấn, vẫn điềm tĩnh |
| quá hạn | "Đã quá hạn {n} — vẫn có thể hoàn thiện để nộp." | trung thực, không trách |

> "{việc kế tiếp}" lấy từ lỗi nặng nhất của người soát, vd "mục Kết luận chưa xong", "còn 2 lỗi chặn".

### 8.2 Ghi nhận tiến độ (điềm tĩnh, không tung hô)

| Khoảnh khắc | Copy | ❌ Tránh |
| :--- | :--- | :--- |
| Đạt sẵn sàng nộp (≥85) | "Báo cáo đã sẵn sàng nộp." | "Tuyệt vời! 🎉", confetti |
| Sửa hết lỗi chặn | "Hết lỗi chặn — còn {n} cảnh báo nên xem." | "Hoàn hảo!" |
| Lưu thầm | "Đã lưu HH:MM" | "Đã lưu thành công!!!" |

### 8.3 Gợi ý "việc kế tiếp" (giọng người soát, không ra lệnh)

| Tình huống | Copy |
| :--- | :--- |
| Còn lỗi chặn | "Nên sửa {n} lỗi chặn trước khi nộp." |
| Chỉ còn cảnh báo | "Có thể nộp được; {n} cảnh báo là tuỳ chọn cải thiện." |
| Sắp hạn mà còn nhiều việc | "Còn {n} ngày · ưu tiên {mục} trước." |

> Luôn **gợi ý**, không mệnh lệnh: "Nên…", "Có thể…", không "Bạn phải…".

---

## 9. 📎 CROSS-REFS
- `0.ArtDirection.md` §9 (giọng) · §12.3 (từ vựng độc bản) · §12.4 (ấm bằng hành vi) · `Other/SignatureInteractions.md` (#3 nhịp deadline, #4 lưu thầm).
- `3.Patterns/EmptyStates.md` / `ErrorStates.md` / `FormValidation.md` / `Feedback.md`.
- `2.Components/*` (mỗi component lấy nhãn từ đây) · `Modules/3.Check.md` (message issue gốc).
