# Contract For AI — W21 Fix (C): Token Hoá Theme CodeMirror Cho Dark Mode (Active Line · Gutter · Selection)

> **Lane:** Core / break_task / week21_break.
> **Branch:** `feature/W25-ui-redesign` (nhánh chung cả tuần).
> **Type:** Dark-mode readiness cho editor. **Nền tảng cho D** (bật toggle không lộ editor chói).
> **Findings:**
> - **S1** (🟠) — **Active line chói trong dark.** `.cm-activeLine` và `.cm-activeLineGutter` dùng `--rs-color-primary-bg` ([editor-setup.ts:93](src/modules/write/editor-setup.ts#L93)-L99) — nền xanh nhạt sáng; ở `[data-theme="dark"]` biến này (`--rs-dark-primary-bg`) chưa chắc đủ tương phản, dòng đang sửa "cháy" trên nền tối.
> - **S2** (🟡) — **Theme editor chưa soi dark toàn diện.** Gutter `--rs-color-text-muted`, active-line-gutter chữ `--rs-color-primary` + bold; selection/`drawSelection` chưa xét tương phản dark. Theme là một `EditorView.theme` tĩnh, chưa có token editor riêng để tinh chỉnh theo bề mặt.
> **Builds on:** `editor-setup.ts` (`createEditorState`, `markdownHighlightStyle`, `EditorView.theme`), token dark ở `globals.css` (`[data-theme="dark"]`, L3344).
> **Sources:** Redesign session 2026-07-10, "việc còn dở" #3 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Token hoá theme CodeMirror để editor hoà nền cả sáng lẫn tối — active line/gutter/selection đọc token đổi được theo `[data-theme]`, không còn dòng active chói khi dark.

- **S1 — Active line theo theme.** Thay `--rs-color-primary-bg` (nền accent sáng) ở `.cm-activeLine`/`.cm-activeLineGutter` bằng token nền **trung tính, tương phản thấp** đổi theo theme (vd `--rs-color-surface-muted`/`--rs-color-surface-hover`, hoặc token editor mới `--rs-color-editor-active-line` định nghĩa cả light & dark). Dark = nền hơi sáng hơn nền editor một bậc, không phải khối xanh.
- **S2 — Gutter & selection.** Gutter/line-number màu `--rs-color-text-muted` (đã đổi theo theme — xác nhận đủ tương phản dark); active-line-gutter dùng `--rs-color-text` thay vì accent bold chói; đảm bảo màu selection (`drawSelection`/`.cm-selectionBackground`) đủ thấy ở dark. Nếu token hiện có không đủ, thêm token editor chuyên biệt vào `DesignSystem_Tokens.md` (không token "ma").

> 🔒 Editor là **UI chrome** ⇒ được phép tối theo theme (khác tờ báo cáo). Nhưng cú pháp markdown (`markdownHighlightStyle`) vẫn phải đọc tốt ở cả hai nền — verify heading/link/quote/code không chìm khi dark.
> 🔒 Token-only, không hex trong `editor-setup.ts`; token mới phải khai báo trong hệ token, cả light lẫn dark.

## 2. Scope

### In scope
- [src/modules/write/editor-setup.ts](src/modules/write/editor-setup.ts) (MODIFY): `EditorView.theme` — active line/gutter/selection dùng token theme-aware; (opt) tinh chỉnh `markdownHighlightStyle` cho tương phản dark.
- [src/app/globals.css](src/app/globals.css) (MODIFY nếu cần): thêm token editor (`--rs-color-editor-active-line`…) trong `:root` + `[data-theme="dark"]` + block `@media prefers-color-scheme`.
- `DesignSystem_Tokens.md` (MODIFY nếu thêm token): ghi token editor mới.

### Out of scope
- ❌ Đổi hành vi editor (shortcut, autosave, search) — chỉ theme/màu.
- ❌ Minimap/fold/line-highlight nâng cao (backlog).
- ❌ Bật toggle dark toàn cục — đó là contract D; C chỉ chuẩn bị để D ra mắt sạch.

## 3. Checklist
- [x] **S1** Active line/gutter dùng token theme-aware; ở dark, dòng active là nền trung tính nhạt, không chói xanh.
- [x] **S2** Gutter/selection/highlight cú pháp đủ tương phản ở cả light & dark; không token "ma".
- [x] Light mode không hồi quy (trước/sau nhìn như cũ).
- [x] Token editor mới (nếu có) khai báo đủ light+dark trong hệ token. 3 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/editor-setup.ts` | MODIFY | theme active line/gutter/selection theo token |
| `src/app/globals.css` | MODIFY | token editor light+dark (nếu thêm) |
| `Design/Modules/Other/DesignSystem_Tokens.md` | MODIFY | ghi token editor mới |

> **Import boundary:** không lib mới; dùng `EditorView.theme` sẵn có.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Biến CSS không resolve trong theme scoped của CM | Low | CM inject class vào cùng DOM `<html data-theme>`; `var()` vẫn cascade — verify runtime ở cả 2 theme. |
| Đổi active-line làm light nhạt quá | Low | Chọn token giữ nguyên cảm giác light; so trước/sau. |
| Token mới trùng/rơi khỏi hệ token | Low | Khai báo trong `DesignSystem_Tokens.md`; lint token ma. |

## 6. Verification Plan
- Set `data-theme="dark"` thủ công (trước khi có D): mở editor — dòng active là nền trung tính, đọc rõ; gutter/số dòng/selection thấy được; cú pháp markdown (heading/link/quote/code) không chìm.
- Set `data-theme="light"`: editor như cũ, không hồi quy.
- Không còn `--rs-color-primary-bg` (accent sáng) ở `.cm-activeLine*`. 3 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ui): align screen table of contents with print art direction`; `docs(w21): close w21 toc print contract`.
