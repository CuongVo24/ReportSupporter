# Contract For AI — W15 Fix: Toolbar Editor Hardcode `slate-700` (Mờ Như Lỗi) + Gutter/Active-Line Lệch Tông

> **Lane:** Core / break_task / week15_break.
> **Branch:** `fix/w15-editor-surface`.
> **Type:** Contrast / theme-fidelity — finding **S1** (Med, nút toolbar `.ws-editor-toolbar-btn` hardcode `color:var(--rs-slate-700)` không theo theme → dark mode tối-trên-tối, trông như disabled/lỗi), **S2** (Low, gutter line-number + active-line của CodeMirror dùng theme mặc định, lệch tông editor + active-line dày/sáng). Review toàn dự án (2026-06-26).
> **Builds on:** Module 1 editor (`EditorPanel.tsx`, `createEditorState`, `globals.css`).
> **Sources:** Review 2026-06-26; lưu ý nút toolbar **không** disabled (luôn bật) — cảm giác "lỗi" là do contrast, không phải state.

---

## 1. Micro-task Target

Trả nút toolbar về theo theme (rõ chữ, rõ border) và đồng bộ tông gutter/active-line. Gốc lỗi #9 và phần thị giác editor của #10. **Không** đổi hành vi chèn snippet.

- **S1 — Toolbar btn hardcode `--rs-slate-700`.** [globals.css:545-556](src/app/globals.css#L545) `.ws-editor-toolbar-btn { color: var(--rs-slate-700); background: var(--rs-color-surface); border: 1px solid var(--rs-color-border); }`. `--rs-slate-700` (#334155) là primitive cố định, **không** lật theme → ở dark mode (surface tối) thành chữ tối trên nền tối, rất mờ. Nút thực ra **luôn enabled** ([EditorPanel.tsx:145-152](src/components/EditorPanel.tsx#L145), không có `disabled`). **Fix:** đổi `color` sang `var(--rs-color-text)` (theo theme); giữ hover state rõ; nếu muốn phân biệt "chèn cần đặt con trỏ", thêm tooltip `title` chứ không hạ contrast. Nút phải rõ là click được.
- **S2 — Gutter/active-line theme mặc định.** `createEditorState` (trong `@/modules/write`) dựng CodeMirror chưa custom gutter/active-line → gutter nền lệch với editor tối, active-line (dòng 6 trong ảnh) dày & sáng quá. **Fix:** thêm `EditorView.theme` tối thiểu cho gutter (cùng nền editor, chữ muted), active-line (highlight dịu), padding trái/phải đồng đều — dùng biến CSS token để khớp light/dark. Giữ trong `createEditorState` để mọi nơi nhất quán.

> 🔒 **Không đổi hành vi chèn / public surface.** `insertSnippet`, paste/drop ảnh giữ nguyên.
> 🔒 **Token-only.** Màu editor qua `var(--rs-color-*)`; không hardcode primitive trong UI.

## 2. Scope

### In scope
- **S1** [src/app/globals.css](src/app/globals.css) (MODIFY): `.ws-editor-toolbar-btn` color theo theme + tooltip nếu cần.
- **S2** `src/modules/write` `createEditorState` (MODIFY): `EditorView.theme` cho gutter/active-line/padding (token).

### Out of scope
- ❌ Viền đôi `.ws-editor-container` (→ **w15_polish_duplicate_dead_css_***).
- ❌ AI bar (→ **w15_polish_ai_assist_bar_***).
- ❌ Đổi logic insert/paste.

## 3. Checklist
- [ ] **S1** nút toolbar rõ chữ ở cả light/dark; hover rõ; (tùy) tooltip "đặt con trỏ để chèn".
- [ ] **S2** gutter cùng tông editor; active-line dịu; padding trái/phải đều.
- [ ] Chèn snippet/paste ảnh không đổi.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/globals.css` | MODIFY | toolbar btn color theo theme |
| `src/modules/write/*` (`createEditorState`) | MODIFY | CodeMirror theme gutter/active-line |

> **Import boundary:** `@codemirror/view` đã có; không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| CM theme override màu cú pháp | Med | Chỉ set gutter/active-line/padding; không đụng token cú pháp. |
| Tooltip che nội dung | Low | Dùng `title` native, không popover. |

## 6. Verification Plan
- Light & dark: 6 nút toolbar rõ, click được; hover đổi nền.
- Editor: gutter hòa tông, active-line dịu, padding đều; chèn Bảng/Code/Ảnh chạy.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `fix(editor): toolbar buttons follow theme color (not hardcoded slate)`; `fix(editor): theme CodeMirror gutter/active-line to match surface`.
