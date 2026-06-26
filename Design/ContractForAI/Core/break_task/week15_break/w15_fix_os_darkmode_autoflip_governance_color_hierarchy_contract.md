# Contract For AI — W15 Fix: App Tự Lật Dark Theo OS (Không Lối Bật/Tắt) + Phân Cấp Màu Tối Yếu

> **Lane:** Core / break_task / week15_break.
> **Branch:** `fix/w15-theme-governance`.
> **Type:** Theme-governance / hierarchy — finding **S1** (Med-High, `@media (prefers-color-scheme:dark)` tự lật toàn app theo OS, không có UI bật/tắt → user Windows-dark bị ép dark, là gốc của khối tối preview + contrast lỗi), **S2** (Low-Med, các `--rs-dark-surface*` quá gần nhau → app shell/editor/toolbar/panel khó phân biệt). Review toàn dự án (2026-06-26).
> **Builds on:** Group D theme (`globals.css`), shell (`layout.tsx`).
> **Sources:** Review 2026-06-26; `week14_break/w14_fix_* S2` (dark "không bật được" — đã ghi nhận); `DesignSystem_Tokens.md §2.5`.

---

## 1. Micro-task Target

Quyết định **dứt khoát** cơ chế theme thay vì để OS âm thầm lật, và tăng phân cấp màu khi tối. Gốc lỗi #13 (phân cấp) và là công tắc gây #4/#9 lộ ra. **Không** đổi token report (A4 trắng-đen luôn).

- **S1 — OS tự lật dark, không có quyền kiểm soát.** [globals.css:2567-2588](src/app/globals.css#L2567) `@media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){…} }` → Windows dark = app dark, dù sản phẩm hướng sinh viên + tờ A4 vốn sáng. Không có toggle nào set `data-theme` (xác nhận lại từ w14_break S2). **Fix (chọn 1, khuyến nghị A):** **(A)** mặc định **light**: đặt `data-theme="light"` ở `<html>` ([layout.tsx](src/app/layout.tsx)) để bỏ auto-dark, dark chỉ bật khi user chủ động; **hoặc (B)** thêm **toggle theme** thật (set `data-theme` + lưu preference) để dark là lựa chọn có ý thức. Tránh trạng thái hiện tại: dark bật ngầm nhưng nhiều bề mặt (preview, toolbar) chưa sẵn sàng cho dark.
- **S2 — Phân cấp màu dark quá phẳng.** [globals.css:127-132](src/app/globals.css#L127): `--rs-dark-bg:#0b1120`, `--rs-dark-surface:#111827`, `--rs-dark-surface-muted:#1e293b`, `--rs-dark-border:#334155`. Shell/editor/toolbar/preview-canvas/panel đều rơi vào dải tối gần nhau → khó tách lớp (lỗi #13). **Fix (nếu giữ dark — B):** giãn thang: app shell tối nhất, surface sáng hơn một bậc, toolbar/elevated thêm một bậc, border rõ hơn; cập nhật `DesignSystem_Tokens.md §2.5`. Nếu chọn (A) light-default thì #13 ở dark thành thứ yếu — vẫn nên ghi chú thang dark cho lần bật.

> 🔒 **`--rs-report-*` bất biến.** Tờ A4 luôn trắng-đen bất kể theme.
> 🔒 **Token-only / no-hex ngoài primitive.** Token dark mới vào primitive + document trước khi dùng.
> 🔒 **Không đổi public surface.** Chỉ governance theme + thang màu.

## 2. Scope

### In scope
- **S1** [src/app/layout.tsx](src/app/layout.tsx) (MODIFY, nếu A): `data-theme="light"` mặc định; **hoặc** [globals.css](src/app/globals.css) + shell (MODIFY, nếu B): toggle + bỏ auto-`prefers-color-scheme`.
- **S2** [src/app/globals.css](src/app/globals.css) (MODIFY, nếu giữ dark): giãn thang `--rs-dark-*`; [DesignSystem_Tokens.md §2.5](Design/Modules/Other/DesignSystem_Tokens.md) (MODIFY).

### Out of scope
- ❌ Màu nội dung preview (đã ở **w15_fix_preview_content_paper_***) — nhưng đây gỡ công tắc.
- ❌ Toolbar hardcode slate (→ **w15_fix_editor_surface_***).
- ❌ Đổi token report.

## 3. Checklist
- [ ] **S1** dark **không** còn tự bật ngầm theo OS; hoặc light-default (A) hoặc có toggle có ý thức (B).
- [ ] **S2** (nếu giữ dark) các lớp shell/surface/toolbar/panel phân biệt được; token document trong `§2.5`.
- [ ] Tờ A4 trắng-đen ở mọi theme.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/layout.tsx` | MODIFY (A) | `data-theme="light"` default |
| `src/app/globals.css` | MODIFY | bỏ/đổi auto-dark (A) hoặc giãn thang (B) |
| `Design/Modules/Other/DesignSystem_Tokens.md` | MODIFY | document thang dark |

> **Import boundary:** không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Bỏ auto-dark làm user thích dark hụt hẫng | Med | Nếu cần dark, chọn (B) toggle thay vì xóa hẳn. |
| Giãn thang đổi diện mạo nhiều | Med | So screenshot trước/sau; chỉnh từng bậc nhỏ. |

## 6. Verification Plan
- OS dark + app: app **không** tự tối (A) / tối chỉ khi bật toggle (B).
- (Nếu dark) phân biệt rõ shell vs editor vs toolbar vs panel.
- A4 preview luôn trắng-đen.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. **Làm trước** các fix lệ thuộc theme (#4/#9 dễ kiểm hơn khi theme xác định). Commit: `fix(theme): stop silent OS dark auto-flip; light is default`; `docs(tokens): widen dark surface ladder`.
