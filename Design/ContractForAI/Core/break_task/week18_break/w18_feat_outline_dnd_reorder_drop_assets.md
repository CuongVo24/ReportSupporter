# Contract For AI — W18 Feat (A2): Kéo-Thả Sắp Xếp Mục Lục + Thả Ảnh/File Vào Mục

> **Lane:** Core / break_task / week18_break.
> **Branch:** `w18/upgrade-ai` (nhánh chung cả tuần).
> **Type:** UX / direct-manipulation — finding **S1** (Med, reorder hiện chỉ bằng nút lên/xuống `moveSection` (W16) — báo cáo dài thì thao tác mỏi), **S2** (Low, chèn ảnh hiện qua `useImageInsert` trong editor; chưa thả file thẳng vào một mục ở mục lục). Brainstorm 2026-06-28.
> **Builds on:** `moveSection` + [SectionNav.tsx](src/components/SectionNav.tsx) (W16); `useImageInsert` ([Workspace.tsx:80](src/components/Workspace.tsx#L80)); import markdown đã có (W16).
> **Sources:** Brainstorm 2026-06-28; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Cho phép kéo-thả tự nhiên trên mục lục (đổi thứ tự) và thả ảnh/markdown trực tiếp vào một mục. Giữ nguyên `moveSection` làm fallback bàn phím/a11y.

- **S1 — Reorder bằng kéo-thả.** Lớp kéo-thả trong `SectionNav` gọi lại `moveSection`/handler reorder của Workspace; **`order` luôn 0..n liền mạch** sau thả. Ưu tiên giải pháp **không lib** (HTML5 DnD) để giữ ràng buộc "không lib mới"; nếu chọn lib a11y (vd `@dnd-kit`), phải đánh giá trong Risks + Approve nêu rõ.
- **S2 — Thả asset vào mục.** Thả file ảnh lên một mục → chèn ảnh vào markdown mục đó (tái dùng đường `useImageInsert`); thả `.md` lên một mục → chèn nội dung (tái dùng `importReadme`). Có vùng drop rõ ràng + trạng thái hover.
- **S3 — A11y song hành.** Giữ nút lên/xuống + phím `Alt+↑/↓` làm đường không-chuột; kéo-thả là lớp bổ sung, không thay thế.

> 🔒 **`order` 0..n liền mạch sau mọi thao tác** — preview/TOC/checker phụ thuộc.
> 🔒 **Kéo-thả không được làm mất đường bàn phím** (a11y).
> 🔒 Token-only, giọng `§7`.

## 2. Scope

### In scope
- [src/components/SectionNav.tsx](src/components/SectionNav.tsx) (MODIFY): kéo-thả reorder + vùng drop asset.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): handler nhận reorder từ DnD + chèn asset vào mục đích.
- [src/modules/write/section-ops.ts](src/modules/write/section-ops.ts) (MODIFY nếu cần helper move-to-index): giữ chuẩn hóa `order`.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style drag handle/drop zone (token).
- Test reorder/drop (NEW/MODIFY): order liền mạch sau thả, drop ảnh/.md vào đúng mục.

### Out of scope
- ❌ CRUD section (đã xong W16).
- ❌ Quản lý thư viện asset (chỉ chèn tại chỗ).

## 3. Checklist
- [ ] **S1** Kéo một mục thả vị trí mới → thứ tự + `order` đúng; preview phản ánh.
- [ ] **S2** Thả ảnh lên mục → chèn vào markdown mục đó; thả `.md` → chèn nội dung.
- [ ] **S3** Nút lên/xuống + `Alt+↑/↓` vẫn hoạt động (a11y). 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/SectionNav.tsx` | MODIFY | DnD reorder + drop zone |
| `src/components/Workspace.tsx` | MODIFY | handler reorder/insert asset |
| `src/modules/write/section-ops.ts` | MODIFY* | helper move-to-index (nếu cần) |
| `src/app/globals.css` | MODIFY | style (token) |

> **Import boundary:** mặc định không lib; lib kéo-thả a11y chỉ khi Approve nêu rõ.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| `order` lệch sau thả | High | Chuẩn hóa `order` trong reducer + test biên. |
| Kéo-thả phá a11y bàn phím | Med | Giữ nút/phím; DnD chỉ bổ sung; cân nhắc `@dnd-kit` (a11y) nếu Approve. |
| Drop nhầm mục đích | Med | Highlight mục đích rõ; xác nhận với asset lớn. |
| HTML5 DnD lỗi trên touch | Low | Fallback nút lên/xuống. |

## 6. Verification Plan
- Kéo mục cuối lên đầu → order 0..n đúng, preview đổi.
- Thả ảnh PNG lên mục giữa → ảnh xuất hiện trong markdown đúng mục.
- Bàn phím-only reorder vẫn được; 4 gate xanh.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w18/upgrade-ai`): `feat(write): drag-to-reorder outline and drop images/markdown into sections`.
