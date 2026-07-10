# W21 Break — Index Contract (Redesign Finish: Tách CSS · TOC In Ấn · CodeMirror Dark · Toggle Dark Mode)

> **Lane:** Core / break_task / week21_break.
> **Branch (chung cả tuần):** `feature/W25-ui-redesign` — **toàn bộ contract W21 đi chung nhánh redesign đang chạy**, không tách nhánh con (giống W20 `w20/import-fidelity`). Contract (docs) merge thẳng vào `main`; phần thi công `src/` land trên nhánh redesign rồi mới gộp.
> **Nguồn:** Session redesign 2026-07-10 (nhánh `feature/W25-ui-redesign`, phase 0–5). Sau khi diệt token "ma" và chuẩn hoá severity, còn **4 khoản nợ** lộ ra khi soi lại UI đang chạy — đều là "việc còn dở" đã ghi trong memory [[w25-ui-redesign]].
> **Cách viết:** theo format `week20_break` (Lane/Branch/Type · Findings S-mã · Micro-task · Locked · Scope · Checklist · Files · Risks · Verification · Status). Branch dùng chung cho mọi contract.
> **Chủ đề tuần:** "redesign-finish" — W25 redesign đã dựng **art direction** (Inter/JetBrains Mono, token thật trong `:root`, hai bề mặt UI ↔ tờ báo cáo) nhưng **chưa đóng** 4 mảnh: CSS còn là monolith 3.7K dòng, khối Mục lục trên màn hình vẫn dùng màu UI (lệch tờ in), theme editor chưa token hoá cho dark, và app khoá cứng `data-theme="light"` nên dark mode chỉ tồn tại trên giấy. W21 là tuần **dọn nợ kiến trúc CSS + đóng hai bề mặt + hoàn tất dark mode**, không thêm tính năng người dùng mới ngoài toggle.

## Vì sao redesign đã làm mà vẫn sót?

Redesign W25 tập trung **token & art direction** — đặt lại biến màu/typography, diệt token ma, chuẩn severity. Nó **không** đụng tới:
- **Kiến trúc file CSS**: mọi thay đổi vẫn dồn vào một `globals.css` khổng lồ ⇒ khó tìm, dễ va chạm, không có ranh giới theo component.
- **Parity hai bề mặt cho TOC**: art direction quy định "tờ báo cáo = mực đen trên giấy trắng". Nhánh **in** đã tuân (`print-css.ts` render TOC đen + dot leader + số trang), nhưng nhánh **màn hình** (`globals.css .ws-toc-*`) vẫn là di sản cũ — nền slate, link xanh `--rs-blue-600` — nên preview ≠ PDF ngay tại khối Mục lục.
- **Token hoá theme CodeMirror**: editor dùng `EditorView.theme` với `--rs-color-primary-bg` cho active line; biến này là nền xanh nhạt cố định, **không** đổi theo `[data-theme="dark"]` một cách hợp lý ⇒ dòng đang sửa chói sáng khi nền tối.
- **Đường dẫn tới dark mode**: token dark **đã có đủ** (`[data-theme="dark"]` + `@media prefers-color-scheme` ở cuối `globals.css`) nhưng `layout.tsx` **khoá cứng** `data-theme="light"` ⇒ toàn bộ nhánh dark chết, không cách nào chạm tới.

## Nguyên nhân gốc (4 systemic)

| Mã | Nguyên nhân gốc | Triệu chứng | Contract |
|---|---|---|---|
| **A** | **`globals.css` là monolith 3.7K dòng, không ranh giới theo component.** Style của mọi module (editor, preview, checker, export, evidence, present, TOC, health, snapshot…) nằm chung một file; sửa một component phải cuộn giữa biển selector, dễ đụng vùng khác, không có `@import`/layer phân tách. | Khó bảo trì, review diff ồn, va chạm khi nhiều contract cùng sửa CSS | `w21_split_globals_css_by_component` |
| **B** | **Khối Mục lục trên màn hình dùng bảng màu UI trong lòng tờ báo cáo.** `.ws-toc-container` nền `--rs-slate-100` + viền `--rs-slate-300`, `.ws-toc-link` màu `--rs-blue-600`, `.ws-toc-number` màu `--rs-slate-500`; thiếu dot leader + số trang. Nhánh in (`print-css.ts`) đã đen + dotted leader ⇒ **preview ≠ PDF**, và vi phạm "tờ báo cáo = mực đen trên giấy". | TOC preview xanh/xám lệch art direction; parity preview↔PDF vỡ ở khối TOC | `w21_toc_print_art_direction` |
| **C** | **Theme CodeMirror chưa token hoá cho dark.** `editor-setup.ts` set `.cm-activeLine`/`.cm-activeLineGutter` = `--rs-color-primary-bg` (nền xanh nhạt sáng), gutter = `--rs-color-text-muted`; các biến này không cho ra tương phản đúng ở `[data-theme="dark"]` ⇒ dòng active vẫn sáng chói trong nền tối. | Active line/gutter chói trong dark mode, editor không hoà nền tối | `w21_codemirror_theme_tokenize_dark` |
| **D** | **App khoá cứng `data-theme="light"`; không có toggle & không lưu lựa chọn.** `layout.tsx` render `<html ... data-theme="light">` cố định ⇒ token dark (đã định nghĩa đủ) không bao giờ được kích hoạt; không có control cho người dùng, không đọc `prefers-color-scheme`, không persist. | Dark mode chết dù token sẵn sàng; người dùng không đổi được theme | `w21_dark_mode_global_toggle` |

