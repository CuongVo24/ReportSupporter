# Contract For AI — W21 Fix (B): Khối Mục Lục Preview Về Art Direction In Ấn (Đen · Dot Leader · Parity PDF)

> **Lane:** Core / break_task / week21_break.
> **Branch:** `feature/W25-ui-redesign` (nhánh chung cả tuần).
> **Type:** Two-surface parity + art direction. **Rủi ro thấp, cô lập** (một khối `.ws-toc-*`).
> **Findings:**
> - **S1** (🟠) — **TOC màn hình mặc bảng màu UI trong lòng tờ báo cáo.** `.ws-toc-container` nền `--rs-slate-100`, viền `--rs-slate-300` ([globals.css:1161](src/app/globals.css#L1161)); `.ws-toc-link` màu `--rs-blue-600` ([globals.css:1191](src/app/globals.css#L1191)); `.ws-toc-number` màu `--rs-slate-500` ([globals.css:1204](src/app/globals.css#L1204)) — trái quy tắc "tờ báo cáo = mực đen trên giấy trắng".
> - **S2** (🟠) — **Parity preview ≠ PDF ngay tại TOC.** Nhánh in đã đúng: `.ws-toc-link` màu `#000`, có `.ws-toc-leader` (dotted) + `.ws-toc-page` số trang ([print-css.ts:81](src/modules/export/print-css.ts#L81)-L87). Nhánh màn hình **không có** leader/số trang và tô xanh/xám ⇒ hai bề mặt lệch nhau.
> **Builds on:** `globals.css` (khối TOC L1160–L1236), `print-css.ts` (nhánh in đã chuẩn — nguồn tham chiếu), `PreviewPane.tsx` (`TocBlock`, `renderTocToHtml`).
> **Sources:** Redesign session 2026-07-10, "việc còn dở" #2 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Đưa style **màn hình** của khối Mục lục hội tụ về **nhánh in đã đúng art direction**: mực đen trên nền trắng, dot leader, số trang canh phải — để preview khớp PDF và tôn trọng hai bề mặt.

- **S1 — Khử màu UI khỏi tờ báo cáo.** `.ws-toc-container` nền trắng/không nền (đồng bộ tờ A4), bỏ viền slate hoặc chuyển sang đường kẻ mảnh đen tinh tế; `.ws-toc-link`/`.ws-toc-text`/`.ws-toc-number` dùng **`--rs-report-color-text`** (đen), không `--rs-blue-*`/`--rs-slate-*`. Hover = gạch chân, không đổi sang xanh.
- **S2 — Dot leader + số trang (parity).** Thêm dot-leader (`border-bottom: 1px dotted`) và cột số trang canh phải cho bản màn hình, khớp cấu trúc `.ws-toc-left`/`.ws-toc-leader`/`.ws-toc-page` của `print-css.ts`. Nếu `renderTocToHtml` chưa phát các span đó cho preview, cập nhật để **một** hàm render dùng chung cho cả screen & print.

> 🔒 TOC nằm **trong** tờ báo cáo ⇒ luôn đen-trên-trắng **kể cả** dark mode (biến `--rs-report-*` bất biến). Không token UI (slate/blue) trong khối này.
> 🔒 Không đẻ phong cách TOC thứ ba — đích là hội tụ screen ↔ print, không sáng tạo layout mới.

## 2. Scope

### In scope
- [src/app/globals.css](src/app/globals.css) (MODIFY): khối `.ws-toc-*` (L1160–L1236) — đổi màu về `--rs-report-color-text`, bỏ nền/viền slate, thêm leader + page column khớp print.
- [src/modules/format](src/modules/format) `renderTocToHtml` (MODIFY nếu cần): phát cấu trúc `ws-toc-left/leader/page` để screen & print dùng chung markup.
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY nhẹ nếu cần): `TocBlock` markup theo hàm render chung.

### Out of scope
- ❌ Đổi thuật toán đánh số heading/TOC (đã có `numberHeadings`/`generateToc`).
- ❌ Đổi style `.ws-lof-*`/`.ws-lot-*` (Danh mục hình/bảng) trừ khi dùng chung class `ws-toc-*` bị ảnh hưởng — nếu bị, giữ chúng khớp cùng art direction.
- ❌ Đổi engine in hay `print-css.ts` (nó là **nguồn đúng**, chỉ tham chiếu).

## 3. Checklist
- [x] **S1** TOC preview: nền trắng, chữ/số/link màu đen `--rs-report-color-text`; không còn `--rs-blue-*`/`--rs-slate-*` trong khối.
- [x] **S2** TOC preview có dot leader + số trang, khớp cấu trúc `print-css.ts`; markup dùng chung một hàm render.
- [x] TOC vẫn đen-trên-trắng khi bật dark mode (không nhuộm theo UI).
- [x] Diff ảnh preview↔PDF ở khối TOC: gần khớp. 3 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` | MODIFY | khối `.ws-toc-*`: đen + leader + page, bỏ slate/blue |
| `src/modules/format/*toc*` | MODIFY | `renderTocToHtml` phát left/leader/page dùng chung |
| `src/components/PreviewPane.tsx` | MODIFY nhẹ | `TocBlock` theo markup chung |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---|---|
| Đổi `renderTocToHtml` phá parity test | Low | Cập nhật `parity.test.ts`/`print-preview.test.ts`; một markup dùng chung. |
| Dark mode nhuộm TOC | Med | Ép `--rs-report-*` (đen/trắng) trong khối; verify ở `[data-theme="dark"]`. |
| LOF/LOT dùng chung class bị ảnh hưởng | Low | Kiểm tra `.ws-lof-*`/`.ws-lot-*`; giữ đồng bộ art direction. |

## 6. Verification Plan
- Mở preview một báo cáo có TOC: chữ/số/link đen, có dot leader nối tới số trang; không còn nền xám hay link xanh.
- Xuất PDF/print-preview: khối TOC gần khớp preview (diff ảnh).
- Bật dark mode (sau khi có D) hoặc set thủ công `data-theme="dark"`: chrome tối nhưng tờ báo cáo + TOC vẫn đen-trên-trắng.
- `npm test` cho `parity`, `print-css`, `print-preview` xanh. 3 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ui): align screen table of contents with print art direction`; `docs(w21): close w21 toc print contract`.
