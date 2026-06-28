# Contract For AI — W17 Fix: Màn "Báo Cáo Trống" Có Lối Thoát (Recovery Hub)

> **Lane:** Core / break_task / week17_break.
> **Branch:** `w17/upgrade-ux` (nhánh chung cả tuần — không tách nhánh con).
> **Type:** Bugfix / UX dead-end — finding **S1** (High, [Workspace.tsx:634-646](src/components/Workspace.tsx#L634) nhánh `!activeSection` render `EmptyState` **không** truyền `actionLabel`/`onAction` và set `sidePanel={null}` → người dùng kẹt cứng), **S2** (Med, [Workspace.tsx:255-280](src/components/Workspace.tsx#L255) `executeDeleteSection` đặt `activeId = null` khi xóa mục cuối → rơi thẳng vào ngõ cụt). Review 2026-06-28.
> **Builds on:** Module 1 write; handler có sẵn `handleCreateSection` ([Workspace.tsx:178-198](src/components/Workspace.tsx#L178)), dialog import ([Workspace.tsx:869-953](src/components/Workspace.tsx#L869)), cờ `isInitializing` → `ProjectInitializer` ([Workspace.tsx:619-632](src/components/Workspace.tsx#L619)), `EmptyState` đã hỗ trợ action ([EmptyState.tsx:8-9,25-29](src/components/states/EmptyState.tsx#L8)).
> **Sources:** Review 2026-06-28; `VoiceAndContent.md §7`; `Design/Frontend/3.Patterns/EmptyStates.md`.

---

## 1. Micro-task Target

Biến màn "Báo cáo trống" từ **ngõ cụt** thành **hub có lối thoát**: người dùng luôn có ít nhất 3 đường đi tiếp — thêm mục, nhập Markdown, về trang bắt đầu. Tái dùng tối đa handler đã có; **không thêm lib**.

- **S1 — Empty Recovery Hub.** Thay nhánh `!activeSection` ([Workspace.tsx:634-646](src/components/Workspace.tsx#L634)) bằng một màn có hành động. Tối thiểu: hiển thị 3 affordance rõ ràng — **"Thêm mục đầu tiên"** (→ `handleCreateSection`), **"Nhập Markdown"** (→ mở `isImportDialogOpen`), **"Về trang bắt đầu / Tạo báo cáo"** (→ set `isInitializing = true`, quay lại `ProjectInitializer`). Ưu tiên tách component `EmptyReportHub` (giống `ProjectInitializer` thu nhỏ, 3 lựa chọn lớn) thay vì chỉ nhồi 1 nút vào `EmptyState`.
- **S2 — Không rơi vào ngõ cụt khi side panel null.** Đảm bảo các nút "Nhập Markdown" + "Tạo báo cáo" **không phụ thuộc `sidePanel`** ở trạng thái rỗng (hiện đang nằm trong `sidePanel` bị set `null`). Đưa hành động vào hub trung tâm, hoặc giữ side panel khả dụng ở trạng thái này.
- **S3 — Hành vi xóa mục cuối.** Quyết định lúc Approve: **(mặc định)** hiện `EmptyReportHub` có nút; **(biến thể)** tự set `isInitializing = true` về `ProjectInitializer` khi `sections.length === 0`. Dù chọn cách nào, **không được** để màn không-hành-động.
- **S4 — Microcopy + a11y.** Tiêu đề/nút theo `VoiceAndContent §7`; nút có label rõ, focus-visible, điều hướng bằng bàn phím; `dialog`/nút giữ `aria-*`.

> 🔒 **Luôn có ≥1 lối thoát hành động được** ở mọi trạng thái rỗng — đây là tiêu chí đậu/rớt của contract.
> 🔒 **Không thêm lib.** Chỉ tái dùng handler + component đã có.
> 🔒 **Không phá `ReportSection` shape / luồng autosave / IndexedDB.** Chỉ wiring UI + state có sẵn.

## 2. Scope

### In scope
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): thay nhánh `!activeSection`; nối nút Thêm mục / Nhập Markdown / Tạo báo cáo; (tùy chọn S3) tự về `ProjectInitializer` khi rỗng.
- [src/components/states/EmptyReportHub.tsx](src/components/states/EmptyReportHub.tsx) (NEW, nếu chọn tách component): hub 3 lựa chọn, token-only.
- [src/components/states/index.ts](src/components/states/index.ts) (MODIFY, nếu NEW component): export.
- [src/components/states/EmptyState.tsx](src/components/states/EmptyState.tsx) (MODIFY, nếu chọn bản tối thiểu): dùng sẵn `actionLabel`/`onAction` — không cần đổi, chỉ truyền props từ Workspace.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style hub (token).
- [src/components/Workspace.test.tsx](src/components/Workspace.test.tsx) hoặc test tương đương (NEW/MODIFY): xóa mục cuối → màn rỗng có nút; bấm "Thêm mục đầu tiên" → có section + focus editor.

### Out of scope
- ❌ Đổi logic CRUD/reorder section (đã xong W16 `section-crud`).
- ❌ Tính năng PPTX (→ `w17_feat_present_export_pptx`).
- ❌ AI (không đụng cấu hình/adapter AI).

## 3. Checklist
- [ ] **S1** Màn rỗng hiển thị 3 lối thoát; "Thêm mục đầu tiên" tạo section + focus editor.
- [ ] **S1** "Nhập Markdown" mở dialog import và nhập được vào báo cáo rỗng.
- [ ] **S1** "Về trang bắt đầu" đưa về `ProjectInitializer` (template/blank/AI outline).
- [ ] **S2** Không trạng thái nào kẹt cứng (side panel null không còn che mất hành động).
- [ ] **S3** Hành vi xóa-mục-cuối đúng theo quyết định Approve (hub có nút / tự về initializer).
- [ ] **S4** Microcopy `§7`, a11y (keyboard + aria) giữ nguyên. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/Workspace.tsx` | MODIFY | thay nhánh `!activeSection`, wiring hành động |
| `src/components/states/EmptyReportHub.tsx` | NEW* | hub 3 lựa chọn (nếu chọn bản tách component) |
| `src/components/states/index.ts` | MODIFY* | export hub mới |
| `src/app/globals.css` | MODIFY | style (token) |
| `src/components/Workspace.test.tsx` | NEW/MODIFY | test thoát ngõ cụt |

> *NEW: chỉ khi chọn bản "hub tách riêng"; bản tối thiểu chỉ MODIFY `Workspace.tsx` (+truyền `actionLabel`/`onAction` cho `EmptyState`, giữ side panel).
> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Trạng thái rỗng vẫn còn nhánh nào kẹt | High | Test E2E xóa-mục-cuối + render hub; checklist S2 là gate. |
| `isInitializing=true` xóa nhầm bundle hiện có | Med | "Về trang bắt đầu" chỉ đổi view, **không** reset dữ liệu; reset thật vẫn qua dialog "Tạo báo cáo" có xác nhận. |
| Trùng lặp UI với `ProjectInitializer` | Low | Hub là bản rút gọn, dẫn về initializer cho luồng đầy đủ. |
| Lệch microcopy/a11y | Low | Theo `§7` + giữ aria/focus. |

## 6. Verification Plan
- Xóa hết mục → màn rỗng hiện 3 nút, không kẹt.
- Bấm "Thêm mục đầu tiên" → có 1 section mới, con trỏ vào editor.
- Bấm "Nhập Markdown" → dialog mở, nhập file → báo cáo có nội dung.
- Bấm "Về trang bắt đầu" → `ProjectInitializer` hiện, chọn template/blank/AI hoạt động.
- Keyboard-only đi hết được các nút; 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w17/upgrade-ux`): `fix(write): empty report becomes a recovery hub with add/import/restart exits`.
