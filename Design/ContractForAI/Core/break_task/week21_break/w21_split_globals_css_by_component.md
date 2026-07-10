# Contract For AI — W21 Fix (A): Tách `globals.css` Monolith Theo Component (Thuần Cơ Học · Giữ Cascade)

> **Lane:** Core / break_task / week21_break.
> **Branch:** `feature/W25-ui-redesign` (nhánh chung cả tuần).
> **Type:** Nợ kiến trúc CSS — refactor thuần cơ học. **Land CUỐI tuần** để không churn/va chạm với B, C, D (đều sửa `globals.css`).
> **Findings:**
> - **S1** (🟠) — **Một file 3.7K dòng cho mọi component.** `globals.css` (3716 dòng) gom style của command palette, editor, preview, checker, readiness, TOC, export, submission, evidence, present, AI toolbar, states, focus rings, report health, snapshot, recovery hub… trong một file ([globals.css:1](src/app/globals.css#L1)). Sửa một component phải cuộn giữa biển selector; review diff ồn; nhiều contract cùng đụng file dễ va chạm.
> - **S2** (🟡) — **Đã có ranh giới comment sẵn, chưa tận dụng.** File **đã** phân khu bằng comment (`/* … extracted styles */`, `/* ===== … ===== */`, `/* PreviewPane extracted styles */`, `/* Report health */`…) ([globals.css:740](src/app/globals.css#L740), [globals.css:3422](src/app/globals.css#L3422)) — sẵn đường cắt tự nhiên để tách file.
> **Builds on:** `globals.css` (toàn bộ), `layout.tsx` (`import "./globals.css"`).
> **Sources:** Redesign session 2026-07-10, "việc còn dở" #1 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Tách `globals.css` thành nhiều file theo component/khu vực, **không đổi một byte giá trị CSS nào** — chỉ di dời + `@import`/layer, giữ nguyên **thứ tự cascade & độ đặc hiệu**. Kết quả: `globals.css` chỉ còn `:root` (token), reset/base, và chuỗi `@import` theo đúng thứ tự cũ.

- **S1 — Cắt theo ranh giới comment sẵn có.** Mỗi khu (`command-palette`, `editor`, `preview`, `checker`, `readiness`, `toc`, `export`, `submission`, `evidence`, `present`, `ai-toolbar`, `states`, `focus-rings`, `report-health`, `snapshot`, `recovery-hub`, `dark-theme`, `print/reduced-motion`) → một file `src/app/styles/<khu>.css`.
- **S2 — Giữ cascade tuyệt đối.** Thứ tự `@import` trong `globals.css` **bằng đúng** thứ tự khối trong file gốc. Token `:root`, reset, `[data-theme="dark"]`, `@media prefers-color-scheme`, `@media print`, `prefers-reduced-motion` giữ nguyên vị trí tương đối. Cân nhắc `@layer` để phòng hồi quy đặc hiệu, nhưng **chỉ** nếu không đổi kết quả tính toán.

> 🔒 **Zero thay đổi hành vi/giá trị.** Không đổi màu, kích thước, selector, thứ tự. Bất kỳ tinh chỉnh style nào là **ngoài phạm vi** — thuộc B/C/D hoặc contract khác.
> 🔒 Verify bằng **pixel-parity** (diff ảnh các màn hình chính trước/sau), không chỉ đọc code.

## 2. Scope

### In scope
- [src/app/globals.css](src/app/globals.css) (MODIFY): rút còn `:root` + reset/base + chuỗi `@import` đúng thứ tự.
- `src/app/styles/*.css` (NEW): mỗi component/khu một file, nội dung cắt nguyên văn từ khối tương ứng.
- [src/app/layout.tsx](src/app/layout.tsx) (KHÔNG đổi): vẫn `import "./globals.css"` — các file con vào qua `@import` trong globals.

### Out of scope
- ❌ Đổi bất kỳ giá trị/selector CSS nào (màu, spacing, radius…).
- ❌ Đổi sang CSS Modules / CSS-in-JS / Tailwind — chỉ tách file thuần.
- ❌ Gộp/dedupe selector trùng (có thể là bước sau; W21 chỉ **di dời**).
- ❌ Đụng `print-css.ts` (CSS in sinh runtime, không phải `globals.css`).

## 3. Checklist
- [x] **S1** Mỗi khu → một file trong `src/app/styles/`; `globals.css` chỉ còn token + reset + `@import`.
- [x] **S2** Thứ tự `@import` = thứ tự khối gốc; token/dark/print/reduced-motion đúng vị trí.
- [x] Không đổi giá trị CSS nào (diff chỉ là di chuyển dòng).
- [x] Pixel-parity: màn hình chính trước/sau khớp (diff ảnh). Build/lint xanh. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` | MODIFY | còn `:root` + reset + `@import` |
| `src/app/styles/editor.css` … `snapshot.css`, `dark-theme.css`, `print.css` | NEW | mỗi khu một file, cắt nguyên văn |
| `src/app/layout.tsx` | KHÔNG đổi | import globals như cũ |

> **Import boundary:** không lib mới; dùng `@import` CSS thuần (hoặc `@layer` nếu an toàn).

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Đổi thứ tự `@import` lật đè selector | High→mitigated | `@import` đúng thứ tự khối gốc; diff ảnh trước/sau bắt hồi quy. |
| Bỏ sót khối / cắt nhầm biên | Med | Cắt theo comment mốc sẵn; đếm dòng tổng trước/sau khớp. |
| `@layer` đổi độ đặc hiệu ngoài ý muốn | Med | Chỉ dùng nếu chứng minh không đổi kết quả; nếu ngờ, bỏ layer, chỉ `@import`. |
| Perf nhiều request CSS (dev) | Low | Next bundle gộp khi build; chấp nhận ở dev. |

## 6. Verification Plan
- Chụp ảnh các màn hình chính (khởi tạo, editor+preview, checker, export, evidence, present, health, snapshot) **trước** khi tách → làm mốc.
- Sau khi tách: chụp lại, diff ảnh — không khác biệt pixel.
- `git diff` cho thấy toàn bộ là **di chuyển dòng** (không sửa giá trị).
- `npm run build`/lint xanh; app chạy không mất style. 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ui): align screen table of contents with print art direction`; `docs(w21): close w21 toc print contract`.