## Map phát hiện → xử lý

| # | Phát hiện (memory [[w25-ui-redesign]] "việc còn dở") | Mức | Xử lý |
|---|---|---|---|
| 1 | `globals.css` monolith 3.7K dòng — nên tách theo component | 🟠 | `w21_split_globals_css_by_component` |
| 2 | Khối Mục lục preview dùng màu UI (slate/xanh) trong tờ báo cáo — trái art direction | 🟠 | `w21_toc_print_art_direction` |
| 3 | Theme CodeMirror chưa token hoá — active line sáng trong dark mode | 🟠 | `w21_codemirror_theme_tokenize_dark` |
| 4 | App hardcode `data-theme="light"` — chưa có toggle dark mode toàn cục | 🟠 | `w21_dark_mode_global_toggle` |

## Thứ tự đề xuất (fix hành vi trước → tách cơ học sau)

1. `w21_toc_print_art_direction` — **B**. Nhỏ, cô lập (một khối `.ws-toc-*`), làm đúng art direction + parity ngay. Chạy trên monolith ổn định.
2. `w21_codemirror_theme_tokenize_dark` — **C**. Token hoá theme editor để dark mode có chỗ dựa; làm **trước** khi bật toggle để dark ra mắt đã sạch.
3. `w21_dark_mode_global_toggle` — **D**. Mở đường tới token dark + toggle + persist. Nên đi **sau C** để lần đầu bật dark không lộ editor chói.
4. `w21_split_globals_css_by_component` — **A, để cuối**. Thuần cơ học, ít rủi ro hành vi nhưng **đụng cả file** ⇒ land sau cùng để không churn/va chạm với B, C, D vốn cũng sửa `globals.css`. Sau khi B/D đã yên, split mới di dời khối đã ổn định.

## Locked dùng chung mọi contract
- 🔒 **Một nhánh thi công duy nhất `feature/W25-ui-redesign`**; mỗi contract = 1 commit logic riêng (không nhánh con). Docs contract gộp vào `main`.
- 🔒 **Không đổi gu / art direction** (kế thừa W25): bám `Design/Frontend/0.ArtDirection.md` (calm/focused/trustworthy, north star Linear/iA Writer). W21 chỉ **đóng** những mảnh redesign bỏ dở, không mở hướng thẩm mỹ mới.
- 🔒 **Hai bề mặt bất khả xâm phạm:** UI (chrome) có thể sáng/tối theo theme; **tờ báo cáo `--rs-report-*` luôn mực-đen-trên-giấy-trắng** bất kể dark mode (kế thừa "dark preview chỉ ở screen, export ép trắng-đen" của W20-E). Dark mode **không** được nhuộm nội dung tờ A4.
- 🔒 **Token-only / no-hex ngoài primitive**; cấm token "ma" — mọi tên biến phải có trong `DesignSystem_Tokens.md`, thấy tên lạ là regression (kế thừa W25). Microcopy theo `VoiceAndContent.md §7`.
- 🔒 **Một nguồn sự thật render & style tờ in:** preview/print-preview/PDF chia sẻ art direction; sửa TOC screen phải **hội tụ về** nhánh in đã đúng, không đẻ nhánh style thứ ba.
- 🔒 **Split thuần cơ học (A):** tách file **không** được đổi một byte giá trị CSS nào — chỉ di dời + `@import`/layer. Bất kỳ thay đổi màu/kích thước trong lúc split là ngoài phạm vi.
- 🔒 **Không thêm lib.** Toggle dark mode dùng vốn có (React state + `localStorage`, theo mẫu `ocr-settings.ts`/`ai-config.ts`); không kéo theme library.

## Cảnh báo phạm vi (đọc trước khi Approve)
- **A rủi ro thứ tự nạp CSS:** tách `globals.css` phải giữ nguyên **thứ tự cascade** và độ đặc hiệu; đổi thứ tự `@import` có thể lật đè selector. Cần verify pixel-parity (diff ảnh) trước/sau. Đề xuất tách theo ranh giới comment sẵn có (`/* … extracted styles */`, `/* ===== … ===== */`) — mỗi khối một file, `globals.css` chỉ còn `:root` + reset + chuỗi `@import`.
- **B là parity, không phải sáng tạo:** đích đến chính là mang style TOC **màn hình** về khớp `print-css.ts` (đen, dot leader, số trang) — tránh đẻ phong cách TOC thứ ba. Cần kiểm tra dark mode: TOC nằm **trong tờ báo cáo** nên vẫn đen-trên-trắng kể cả khi UI tối.
- **C đụng theme runtime:** `EditorView.theme` sinh class scoped, biến CSS vẫn resolve theo `[data-theme]` ở `<html>` — xác nhận active line/gutter đọc token đổi được theo theme (thêm token editor riêng nếu `--rs-color-primary-bg` không đủ tương phản dark). Không hồi quy light mode.
- **D là công tắc "bật đèn":** một khi gỡ hardcode `light`, **mọi** màn hình dark lần đầu phơi sáng — checker panel, evidence, export, present, health, snapshot… phải được rà chói/lệch. Gate: liệt kê màn hình chính ở dark, không vùng nào "cháy trắng" hay chữ chìm. Cần chống FOUC (áp theme trước paint) và tôn trọng `prefers-color-scheme` làm mặc định, cho phép override + persist.

> Tất cả contract đang ở trạng thái `PROPOSED — chờ Approve`. Chưa chạm `src/` cho tới khi Approve từng contract.
