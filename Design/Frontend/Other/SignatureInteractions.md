# ✨ SIGNATURE INTERACTIONS — Hành vi làm nên ReportSupporter

> **AI RULE — ĐỘC BẢN BẰNG HÀNH VI.** File này biến 3 hành vi chữ ký (`0.ArtDirection.md` §12.2) + luật "ấm bằng hành vi" (§12.4) thành **tương tác spec được**. Đây là nơi "đáng tin" và "thân thiện" trở thành *thứ bấm được*, không phải tính từ. Một màn đẹp mà thiếu các hành vi này = vẫn là editor generic.
>
> Mỗi tương tác dưới đây bám **logic module có thật** (đã đối chiếu `Modules/`), trừ #3 (deadline) là khái niệm mới — xem handoff `0.ArtDirection.md` §12.6. Giọng & nhãn theo `Other/VoiceAndContent.md`.

---

## Bảng tổng — 5 hành vi chữ ký

| # | Tên | Thuộc hành vi chữ ký | Nguồn logic |
| :--- | :--- | :--- | :--- |
| 1 | **Đèn rọi đúng chỗ** (jump-to-spot) | Sân khấu vật chứng + Người soát | `Modules/3.Check.md` §4 (jump-to-issue) |
| 2 | **Mức sẵn sàng giải thích được** | Người soát trước khi nộp | `Modules/3.Check.md` §5.3 (readiness score) |
| 3 | **Nhịp deadline điềm tĩnh** | Đồng hồ điềm tĩnh | ⚠️ mới — handoff §12.6 |
| 4 | **Lưu thầm có dấu vết** | (nền) Đáng tin | `Modules/1.Write.md` §5.2 (autosave) |
| 5 | **Tiến trình ra bản nộp thật** | Người soát + Sân khấu | `Modules/4.Export.md` §5.5 (job lifecycle) |

> #1, #2, #4, #5 là MVP-khả thi (W2–W4). #3 cần data model deadline trước. Tất cả phải tôn trọng `prefers-reduced-motion` và thao tác được bằng bàn phím.

---

## 1. 🔦 Đèn rọi đúng chỗ (jump-to-spot)

> *"Người soát chỉ tay vào đúng dòng, không bắt bạn tự dò."* Đây là tương tác **khác biệt nhất** — biến danh sách lỗi thành thao tác sửa.

- **Trigger:** Click (hoặc Enter/Space khi focus) một `ReportIssue` trong panel người soát.
- **Hành vi:**
  1. **Bàn viết:** con trỏ editor nhảy tới `issue.sectionId` + `issue.line`, cuộn dòng đó vào giữa viewport, đặt caret ở đầu dòng.
  2. **Tờ nộp:** preview cuộn tới đúng đoạn tương ứng và **đèn rọi** (highlight pulse) khối đó ~1.2s rồi tắt êm.
  3. Issue vừa chọn giữ trạng thái `active` trong panel cho tới khi chọn cái khác.
- **Trạng thái phải cover:**
  | State | Hành vi |
  | :--- | :--- |
  | issue có `sectionId`+`line` | nhảy chính xác dòng |
  | issue chỉ có `sectionId` (no line) | nhảy đầu section, đèn rọi cả section |
  | issue cấp project (vd `missing-conclusion`) | không có chỗ để nhảy → focus vào section navigator + gợi ý "Thêm mục" (không nhảy hụt) |
  | section đã bị xoá | bỏ active êm + toast info "Mục liên quan không còn" (không crash) |
- **Copy:** không cần copy mới; tooltip issue = `suggestion` có sẵn từ checker.
- **A11y:** issue list là danh sách điều hướng bằng bàn phím; Enter/Space kích hoạt jump (`Modules/3.Check.md` §9). Đèn rọi **không** chỉ bằng màu — kèm cuộn + caret để người không phân biệt màu vẫn thấy vị trí.
- **Motion:** "đèn rọi" = nền `--rs-color-primary` alpha thấp fade-in 120ms → giữ → fade-out 200ms. Reduced-motion: hiện viền tĩnh 1.2s rồi tắt, **không** pulse. Xem `Other/Motion.md`.
- **Vì sao độc bản:** Notion/Typora không có "người soát chỉ chỗ"; Linear có jump nhưng không phải sang một *tờ nộp song song*. Cặp editor↔preview cùng sáng đèn là chữ ký riêng.

---

## 2. 📊 Mức sẵn sàng giải thích được

> *"Điểm số không phán xét — nó giải thích & dẫn bạn đi sửa."* Biến `readinessScore` từ con số trang trí thành công cụ đáng tin.

