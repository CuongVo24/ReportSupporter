# Contract For AI — W22 Fix (A): Stale Callback CodeMirror Ghi Đè Nội Dung Khi Chuyển Mục (Mất Dữ Liệu)

> **Lane:** Core / break_task / week22_break.
> **Branch:** `feature/W25-ui-redesign` (nhánh chung cả tuần).
> **Type:** Bug P0 — mất dữ liệu. **Keystone tuần**, làm trước tiên.
> **Findings:**
> - **S1** (🔴) — **Chuyển mục ghi đè nội dung mục trước.** `EditorPanel` tạo `EditorView` một lần trong `useEffect(…, [])` ([EditorPanel.tsx:48](src/components/EditorPanel.tsx#L48)-L70), `createEditorState` gắn `opts.onChange` vào `updateListener` **tại thời điểm tạo** ([editor-setup.ts:39](src/modules/write/editor-setup.ts#L39)-L43). `handleChange` đóng kín trên `activeId` ([Workspace.tsx:209](src/components/Workspace.tsx#L209)-L220) và `EditorPanel` **không có `key` theo mục** ([Workspace.tsx:1203](src/components/Workspace.tsx#L1203)) ⇒ editor giữ mãi `onChange` của lần render đầu (bound `activeId` = mục đầu). Khi chuyển mục, effect đồng bộ ([EditorPanel.tsx:35](src/components/EditorPanel.tsx#L35)-L45) `dispatch` thay toàn bộ `doc` bằng nội dung mục mới → `update.docChanged === true` → `onChange` **cũ** ghi nội dung mục **mới** vào mục **cũ**. Người dùng không thấy ngay; khi quay lại mục cũ thì nội dung đã bị đè.
> - **S2** (🔴) — **Autosave + Ctrl+S lưu bản hỏng.** `handleChange` cập nhật `bundle.project.sections` sai mục rồi throttled-save xuống IndexedDB ([autosave.ts:50](src/modules/write/autosave.ts#L50)); `opts.onSave` (Ctrl+S trong editor) bind cùng cách một lần ⇒ lưu thủ công cũng vào nhầm mục. Mất mát được **persist**, không chỉ ở bộ nhớ.
> **Builds on:** `EditorPanel.tsx`, `editor-setup.ts` (`createEditorState`, `updateListener`), `Workspace.tsx` (`handleChange`, `handleManualSave`, `activeId`).
> **Sources:** QA session 2026-07-10 (drive dev server), phát hiện #1–#2 [[w25-ui-redesign]].

---

## 1. Micro-task Target

Bảo đảm mọi thay đổi editor **luôn** ghi vào **đúng mục đang mở**: callback `onChange`/`onSave` phải phản ánh `activeId` hiện tại, và effect đồng bộ khi chuyển mục **không** được kích hoạt `onChange` như một chỉnh sửa của người dùng.

- **S1 — Callback luôn "tươi".** Chọn cách tối thiểu rủi ro (xem §5): forward `onChange`/`onSave` qua `ref` để `updateListener` luôn gọi bản mới nhất **mà không remount** editor. Bảo toàn undo-history, cuộn, focus khi chuyển mục.
- **S1b — Phân biệt "người dùng gõ" với "đồng bộ mục".** Khi effect đồng bộ dispatch thay `doc` lúc đổi mục, **không** để lần `docChanged` đó chảy ngược thành `onChange` ghi state (dùng transaction annotation/flag để bỏ qua, hoặc so sánh & chỉ ghi khi nguồn là người dùng).
- **S2 — Lưu đúng mục.** Sau S1, autosave và Ctrl+S ghi vào mục đang mở; verify bản trên IndexedDB đúng.

> 🔒 **Không mất dữ liệu, im lặng là cấm.** Sau fix, chuyển A→B→A phải thấy nội dung A nguyên vẹn.
> 🔒 Không đổi public surface `ReportSection`; không thêm lib; sửa nội bộ vòng editor↔state.

## 2. Scope

### In scope
- [src/components/EditorPanel.tsx](src/components/EditorPanel.tsx) (MODIFY): giữ `onChange`/`onSave` trong `ref`, cập nhật mỗi render; init effect gọi qua ref; bảo đảm effect đồng bộ `[value]` không sinh `onChange` ghi state.
- [src/modules/write/editor-setup.ts](src/modules/write/editor-setup.ts) (MODIFY nếu cần): cho `updateListener` đọc callback qua getter/ref; (tuỳ chọn) annotation đánh dấu transaction "programmatic" để bỏ qua.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY nhẹ nếu cần): bảo đảm `handleChange`/`handleManualSave` ghi theo `activeId` hiện tại (functional update, không phụ thuộc closure cũ).
- Test hồi quy (NEW): mô phỏng gõ ở mục A → chuyển B → gõ ở B → quay lại A: nội dung A và B đúng, độc lập.

### Out of scope
- ❌ Đổi cơ chế autosave/throttle (`createThrottledSaver`) — chỉ đảm bảo nó nhận đúng mục.
- ❌ Tính năng editor mới (đa con trỏ, đồng biên tập…).
- ❌ Đổi cấu trúc `bundle`/`ReportSection`.

## 3. Checklist
- [x] **S1** Gõ ở mục đang mở ghi đúng mục; chuyển mục **không** đè mục cũ (callback luôn tươi).
- [x] **S1b** Effect đồng bộ khi đổi mục không kích hoạt ghi state; không vòng lặp.
- [x] **S2** Autosave + Ctrl+S lưu đúng mục; bản IndexedDB xác nhận đúng.
- [x] Undo/redo, focus, vị trí cuộn không hồi quy khi chuyển mục.
- [x] Test hồi quy A→B→A xanh; 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/EditorPanel.tsx` | MODIFY | ref cho onChange/onSave; init qua ref; chặn onChange do sync |
| `src/modules/write/editor-setup.ts` | MODIFY | updateListener đọc callback tươi; (opt) annotation programmatic |
| `src/components/Workspace.tsx` | MODIFY nhẹ | (Không cần thiết vì ref forwarding ở EditorPanel đã bảo đảm callbacks luôn nhận đúng activeId và bundle mới nhất mà không mất undo-history/scroll) |
| `src/components/EditorPanel.test.tsx` | NEW | test hồi quy A→B→A không mất dữ liệu |

> **Import boundary:** không lib mới; dùng `useRef`/`EditorView` sẵn có.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Fix bằng `key={id}` làm mất undo-history/scroll mỗi lần đổi mục | Med | Ưu tiên **cách ref** (giữ instance); chỉ dùng `key` nếu ref bất khả thi, và chấp nhận reset có chủ đích. |
| Effect `[value]` vẫn lọt onChange gây vòng | Med | Đánh dấu transaction programmatic (annotation) hoặc set cờ `isSyncing` quanh dispatch; test không vòng. |
| Ghi đúng mục nhưng chậm do re-subscribe | Low | Ref không re-subscribe listener; chỉ đổi hàm được gọi. |
| Autosave lưu giữa lúc chuyển mục | Low | `flush()`/ghi theo `activeId` snapshot tại thời điểm sự kiện người dùng. |

## 6. Verification Plan
- Tạo báo cáo template (7 mục). Gõ "AAA" vào mục 1 → chuyển mục 4 → gõ "BBB" → quay lại mục 1: thấy "AAA" (không phải "BBB"/nội dung mục 4). Lặp qua vài mục.
- Ctrl+S ở mục 4 → reload trang → mục 4 có nội dung mục 4, mục 1 có nội dung mục 1 (IndexedDB đúng).
- Undo (Ctrl+Z) sau khi gõ vẫn hoạt động trong mục hiện tại; chuyển mục rồi undo không "nhảy" nội dung xuyên mục.
- Test hồi quy tự động A→B→A xanh. 4 gate (lint/typecheck/test/build) xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `feat(ui): align screen table of contents with print art direction`; `docs(w21): close w21 toc print contract`.
