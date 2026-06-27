# Contract For AI — W16 Feat: Section Linh Hoạt — Thêm / Đổi Tên / Xóa / Sắp Xếp Trong Mục Lục

> **Lane:** Core / break_task / week16_break.
> **Branch:** `feat/w16-section-crud`.
> **Type:** Capability / "bớt cứng" — finding **S1** (High, [SectionNav.tsx:37-56](src/components/SectionNav.tsx#L37) chỉ **chọn** mục — không thêm/đổi tên/xóa/sắp xếp; cấu trúc chỉ đến từ template hoặc import), **S2** (Med, [Workspace.tsx:72-83](src/components/Workspace.tsx#L72) `handleChange` chỉ sửa được `markdown` của mục có sẵn, không động tới danh sách section). Gốc nỗi đau #5 ("section cứng nhắc"). Review 2026-06-27.
> **Builds on:** Module 1 write; `ReportSection` ([report.ts:5-11](src/types/report.ts#L5)) `{id, order, title, markdown, status}`.
> **Sources:** Review 2026-06-27; `VoiceAndContent.md §7`; `CanonicalTypes.md §1`.

---

## 1. Micro-task Target

Cho người dùng tự nắn cấu trúc báo cáo. Logic thao tác tách thành **reducer thuần** (test được), `SectionNav` thêm affordance.

- **S1 — CRUD section.** Helper thuần trong write module: `addSection(sections, atIndex?)` (tạo `id` mới `crypto.randomUUID()`, title default "Mục mới", markdown "", status draft), `renameSection(sections, id, title)`, `deleteSection(sections, id)` (chặn xóa khi còn 1 section / hoặc cho phép rồi rơi về empty-state đã có [Workspace.tsx:177-189](src/components/Workspace.tsx#L177)). Mọi op trả mảng mới **đã chuẩn hóa `order`** (0..n liền mạch).
- **S2 — Sắp xếp (reorder).** `moveSection(sections, id, dir)` lên/xuống **hoặc** kéo-thả. Ưu tiên nút lên/xuống (không lib) để giữ "không lib mới"; nếu chọn kéo-thả, đánh giá thêm lib trong Risks và cần ghi rõ. `order` được tính lại sau mỗi move; preview/checker đọc theo `order` nên phải nhất quán.
- **S3 — Wiring Workspace.** Handlers `handleAddSection`/`handleRenameSection`/`handleDeleteSection`/`handleMoveSection` cập nhật `bundle.project.sections` + `updatedAt`, chỉnh `activeId` hợp lý (sau xóa: nhảy sang lân cận; sau add: focus mục mới). Autosave hiện có ([useDraftAutosave](src/modules/write/use-draft-autosave.ts)) tự lưu.
- **S4 — Đổi tên tại chỗ.** Trong [SectionNav](src/components/SectionNav.tsx) cho đổi tên inline (double-click / nút bút chì) — title hiện chỉ render tĩnh [:47-49](src/components/SectionNav.tsx#L47).

> 🔒 **`order` luôn 0..n liền mạch sau mọi op** — preview/TOC/checker phụ thuộc thứ tự này.
> 🔒 **Không phá `ReportSection` shape / CanonicalTypes.** Chỉ thêm helper + handler.
> 🔒 **Xác nhận khi xóa section có nội dung** (tránh mất bài). Token-only + giọng `VoiceAndContent §7`.

## 2. Scope

### In scope
- [src/modules/write/section-ops.ts](src/modules/write/section-ops.ts) (NEW): `addSection`/`renameSection`/`deleteSection`/`moveSection` thuần + chuẩn hóa `order`.
- [src/modules/write/section-ops.test.ts](src/modules/write/section-ops.test.ts) (NEW): unit (order liền mạch, biên xóa-mục-cuối, move biên).
- [src/components/SectionNav.tsx](src/components/SectionNav.tsx) (MODIFY): nút add / rename inline / delete / move; giữ a11y (`aria-current`, nút có label).
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): handlers + chỉnh `activeId`.
- [src/modules/write/index.ts](src/modules/write/index.ts) (MODIFY): export helper.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style controls (token).

### Out of scope
- ❌ Import/khởi tạo (→ contract import/quickstart).
- ❌ Đổi thuật toán đánh số heading (chỉ đảm bảo `order` đúng để pipeline tính).
- ❌ AI (→ nhóm AI W16).

## 3. Checklist
- [ ] **S1** Thêm/đổi tên/xóa section; `order` luôn 0..n liền mạch (test).
- [ ] **S2** Lên/xuống (hoặc kéo-thả) đổi đúng thứ tự; preview phản ánh.
- [ ] **S3** `activeId` hợp lý sau add/delete/move; autosave chạy.
- [ ] **S4** Đổi tên inline trong mục lục.
- [ ] Xóa section có nội dung → xác nhận trước.
- [ ] A11y giữ nguyên (keyboard, aria). 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/section-ops.ts` | NEW | reducer thuần |
| `src/modules/write/section-ops.test.ts` | NEW | unit |
| `src/components/SectionNav.tsx` | MODIFY | affordance CRUD/reorder |
| `src/components/Workspace.tsx` | MODIFY | handlers + activeId |
| `src/modules/write/index.ts` | MODIFY | export |
| `src/app/globals.css` | MODIFY | style (token) |

> **Import boundary:** ưu tiên không lib mới (nút lên/xuống). Kéo-thả: chỉ thêm lib nếu Approve nêu rõ.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| `order` lệch làm preview/TOC sai | High | Chuẩn hóa `order` trong reducer + test bao biên. |
| Xóa nhầm mất bài | Med | Dialog xác nhận khi section có markdown. |
| Kéo-thả kéo theo lib + a11y khó | Med | Mặc định nút lên/xuống; kéo-thả chỉ khi Approve. |
| activeId trỏ mục đã xóa | Med | Sau xóa nhảy sang lân cận/empty-state. |

## 6. Verification Plan
- Thêm mục → focus mục mới, order đúng.
- Đổi tên inline → mục lục + preview cập nhật.
- Xóa mục giữa → order liền mạch, activeId hợp lý.
- Move lên/xuống → thứ tự preview đổi theo.
- 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit: `feat(write): add/rename/delete/reorder sections in nav with pure section-ops`.
