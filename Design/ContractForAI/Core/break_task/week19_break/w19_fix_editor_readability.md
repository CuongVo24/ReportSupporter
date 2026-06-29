# Contract For AI — W19 Fix: Dễ Đọc Editor (Syntax Highlight + Toolbar Sticky)

> **Lane:** Core / break_task / week19_break.
> **Branch:** `w19/near-completed` (nhánh chung cả tuần).
> **Type:** Editor UX defect (rủi ro thấp, độc lập).
> **Findings:**
> - **S1** (🟠) — **Không syntax highlight**: `createEditorState` nạp `markdown()` (parser) nhưng **thiếu** extension `syntaxHighlighting(HighlightStyle)` ([editor-setup.ts:24-82](src/modules/write/editor-setup.ts#L24)). CodeMirror 6 không tô màu nếu thiếu ⇒ `##`, `**`, `-` đen thui (#16).
> - **S2** (🟠) — **Toolbar không sticky**: `.ws-editor-toolbar` là div flex thường ([EditorPanel.tsx:206](src/components/EditorPanel.tsx#L206)), cuộn là mất (#18).
> - *(Ghi chú)* #22 "không line highlight" thực ra **đã có** `highlightActiveLine()` + `.cm-activeLine` ([editor-setup.ts:31,71](src/modules/write/editor-setup.ts#L31)); chỉ là tương phản yếu → tăng tương phản token (gộp ở đây). #47 search "toàn tài liệu": editor **đã có** `search()` nhưng chỉ per-section → để backlog (cần engine cross-section).
> **Builds on:** `editor-setup.ts`, `EditorPanel.tsx`, `globals.css`.
> **Sources:** Product Review 2026-06-29 (#16, #18, #22).

---

## 1. Micro-task Target

Editor đọc được: tô màu cú pháp markdown, toolbar dính khi cuộn, dòng đang sửa rõ.

- **S1 — Syntax highlight.** Thêm `syntaxHighlighting(HighlightStyle.define([...]))` (hoặc `defaultHighlightStyle`) vào `extensions`, map sang **token màu của design** (`--rs-*`, không hex rời). Heading/bold/list-marker/code/link phân biệt được.
- **S2 — Toolbar sticky.** `.ws-editor-toolbar` `position: sticky; top: 0; z-index;` + nền để không lẫn nội dung khi cuộn.
- **S3 — Tăng tương phản active line** (token) cho con trỏ dễ thấy (#22), không thêm extension mới.

> 🔒 Token-only; map highlight sang biến design, không nhúng hex. Không lib mới (CodeMirror highlight nằm trong `@codemirror/*` đã có).

## 2. Scope

### In scope
- [src/modules/write/editor-setup.ts](src/modules/write/editor-setup.ts) (MODIFY): thêm `syntaxHighlighting`/`HighlightStyle`; tăng tương phản active line.
- [src/components/EditorPanel.tsx](src/components/EditorPanel.tsx) (MODIFY nhẹ): class/markup toolbar nếu cần cho sticky.
- [src/app/globals.css](src/app/globals.css) (MODIFY): `.ws-editor-toolbar` sticky + nền; biến màu highlight (token).
- [src/modules/write/editor-setup.test.ts](src/modules/write/editor-setup.test.ts) (NEW/MODIFY nếu có): assert có extension highlight.

### Out of scope
- ❌ Search/replace toàn tài liệu (#47/#48 — backlog, cần engine cross-section).
- ❌ Minimap/fold/outline (#21/#23/#49 — backlog tính năng).

## 3. Checklist
- [ ] **S1** Markdown tô màu phân biệt heading/bold/list/code/link (token).
- [ ] **S2** Toolbar dính khi cuộn editor.
- [ ] **S3** Active line đủ tương phản. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/editor-setup.ts` | MODIFY | thêm syntaxHighlighting |
| `src/components/EditorPanel.tsx` | MODIFY | markup toolbar sticky |
| `src/app/globals.css` | MODIFY | sticky + màu highlight token |

> **Import boundary:** không lib mới (dùng `@codemirror/language`/`@codemirror/view` đã có gián tiếp; nếu cần `@codemirror/language` chưa có trong deps → ghi rõ khi Approve).

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| `@codemirror/language` chưa nằm trực tiếp trong deps | Med | Kiểm tra `package-lock`; nếu thiếu, dùng `defaultHighlightStyle` từ gói đã có hoặc xin Approve thêm 1 gói nhỏ. |
| Màu highlight chọi nền/tương phản a11y | Low | Map token semantic + kiểm tương phản. |
| Sticky che dòng đầu | Low | Bù `scroll-margin`/padding. |

## 6. Verification Plan
- Gõ `## Tiêu đề`, `**đậm**`, `- mục`, ```code``` → mỗi loại có màu khác nhau.
- Cuộn editor dài → toolbar vẫn hiển thị.
- Con trỏ ở dòng nào thấy rõ dòng đó. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w19/near-completed`): `fix(write): markdown syntax highlighting, sticky editor toolbar and clearer active line`.
