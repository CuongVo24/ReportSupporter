# Contract For AI — W15 Polish: CSS Trùng & Chết (`.ws-shell/.ws-main`) + Viền Đôi `.ws-editor-container`

> **Lane:** Core / break_task / week15_break.
> **Branch:** `polish/w15-css-dedup`.
> **Type:** CSS-hygiene / consistency — finding **S1** (Med, `.ws-shell/.ws-topbar/.ws-main/.ws-editor-container` định nghĩa **ở cả** `globals.css` lẫn `WorkspaceLayout.css`; `.ws-main` grid là layout cũ đã chết), **S2** (Med, `.ws-editor-container` **lồng 2 lần** → viền đôi quanh editor), **S3** (Low, quá nhiều border khắp panel). Gốc lỗi #14 và phần viền của #10. Review toàn dự án (2026-06-26).
> **Builds on:** Group A shell + editor (`globals.css`, `WorkspaceLayout.css`, `Workspace.tsx`, `EditorPanel.tsx`).
> **Sources:** Review 2026-06-26; `week14_break/w14_polish_*` (token-discipline drift pattern).

---

## 1. Micro-task Target

Dọn định nghĩa CSS trùng/chết và bỏ lớp container thừa để viền không nhân đôi. Gốc lỗi #14 (quá nhiều border) + #10 (viền editor nổi). **Không** đổi diện mạo hợp lệ, **không** đổi public surface.

- **S1 — Định nghĩa trùng + layout chết.** `globals.css` có khối shell cũ: `.ws-shell` ([164-168](src/app/globals.css#L164)), `.ws-topbar` ([170-179](src/app/globals.css#L170)), **`.ws-main` grid `1fr 1fr 320px`** ([186-193](src/app/globals.css#L186)) + `@media(max-width:900px)` ([511-516](src/app/globals.css#L511)) — nhưng shell thật dùng `.ws-main-layout` flex ([WorkspaceLayout.css:110](src/components/WorkspaceLayout.css#L110)), **không** dùng `.ws-main` → CSS chết. `.ws-shell`/`.ws-topbar` bị định nghĩa hai nơi (globals + WorkspaceLayout.css:3/13) → khó suy ai thắng. **Fix:** xóa khối layout chết trong `globals.css` (`.ws-main` grid, `.ws-zone*`, `.ws-editor`/`.ws-side` cũ, media 900px nếu không còn tham chiếu); để shell chỉ định nghĩa **một nơi** (WorkspaceLayout.css). Grep xác nhận class bị xóa không còn dùng trong `src/`.
- **S2 — `.ws-editor-container` lồng 2 lần → viền đôi.** [Workspace.tsx:291](src/components/Workspace.tsx#L291) bọc `<div className="ws-editor-container">` (chứa AiAssistBar + wrapper) rồi [EditorPanel.tsx:139](src/components/EditorPanel.tsx#L139) lại render `<div className="ws-editor-container">`. Bản trong `globals.css` ([526-534](src/app/globals.css#L526)) có `border + border-radius + overflow:hidden`; bản trong `WorkspaceLayout.css` ([260-265](src/components/WorkspaceLayout.css#L260)) chỉ flex/gap → tùy thứ tự load, dễ ra **hai khung viền**. **Fix:** đổi tên/đổi class một trong hai (vd lớp ngoài ở Workspace = `ws-editor-stack`, chỉ flex-column gap; lớp trong EditorPanel giữ `ws-editor-container` có viền) để **chỉ một** lớp mang border. Xóa định nghĩa `.ws-editor-container` trùng còn lại.
- **S3 — Quá nhiều border.** Header, ai-bar, toolbar, editor, preview, page, right panel, sidebar, nhiều nút con đều có `border` → không gì nổi bật. **Fix:** giảm border, thay bằng spacing/elevation: ai-bar bỏ khung lớn (xem **w15_polish_ai_assist_bar_***), preview-canvas bớt đường chia, sidebar chỉ `border-right`. Ở contract này chỉ gỡ border **dư do trùng/lồng**; phần thẩm mỹ AI bar tách contract riêng.

> 🔒 **Không đổi diện mạo hợp lệ / public surface.** Chỉ xóa trùng-chết + gỡ một lớp viền; layout/behavior giữ nguyên.
> 🔒 **Token-only.** Không thêm style mới ngoài việc dọn.

## 2. Scope

### In scope
- **S1** [src/app/globals.css](src/app/globals.css) (MODIFY): xóa `.ws-main` grid + shell cũ chết.
- **S2** [src/components/Workspace.tsx](src/components/Workspace.tsx) + [src/components/EditorPanel.tsx](src/components/EditorPanel.tsx) + CSS (MODIFY): tách tên lớp để một viền duy nhất.
- **S3** CSS (MODIFY, hẹp): gỡ border dư do trùng.

### Out of scope
- ❌ AI bar card → toolbar (→ **w15_polish_ai_assist_bar_***).
- ❌ `width:100vw` (→ **w15_fix_shell_100vw_***).
- ❌ Đổi layout/behavior.

## 3. Checklist
- [ ] **S1** `grep -n "ws-main\b\|ws-zone" src/` không còn tham chiếu sống; khối chết đã xóa.
- [ ] **S2** editor chỉ một khung viền; `.ws-editor-container` định nghĩa một nơi.
- [ ] **S3** không còn viền nhân đôi quanh editor.
- [ ] Diện mạo shell không đổi (trừ bớt viền dư); 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` | MODIFY | xóa shell cũ + `.ws-main` grid |
| `src/components/Workspace.tsx` | MODIFY | đổi class lớp ngoài editor |
| `src/components/EditorPanel.tsx` | MODIFY | giữ một lớp viền |
| `src/components/WorkspaceLayout.css` | MODIFY | hợp nhất định nghĩa |

> **Import boundary:** chỉ CSS/class. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Xóa CSS "chết" hóa ra còn dùng | Med | Grep từng class trước khi xóa; xóa kèm verify build. |
| Đổi class editor làm vỡ style | Med | So screenshot trước/sau editor light+dark. |

## 6. Verification Plan
- `grep -rn "ws-main\|ws-zone\|ws-editor\b" src/` → không tham chiếu khối đã xóa.
- Editor: một khung viền duy nhất, không lồng.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `polish(shell): remove dead .ws-main grid + duplicate shell css`; `polish(editor): single bordered container (no nesting)`.