- **Trigger:** Hover/click badge **Mức sẵn sàng nộp** (góc rail người soát).
- **Hành vi:** mở popover giải thích điểm:
  - Điểm hiện tại + nhãn (`good`/`medium`/`low`) theo ngưỡng token (`≥85` xanh / `60–84` vàng / `<60` đỏ — `DesignSystem_Tokens.md` §2.4).
  - **Phân rã điểm trừ:** "X lỗi chặn (−15 mỗi lỗi), Y cảnh báo (−5), Z gợi ý (−1)" — đúng công thức `Modules/3.Check.md` §5.3.
  - Mỗi dòng phân rã là **link jump** (tương tác #1) tới lỗi đại diện.
- **Trạng thái:**
  | State | Badge |
  | :--- | :--- |
  | chưa chạy người soát | badge xám "Chưa soát" + nút **Soát báo cáo** (không hiện điểm giả) |
  | đang soát | skeleton badge (`3.Patterns/LoadingSkeleton.md`) |
  | good (≥85) | xanh, icon `CheckCircle2`, "Sẵn sàng nộp" — ghi nhận điềm tĩnh (§12.4) |
  | medium / low | vàng/đỏ, popover nhấn việc cần làm trước |
- **Copy:** nhãn theo `VoiceAndContent.md` §3 (readiness). Popover header: "Mức sẵn sàng nộp: {n}/100".
- **A11y:** badge có `aria-label` đầy đủ ("Mức sẵn sàng nộp 75 trên 100, còn cảnh báo"); popover bẫy focus, Esc đóng; điểm **không** chỉ bằng màu (kèm nhãn + icon).
- **Vì sao độc bản:** điểm *giải thích được + jump được* là hành vi "trustworthy", đúng tính từ §1. Phần lớn editor không có khái niệm "sẵn sàng nộp" gì cả.

---

## 3. ⏳ Nhịp deadline điềm tĩnh

> *"Một người đồng hành biết hạn nộp, nhắc nhẹ, không hối hả."* Đây là phần "trợ lý deadline" — linh hồn thân thiện của sản phẩm. ⚠️ Cần `ReportProject.deadline` (handoff `0.ArtDirection.md` §12.6); spec theo dạng *"khi deadline tồn tại"*.

- **Trigger:** luôn hiện (passive) ở **đồng hồ** trên rail phải khi report có `deadline`; nhắc chủ động chỉ ở mốc.
- **Hành vi:**
  - Hiện **thời gian còn lại** ở dạng người-đọc ("Còn 2 ngày", "Còn 5 giờ"), không đếm giây căng thẳng.
  - Đối chiếu **thời gian × mức sẵn sàng**: gợi ý 1 việc kế tiếp dựa trên lỗi nặng nhất ("Còn 2 ngày · mục Kết luận chưa xong").
  - **Nhịp nhắc tế nhị** theo mốc, không spam: vào app khi còn <1 ngày, hoặc khi readiness thấp mà thời gian ngắn.
- **Thang tông theo thời gian còn lại (điềm tĩnh, KHÔNG báo động):**
  | Còn lại | Tông | Màu |
  | :--- | :--- | :--- |
  | > 3 ngày | thông tin, mờ | `--rs-color-text-muted` |
  | 1–3 ngày | nhắc nhẹ | text thường |
  | < 1 ngày | nhấn (vẫn điềm tĩnh) | `--rs-color-severity-warning` + icon, **không** đỏ nhấp nháy |
  | quá hạn | trung thực, không trách | `--rs-color-text-muted` + "Đã quá hạn {n} — vẫn có thể hoàn thiện để nộp" |
- **Trạng thái:**
  | State | Hiển thị |
  | :--- | :--- |
  | report không đặt deadline | đồng hồ ẩn / nút mờ "Đặt hạn nộp" (không ép) |
  | đặt rồi, còn xa | dòng meta mờ, không nhắc |
  | gần hạn | nhắc 1 dòng + 1 việc kế tiếp |
- **Copy:** xem `VoiceAndContent.md` §"Nhịp deadline". Tuyệt đối **không** "Nhanh lên!", "Sắp trễ rồi 😱". Mẫu: "Còn 1 ngày · báo cáo đang ở mức Còn cảnh báo."
- **A11y:** thời gian còn lại có text đầy đủ (không chỉ icon đồng hồ); nhắc không cướp focus; tôn trọng reduced-motion (không animation đếm).
- **Vì sao độc bản:** *không editor học thuật nào* coi deadline là khái niệm hạng nhất gắn với mức sẵn sàng. Đây là thứ "không nơi nào có" — và là lý do gọi sản phẩm là *trợ lý deadline*.

---

## 4. 💾 Lưu thầm có dấu vết

> *"Lưu là việc của công cụ, không phải lo của bạn — nhưng bạn luôn kiểm chứng được."* Cân bằng "yên tĩnh" với "đáng tin".

- **Trigger:** tự động, throttle ~2s sau khi gõ (`Modules/1.Write.md` §5.2).
- **Hành vi:**
  - **Thầm:** KHÔNG toast mỗi lần lưu (anti-pattern spam — `3.Patterns/Feedback.md`). Chỉ một **dấu trạng thái inline** đổi giữa "Đang lưu…" → "Đã lưu HH:MM".
  - **Dấu vết (audit trail):** thời điểm lưu gần nhất luôn hiện; click → danh sách mốc lưu gần đây (timestamp) để người dùng *tin* rằng bài không mất.
- **Trạng thái:**
  | State | Hiển thị | Token |
  | :--- | :--- | :--- |
  | đang gõ (chưa lưu) | "Đang lưu…" mờ | `--rs-color-text-muted` |
  | đã lưu | "Đã lưu HH:MM" + icon `CheckCircle2` nhỏ | `--rs-color-success` (tiết chế) |
  | lỗi quota IndexedDB | banner "Bộ nhớ trình duyệt đầy…" + giữ nội dung RAM (`1.Write.md` §6) | `--rs-color-severity-error` |
- **Copy:** "Đã lưu" / "Đang lưu…" (`VoiceAndContent.md` §6). Không "Thành công!".
- **A11y:** trạng thái lưu là `aria-live="polite"` (không cướp ngữ cảnh); dấu vết điều hướng được bằng bàn phím.
- **Vì sao độc bản:** "yên nhưng kiểm chứng được" đúng luật §12.4 — ấm bằng hành vi (không bắt lo), tin bằng dấu vết (không phải phép màu).

---

## 5. 📤 Tiến trình ra bản nộp thật

> *"Không giả tiến trình — bạn thấy đúng từng bước máy đang làm."* Hiện thực tính từ Trustworthy ở khoảnh khắc quan trọng nhất: ra file đi nộp.

- **Trigger:** bấm xuất **HTML / PDF / DOCX** (`Modules/4.Export.md`).
- **Hành vi:**
  - **Cổng người soát:** nếu còn `error` từ checker → confirm dialog "Vẫn xuất dù còn lỗi?" (`VoiceAndContent.md` §7) — nhắc, **không** chặn cứng (`4.Export.md` §6).
  - **Timeline job thật:** hiện các stage có thật của `ExportJob` — `merge → parse → format → render-{html|pdf|docx}` (`4.Export.md` §5.5), không phải thanh % giả.
  - **Lỗi có địa chỉ:** lỗi tại stage nào → ghi `ExportError{stage, message, recoverable}` + nút **Thử lại**; UI không treo.
- **Trạng thái (★ bắt buộc đủ):**
  | State | Hiển thị |
  | :--- | :--- |
  | disabled | khi điều kiện chưa đủ (vd đang job khác) — nút mờ + lý do |
  | running | timeline stage hiện tại sáng, các stage sau mờ; nút khoá click lặp (`Button` loading) |
  | done | "Đã xuất {định dạng}" + action **Mở file** (toast success, `Feedback.md`) |
  | error | stage lỗi đỏ + `message` + **Thử lại** (toast không tự tắt) |
- **Copy:** `VoiceAndContent.md` §4 (export fail) + §6 (export done). Stage hiển thị bằng tiếng Việt người-đọc ("Gộp nội dung → Phân tích → Định dạng → Dựng PDF").
- **A11y:** timeline là danh sách trạng thái có text (không chỉ màu/spinner); `aria-busy` khi running; lỗi gắn `role="alert"`.
- **Vì sao độc bản:** export của converter rời thường là hộp đen "đang xử lý…". Ở đây người soát + timeline thật biến bước nộp thành khoảnh khắc *yên tâm*, đúng lý do người dùng quay lại (`4.Export.md` §1).

---

## 6. 📎 CROSS-REFS

- `0.ArtDirection.md` §12 (hệ ẩn dụ + 3 hành vi chữ ký) · §12.4 (luật cá tính) · §12.6 (handoff deadline).
- `4.Layouts/AppShell.md` (rail người soát + đồng hồ) · `5.Flows/Write.md` · `5.Flows/Export.md`.
- `3.Patterns/Feedback.md` · `LoadingSkeleton.md` · `ErrorStates.md` · `Other/Motion.md` · `Other/VoiceAndContent.md`.
- Logic nguồn: `Modules/1.Write.md` §5.2 · `Modules/3.Check.md` §4–§5.3 · `Modules/4.Export.md` §5.5.
