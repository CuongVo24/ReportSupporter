# Contract For AI — W23 Fix (C): Toolbar Chèn Block Phá Cấu Trúc · "Chèn Ảnh" Placeholder Chết · aria-label Editor Stale

> **Lane:** Core / break_task / week23_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug correctness editor + a11y. Cùng file `EditorPanel`/`insert-snippet`.
> **Findings:**
> - **S1** (🟠) — **`insertSnippet` không nhận biết ngữ cảnh block.** Hàm chỉ thêm **một** newline dẫn đầu khi `doc[from-1] !== "\n"` ([insert-snippet.ts:17](src/modules/write/insert-snippet.ts#L17),L62-L65), **không** kiểm tra con trỏ đang nằm trong fence ```` ``` ````, bảng, hay math `$$`. QA: bấm lần lượt 6 nút toolbar (bảng→code→math→mermaid→callout→ảnh) tại một vị trí → code block chui vào **giữa hàng bảng**, khối `mermaid` nằm **trong** fence ```text, `$$` bị **tách đôi**; markdown hỏng hoàn toàn, không cảnh báo. `handleInsert` dispatch thẳng kết quả ([EditorPanel.tsx:90](src/components/EditorPanel.tsx#L90)-L103).
> - **S2** (🟠) — **"Chèn ảnh" chỉ chèn placeholder chết.** `case "image"` chèn literal `![Mô tả ảnh](image:asset_id)` ([insert-snippet.ts:52](src/modules/write/insert-snippet.ts#L52)); nút không mở trình chọn ảnh, `image:asset_id` là id giả không resolve được ([resolve-assets.ts:4](src/modules/write/resolve-assets.ts#L4)). Người dùng phải tự biết cú pháp asset — không khả dụng.
> - **S3** (🟡) — **aria-label editor stale (tàn dư W22-A).** `EditorView` tạo **một lần** trong `useEffect([])`; `ariaLabel` truyền vào `createEditorState` chỉ tại init ([EditorPanel.tsx:62](src/components/EditorPanel.tsx#L62)-L88, L73). W22-A đã forward `onChange`/`onSave` qua `onChangeRef`/`onSaveRef` ([EditorPanel.tsx:35](src/components/EditorPanel.tsx#L35)-L45) nhưng **bỏ sót `ariaLabel`**: khi đổi mục, prop `ariaLabel={`Editor: ${activeSection.title}`}` ([Workspace.tsx:1178](src/components/Workspace.tsx#L1178)) cập nhật nhưng `contentAttributes` của view sống **không** đổi ⇒ screen-reader luôn đọc "Editor: Mở đầu" (mục đầu).
> **Builds on:** `insert-snippet.ts`, `EditorPanel.tsx` (`handleInsert`, init effect, `createEditorState`), `editor-setup.ts` (`contentAttributes`/`ariaLabel`), cơ chế asset offline (`resolve-assets.ts`, IndexedDB).
> **Sources:** QA session 2026-07-13, phát hiện #4–#6 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Chèn qua toolbar **luôn** sinh markdown hợp lệ (block mới tách khỏi block đang chứa con trỏ); "Chèn ảnh" mở **trình chọn ảnh offline** thật; aria-label editor **theo đúng mục** đang mở.

- **S1 — Chèn theo ngữ cảnh block.** Trước khi chèn block (table/code/math/mermaid/callout), dùng CodeMirror `syntaxTree`/phân tích dòng để phát hiện con trỏ đang trong fence/bảng/math; nếu có, chèn **sau khi thoát** block đó với **blank line ngăn cách trên-dưới**. Không phá undo (một transaction).
- **S2 — Trình chọn ảnh thật.** Nút "Chèn ảnh" mở file picker (`accept="image/*"`), lưu asset offline (base64/IndexedDB như luồng import ảnh sẵn có), rồi chèn `![alt](asset:<id-thật>)` resolve được. Giữ shortcut Ctrl+Shift+I.
- **S3 — aria-label tươi.** Khi `ariaLabel` đổi, reconfigure/re-dispatch `contentAttributes` cho `EditorView` sống (giống pattern ref W22-A) — **không** remount (giữ undo/scroll/focus).

> 🔒 Không remount editor mỗi lần đổi mục (mất undo/scroll) — dùng ref/reconfigure.
> 🔒 Ảnh **offline**, không upload server; dùng cơ chế asset sẵn có. Không lib mới.

## 2. Scope

### In scope
- [src/modules/write/insert-snippet.ts](src/modules/write/insert-snippet.ts) (MODIFY): nhận thêm ngữ cảnh (dòng/block hiện tại) hoặc trả tín hiệu để caller quyết định điểm chèn an toàn; bảo đảm blank-line ngăn cách block.
- [src/components/EditorPanel.tsx](src/components/EditorPanel.tsx) (MODIFY): `handleInsert` xác định ngữ cảnh block qua `syntaxTree(view.state)`; nút ảnh mở picker + lưu asset + chèn ref thật; reconfigure `contentAttributes` khi `ariaLabel` đổi.
- [src/modules/write/editor-setup.ts](src/modules/write/editor-setup.ts) (MODIFY nếu cần): expose `Compartment` cho `contentAttributes` để đổi ariaLabel không remount.
- Cơ chế asset offline (REUSE): dùng lại converter/lưu ảnh của luồng import kèm ảnh.
- Test (NEW/UPDATE): chèn code khi con trỏ giữa bảng → block nằm **ngoài** bảng, markdown parse đúng; ảnh chèn ra `asset:` resolve được; ariaLabel đổi theo mục.

### Out of scope
- ❌ Trình soạn ảnh (crop/resize), thư viện ảnh.
- ❌ Đổi cú pháp asset/`resolve-assets` (chỉ dùng đúng).
- ❌ Chèn snippet mới ngoài 6 loại hiện có.

## 3. Checklist
- [ ] **S1** Chèn 6 block liên tiếp tại một vị trí → markdown vẫn hợp lệ (không lồng block).
- [ ] **S1** Chèn khi con trỏ trong fence/bảng/math → block mới nằm ngoài, có blank line ngăn cách.
- [ ] **S2** "Chèn ảnh" mở picker, lưu asset offline, chèn ref resolve được (preview hiện ảnh).
- [ ] **S3** Đổi mục → aria-label editor đổi theo tên mục; screen-reader đọc đúng.
- [ ] Undo/redo/scroll/focus không hồi quy. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/insert-snippet.ts` | MODIFY | ngữ cảnh block; blank-line ngăn cách |
| `src/components/EditorPanel.tsx` | MODIFY | syntaxTree cho handleInsert; image picker; reconfigure ariaLabel |
| `src/modules/write/editor-setup.ts` | MODIFY nếu cần | Compartment cho contentAttributes |
| `src/modules/write/insert-snippet.test.ts` | NEW/UPDATE | test chèn trong-block, ảnh, aria-label |

> **Import boundary:** dùng `@codemirror/language` (`syntaxTree`) đã có qua lang-markdown; không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Phát hiện block sai (nested/edge) làm chèn lệch | Med | Dùng `syntaxTree` chính thức thay vì regex; test các mép fence/bảng/math. |
| Reconfigure contentAttributes gây re-layout nhấp nháy | Low | Dùng `Compartment.reconfigure` chỉ khi ariaLabel đổi; không đổi doc. |
| Image picker lưu asset trùng/rò bộ nhớ | Low | Tái dùng store asset import (đã test); id ổn định. |
| Đổi insert-snippet phá test hiện có | Low | Giữ chữ ký cũ tương thích hoặc cập nhật test đồng bộ. |

## 6. Verification Plan
- Gõ một bảng, đặt con trỏ giữa hàng dữ liệu, bấm "Chèn code": code block xuất hiện **sau** bảng, cách một dòng trống; preview render cả bảng lẫn code đúng.
- Bấm lần lượt 6 nút toolbar tại một vị trí trong đoạn văn: mỗi block tách bạch, `parseMarkdown` không lỗi, preview đúng.
- Bấm "Chèn ảnh" → chọn file PNG → ảnh lưu offline, chèn `![…](asset:<id>)`, preview hiện ảnh; xuất HTML nhúng base64.
- Đổi mục 1→4: đọc DOM `.cm-content` aria-label = "Editor: <tên mục 4>". Undo sau chèn hoạt động. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `fix(editor): context-aware block insert, real image picker, and live aria-label`.
