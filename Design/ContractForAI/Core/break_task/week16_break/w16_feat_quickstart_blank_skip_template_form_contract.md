# Contract For AI — W16 Feat: Quick-Start / Blank Mode — Bỏ Qua Form Template Để Vào Editor Ngay

> **Lane:** Core / break_task / week16_break.
> **Branch:** `feat/w16-quickstart-blank`.
> **Type:** Onboarding / friction-killer — finding **S1** (High, [Workspace.tsx:166-175](src/components/Workspace.tsx#L166) ép qua `ProjectInitializer` — **chọn template + điền form metadata** [ProjectInitializer.tsx:64-119](src/modules/write/ProjectInitializer.tsx#L64) — mới vào được editor; người làm nhanh bị chặn ngay cửa), **S2** (Med, không có lối "tài liệu trống" hay "dán markdown rồi vào thẳng"). Gốc nỗi đau #4. Review 2026-06-27.
> **Builds on:** Module 1 write — `ProjectInitializer`, `createProjectFromTemplate`, `buildInitialSections`; ăn theo `w16_feat_global_markdown_import_drop_paste`.
> **Sources:** Review 2026-06-27; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Mở **lối vào nhanh** song song với form template — không xóa form (vẫn cần cho báo cáo chuẩn khoa/trường), chỉ thêm đường tắt.

- **S1 — Nút "Bắt đầu nhanh / Tài liệu trống".** Trên màn `ProjectInitializer`, thêm lựa chọn vào thẳng editor với **1 section trống** (`title: "Nội dung", markdown: ""`, status draft) — bỏ qua điền metadata. Title mặc định ("Báo cáo chưa đặt tên") đổi được sau trong topbar. Không bắt buộc trường nào.
- **S2 — "Dán/Nhập markdown rồi vào thẳng".** Lối thứ hai: vùng dán nhanh hoặc tái dùng affordance của `w16_feat_global_markdown_import_drop_paste` ngay tại màn khởi tạo → `importReadme` → vào editor luôn, bỏ qua form. (Nếu W16-import đã làm, contract này chỉ **gọi lại** helper đó, không nhân bản.)
- **S3 — Giữ form template làm lối "chuẩn".** Ba lối hiển thị rõ ràng ở màn đầu: (1) Mẫu chuẩn (form hiện tại), (2) Tài liệu trống, (3) Nhập từ Markdown. Không thay đổi hành vi `onInitialize` cho lối (1).

> 🔒 **Không xóa luồng template hiện tại.** `handleInitialize`/`validateMetadata` cho lối "Mẫu chuẩn" giữ nguyên.
> 🔒 **Title rỗng phải có default an toàn** để export/checker không vỡ (đừng để title="").
> 🔒 **Token-only + giọng `VoiceAndContent §7`.**

## 2. Scope

### In scope
- [src/modules/write/ProjectInitializer.tsx](src/modules/write/ProjectInitializer.tsx) (MODIFY): thêm 2 lối "Tài liệu trống" + "Nhập từ Markdown" cạnh form.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): handler `handleStartBlank` (tạo bundle 1 section trống, `setIsInitializing(false)`), và handler import-vào-thẳng (gọi helper W16-import).
- [src/app/globals.css](src/app/globals.css) (MODIFY): layout 3 lối (token).

### Out of scope
- ❌ Parser/đọc file markdown (→ `w16_feat_global_markdown_import_drop_paste` sở hữu; contract này chỉ gọi lại).
- ❌ Section CRUD (→ `w16_feat_section_crud_reorder_nav`).
- ❌ AI sinh dàn ý (→ `w16_feat_ai_outline_generate_outline`).

## 3. Checklist
- [ ] **S1** Có nút "Tài liệu trống" → vào editor 1 section trống, không bắt điền form.
- [ ] **S2** Có lối "Nhập từ Markdown" ngay màn đầu → vào thẳng editor.
- [ ] **S3** Lối "Mẫu chuẩn" (form) hoạt động y như cũ.
- [ ] Title default an toàn (export/checker không vỡ khi chưa đặt tên).
- [ ] 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/ProjectInitializer.tsx` | MODIFY | 3 lối khởi tạo |
| `src/components/Workspace.tsx` | MODIFY | `handleStartBlank` + import-vào-thẳng |
| `src/modules/write/ProjectInitializer.test.tsx` | MODIFY | thêm ca "blank"/"import" |
| `src/app/globals.css` | MODIFY | style 3 lối (token) |

> **Import boundary:** không lib mới. Offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Title rỗng làm export/checker lỗi | Med | Default "Báo cáo chưa đặt tên"; cho sửa trong topbar. |
| Người mới rối vì 3 lối | Low | Phân cấp rõ: "Mẫu chuẩn" nổi bật, 2 lối tắt phụ. |
| Trùng logic import với W16-import | Med | Bắt buộc gọi lại helper, không nhân bản parser. |

## 6. Verification Plan
- Bấm "Tài liệu trống" → editor mở với 1 section trống, không qua form.
- Bấm "Nhập từ Markdown" → dán/thả → vào editor đúng section.
- Lối "Mẫu chuẩn" vẫn sinh skeleton như trước.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `feat(write): quick-start blank doc and import-from-markdown entry, keep template form`.
