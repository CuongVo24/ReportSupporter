# Contract For AI — W13 Polish: Tabs Count Tái Dùng Badge, Dialog Esc, Field Error Icon & Gallery Inline-Style

> **Lane:** Core / break_task / week13_break.
> **Branch:** `feature/W13-ui-foundation` (hoặc `polish/w13-ui-foundation`).
> **Type:** Consistency / reuse / a11y-nhỏ — findings **S1** (Medium, Tabs count badge không tái dùng `Badge` như w13d), **S2** (Low, Dialog `confirm` chặn cả Esc vượt B9), **S3** (Low, field error dùng glyph `⚠` thay lucide), **S4** (Low, gallery inline-style + raw px drift, tái phạm W11 S2 / W12 S3) — review nhánh W13 (session 2026-06-25).
> **Builds on:** Group D (`Tabs.tsx`, `ui-gallery/page.tsx`), Group B (`Input/Textarea/Select.tsx`), Group C (`Dialog.tsx`).
> **Sources:** Review nhánh W13 (2026-06-25); `month4/W13/w13d` ("count badge dùng `Badge`"), `w13c` (B9 backdrop-close), `w13b` (FormValidation), `Frontend/2.Components/{Tabs,Dialog}.md`; `break_task/week11_break` S2 + `week12_break` S3 (inline-style drift); `DesignSystem_Tokens.md`.

---

## 1. Micro-task Target

Dọn drift **không chặn merge** nhưng lệch contract/nhất quán: (a) Tabs count badge tự code `<span>` riêng thay vì tái dùng primitive `Badge` như w13d quy định; (b) Dialog `confirm` chặn cả Esc trong khi B9 chỉ yêu cầu chặn backdrop; (c) field error dùng ký tự `⚠` thay icon lucide như phần còn lại; (d) gallery dùng inline `style={{}}` + raw px. **Không** đổi behavior happy-path, **không** đổi public surface `ui/index.ts`.

- **S1 — Tabs count badge không tái dùng `Badge` (lệch w13d).** w13d Scope: "count badge (**dùng `Badge`**, nhãn đọc được)". [Tabs.tsx:82-89](src/components/ui/Tabs.tsx) render `<span class="ws-tabs-count-badge">` riêng (kèm `font-size: 10px` hardcode — xem cả `w13_fix_* S3`). Có `aria-label` (đọc được ✓) nhưng **không** tái dùng `Badge` → trùng style + lệch contract. `Badge` hiện chuyên severity/readiness/status (không có biến thể "đếm số") nên có thể là chủ ý tách. **Fix (chọn 1):** dùng `Badge` cho count, **hoặc** giữ tách nhưng **cập nhật w13d** ghi rõ "count badge là phần tử riêng của Tabs, không dùng `Badge`" + token-hoá font-size + sửa report cho khớp. Cốt lõi: đừng để lệch âm thầm.

- **S2 — Dialog `confirm` chặn cả Esc (vượt B9 vốn chỉ yêu cầu chặn backdrop).** [Dialog.tsx:36-40](src/components/ui/Dialog.tsx) `handleEscapeKeyDown` preventDefault khi `shouldBlockDismiss`. B9 chỉ yêu cầu **backdrop-close** bị chặn ở confirm phá huỷ; chặn luôn Esc làm keyboard user khó huỷ nhanh (phải tab tới nút Hủy). **Fix:** mặc định chỉ chặn backdrop (`onPointerDownOutside`), để Esc đóng được; nếu chủ ý chặn Esc cho confirm phá huỷ thì tách cờ riêng + khai báo trong w13c. (Phụ: `description` optional — nếu caller bỏ description, Radix Dialog cảnh báo thiếu `aria-describedby`; cân nhắc `aria-describedby={undefined}` khi không có description.)

- **S3 — Field error dùng glyph `⚠` thay lucide (lệch icon-system).** [Input.tsx:103](src/components/ui/Input.tsx), [Textarea.tsx:140](src/components/ui/Textarea.tsx), [Select.tsx:135](src/components/ui/Select.tsx) render `<span>⚠</span>` (unicode) làm error icon, trong khi mọi primitive khác (Badge/Toast/Dialog/Select-chevron) dùng `lucide-react`. Lỗi vẫn **không-chỉ-màu** (có text + icon) nên không phá a11y, nhưng lệch hệ icon + rủi ro render khác nhau theo font. **Fix:** thay bằng `AlertCircle`/`XCircle` từ `lucide-react`.

- **S4 — Gallery inline-style + raw px (tái phạm drift W11 S2 / W12 S3).** [ui-gallery/page.tsx](src/app/(dev)/ui-gallery/page.tsx) dùng `style={{}}` dày đặc, gồm raw px `margin: "4px 0 0 0"` ([:55](src/app/(dev)/ui-gallery/page.tsx)) và `1px solid` ([:52,66,...](src/app/(dev)/ui-gallery/page.tsx)), icon `size={16}` rải rác. Gallery là dev-only nên **nhẹ**, nhưng đã có tiền lệ chốt đưa style về class token. **Fix:** chí ít thay raw px (`4px`) bằng token; nếu có thời gian gom layout gallery vào 1 CSS co-located `ui-gallery.css` dùng `var(--rs-*)`.

