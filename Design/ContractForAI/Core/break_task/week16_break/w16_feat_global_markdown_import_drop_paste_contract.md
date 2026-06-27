# Contract For AI — W16 Feat: Nhập Markdown Toàn Cục (Thả File / Dán / Import Vào Project Đang Mở)

> **Lane:** Core / break_task / week16_break.
> **Branch:** `feat/w16-markdown-import`.
> **Type:** Capability / friction-killer — finding **S1** (High, người làm báo cáo nhanh **buộc phải gõ tay**; cách duy nhất đưa markdown có sẵn vào là template `readme-report` → một ô textarea ẩn trong form init [MetadataForm.tsx:90](src/modules/write/MetadataForm.tsx#L90)), **S2** (Med, [EditorPanel.tsx](src/components/EditorPanel.tsx) đã bắt thả/dán **ảnh** [:79-128](src/components/EditorPanel.tsx#L79) nhưng **không** nhận file `.md`), **S3** (Med, không có cách import vào **project đang mở** — chỉ lúc tạo mới). Gốc nỗi đau #3. Review 2026-06-27.
> **Builds on:** Module 1 write — `importReadme` ([readme-import.ts:8](src/modules/write/readme-import.ts#L8)) đã cắt heading→section sẵn; `EditorPanel` paste/drop ảnh.
> **Sources:** Review 2026-06-27; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Cho người dùng đưa markdown vào **không cần gõ**: chọn/thả file `.md`, dán cả tài liệu, áp vào project đang mở. **Tái dùng** `importReadme` (đã test) — không viết parser mới.

- **S1 — Thả/chọn file `.md` ở cấp workspace.** Thêm affordance "Nhập Markdown" (nút trong topbar/side panel) mở file picker `accept=".md,.markdown,text/markdown"` + vùng kéo-thả. Đọc text → `importReadme(text)` → ra `ReportSection[]`. **Hai chế độ áp:** (a) **Thay** toàn bộ sections (tạo báo cáo từ file), (b) **Chèn** các section mới vào cuối project hiện tại (giữ phần đang viết). Mặc định hỏi qua dialog xác nhận khi project đã có nội dung (chống ghi đè mất bài).
- **S2 — Thả `.md` ngay trong editor.** Mở rộng [handleDrop](src/components/EditorPanel.tsx#L105)/[handlePaste](src/components/EditorPanel.tsx#L79): nếu là file `text/markdown`/`.md` (không phải image) → đọc text và **chèn vào vị trí con trỏ của section hiện tại** (không cắt heading — đây là chèn nội dung, khác với import cấp workspace). Image flow giữ nguyên.
- **S3 — Import vào project đang mở.** Hàm thuần `appendSections(bundle, newSections)` (write module) gắn section mới với `order` nối tiếp + `id` mới (`crypto.randomUUID()`), cập nhật `updatedAt`. Workspace gọi qua handler mới, set `activeId` về section đầu vừa nhập.

> 🔒 **Không viết parser markdown mới** — dùng `importReadme`. Không lib mới.
> 🔒 **Chống mất dữ liệu:** khi project đã có nội dung, "Thay" phải qua dialog xác nhận (giống [reset confirm Workspace.tsx:325](src/components/Workspace.tsx#L325)).
> 🔒 **Token-only + giọng `VoiceAndContent §7`.** Giới hạn kích thước file (vd ≤ 2MB) + báo lỗi nhẹ nếu vượt.

## 2. Scope

### In scope
- [src/modules/write/readme-import.ts](src/modules/write/readme-import.ts) hoặc file mới `import-markdown.ts` (NEW/MODIFY): helper `appendSections`, `replaceSections`; đọc file → text (pure + test được).
- [src/components/EditorPanel.tsx](src/components/EditorPanel.tsx) (MODIFY): drop/paste `.md` → chèn text section hiện tại.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): handler import + state, set activeId.
- Một UI affordance nhập file (nút + dialog) — vị trí: topbar hoặc side panel header cạnh "Tạo report".
- [src/modules/write/index.ts](src/modules/write/index.ts) (MODIFY): export helper mới.

### Out of scope
- ❌ Bật/nối AI (→ `w16_feat_ai_settings_panel_*`, `w16_feat_ai_adapter_*`).
- ❌ Quick-start bỏ form template (→ `w16_feat_quickstart_blank_*`) — contract này chỉ lo *đưa markdown vào*, không lo *bỏ qua form*.
- ❌ Section CRUD/sắp xếp (→ `w16_feat_section_crud_reorder_nav`).
- ❌ MCP/connector (→ `w16_decide_mcp_*`).

## 3. Checklist
- [ ] **S1** Có nút "Nhập Markdown" + file picker + kéo-thả; file `.md` → sections qua `importReadme`.
- [ ] **S1** Chế độ "Thay" hỏi xác nhận khi project có nội dung; "Chèn" nối vào cuối.
- [ ] **S2** Thả/dán `.md` trong editor chèn text tại con trỏ; ảnh vẫn chạy như cũ.
- [ ] **S3** `appendSections`/`replaceSections` thuần, có test; `order`/`id`/`updatedAt` đúng.
- [ ] Vượt kích thước → báo lỗi nhẹ, không crash.
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/import-markdown.ts` | NEW | `appendSections`, `replaceSections`, read-file→text |
| `src/modules/write/import-markdown.test.ts` | NEW | unit thuần |
| `src/components/EditorPanel.tsx` | MODIFY | drop/paste `.md` |
| `src/components/Workspace.tsx` | MODIFY | handler + dialog import |
| `src/modules/write/index.ts` | MODIFY | export helper |
| `src/app/globals.css` | MODIFY | style nút/vùng thả (token) |

> **Import boundary:** không lib mới. Offline (đọc file local, không upload).

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| "Thay" ghi đè mất bài đang viết | High | Dialog xác nhận bắt buộc khi có nội dung; mặc định "Chèn". |
| File `.md` không có heading depth 1–2 | Low | `importReadme` đã gom vào 1 section "Mở đầu" — giữ nguyên hành vi. |
| Drop `.md` lẫn với drop ảnh | Med | Phân nhánh theo `file.type`/đuôi trước khi xử lý; ảnh ưu tiên path cũ. |
| File lớn treo UI | Low | Giới hạn kích thước + đọc async. |

## 6. Verification Plan
- Thả 1 file `.md` nhiều heading → ra đúng số section; mở section đầu.
- Project đang có bài → "Thay" hiện dialog; "Chèn" nối cuối, không mất bài.
- Thả `.md` trong editor → chèn tại con trỏ; thả ảnh → vẫn chèn ảnh.
- 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `feat(write): global markdown import via file drop/paste, append or replace sections`.