> 🔒 **Không đổi happy-path / public surface.** S1 đổi cách render count (dùng `Badge` hoặc token-hoá), không đổi `TabsTriggerProps` public; S2 chỉ đổi điều kiện dismiss; S3 chỉ đổi icon; S4 chỉ đổi nơi đặt style — không đổi shape primitive / CanonicalTypes / `ui/index.ts`.
> 🔒 **Token-only (Locked #1).** Mọi px/màu mới qua `var(--rs-*)`; token thiếu phải bổ sung `DesignSystem_Tokens.md` trước.
> 🔒 **Giữ a11y Radix.** S2 chỉ chỉnh dismiss, không override focus-trap/return-focus.

## 2. Scope

### In scope
- **S1** [src/components/ui/Tabs.tsx](src/components/ui/Tabs.tsx) (MODIFY): dùng `Badge` cho count **hoặc** giữ tách + token-hoá font; nếu giữ tách → [w13d](Design/ContractForAI/Core/month4/W13/w13d_tabs_component_gallery_contract.md) + [W13_QA_Report.md](Design/Reports/Month4/W13/W13_QA_Report.md) (MODIFY) khai báo rõ.
- **S2** [src/components/ui/Dialog.tsx](src/components/ui/Dialog.tsx) (MODIFY): chỉ chặn backdrop ở confirm, để Esc đóng (hoặc tách cờ + khai báo w13c); cân nhắc `aria-describedby` khi không có description.
- **S3** [Input.tsx](src/components/ui/Input.tsx)/[Textarea.tsx](src/components/ui/Textarea.tsx)/[Select.tsx](src/components/ui/Select.tsx) (MODIFY): error icon → lucide.
- **S4** [ui-gallery/page.tsx](src/app/(dev)/ui-gallery/page.tsx) (MODIFY): raw px → token; (option) `ui-gallery.css` co-located.

### Out of scope
- ❌ Toast error duration, gallery prod-gate, tokenize px CSS toàn cục, overstated "zero px" (→ contract **w13_fix_***).
- ❌ Thêm primitive/feature; đổi shape primitive / CanonicalTypes / `ui/index.ts`.
- ❌ Refactor panel/module (W14); full axe (W15).

## 3. Checklist
- [ ] **S1** Tabs count dùng `Badge` **hoặc** w13d + report ghi rõ tách; font-size count token-hoá.
- [ ] **S2** confirm: Esc đóng được (chỉ backdrop bị chặn) **hoặc** khai báo rõ chủ ý chặn Esc; (phụ) aria-describedby khi không có description.
- [ ] **S3** field error icon dùng lucide; lỗi vẫn icon+text (không-chỉ-màu).
- [ ] **S4** gallery không raw px (ít nhất `4px` → token).
- [ ] 4 gate (lint/typecheck/test/build) xanh.

## 4. Expected Interfaces / Files

> Behavior happy-path + public surface giữ nguyên. Chỉ đổi cách render count, điều kiện dismiss, icon error, nơi đặt style.

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/ui/Tabs.tsx` | MODIFY | S1 count via Badge / token-hoá |
| `src/components/ui/Dialog.tsx` | MODIFY | S2 Esc/backdrop + aria-describedby |
| `src/components/ui/{Input,Textarea,Select}.tsx` | MODIFY | S3 error icon lucide |
| `src/app/(dev)/ui-gallery/page.tsx` | MODIFY | S4 raw px → token |
| `src/app/(dev)/ui-gallery.css` | NEW (option) | gom inline-style gallery |
| `Design/ContractForAI/Core/month4/W13/w13d_*` · `Design/Reports/Month4/W13/W13_QA_Report.md` | MODIFY (nếu S1 chọn giữ tách) | khai báo count badge |

> **Import boundary:** không lib mới; Tabs có thể import `Badge` từ cùng `ui/`. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Đưa count vào `Badge` lỡ đổi shape `Badge` | Medium | Nếu `Badge` không hợp count → giữ tách + khai báo, không ép sửa `Badge`. |
| Bỏ chặn Esc làm confirm phá huỷ dễ đóng nhầm | Low | Vẫn còn nút Hủy + backdrop bị chặn; Esc là kỳ vọng a11y chuẩn. |
| "Polish" lén đổi behavior | Low | MODIFY tối thiểu; không đụng logic/shape. |

## 6. Verification Plan
- Tabs: count badge hiển thị đúng (Badge hoặc token), `aria-label` số đọc được; ←/→/Home/End vẫn chạy.
- Confirm dialog: Esc đóng (nếu chọn không chặn), backdrop **không** đóng; focus trả về trigger.
- Field invalid: icon lucide + error text + `aria-invalid`.
- Gallery: không còn raw px; 4 gate xanh.

## 7. Status

`OPEN — chờ Approve (VibeCode Step 2: chưa chạm src/ tới khi duyệt).`

> Làm **sau** `w13_fix_*` (ưu tiên thấp hơn). Đề xuất commit: `fix(ui): tabs count via Badge (or declare split)`; `fix(ui): dialog confirm allow esc, block backdrop only`; `polish(ui): field error icon to lucide`; `polish(ui): gallery tokens over raw px`.
