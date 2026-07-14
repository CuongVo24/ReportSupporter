# Contract For AI — W24 Fix (B): Không Có Lối Phục Hồi Ảnh Sau Import (Gắn Lại Ảnh Vào Đúng Ref)

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug UX / thiếu affordance. Phụ thuộc [[w24_fix_preview_unembedded_image_placeholder_no_network]] (dùng placeholder làm điểm neo).
> **Findings:**
> - **S1** (🟠) — **Ảnh chưa nhúng không có đường sửa tại chỗ.** App nhúng ảnh **chỉ** qua: data-URL trong file import ([extract-assets.ts](src/modules/import/extract-assets.ts)), file ảnh kèm theo khớp basename ([import-assets.ts:128](src/modules/write/import-assets.ts#L128) `ingestAssetsAndEvidence`), hoặc chèn/paste trực tiếp ([use-image-insert.ts:10](src/modules/write/use-image-insert.ts#L10) `createImageAsset`). Import **thiếu file** → ref cục bộ `images/x.png` hoặc `asset:` mồ côi **trơ**; user chỉ nhận cảnh báo checker "Vui lòng import lại tài liệu kèm theo thư mục/tệp ảnh" ([images.ts](src/modules/check/rules/images.ts)) — nghĩa là **làm lại từ đầu** hoặc **sửa markdown tay**. Không "triệt để".
> - **S2** (🟠) — **Panel Soát lỗi báo lỗi nhưng không hành động được.** Mỗi issue ảnh vỡ có nút "Xem" (nhảy tới mục) nhưng **không** có "Gắn ảnh" — user thấy lỗi mà không sửa nhanh được.
> **Builds on:** placeholder từ A (`.ws-preview-image-missing`), `createImageAsset` (base64/IndexedDB ≤5MB), `rewriteMarkdownRefs` ([import-assets.ts:74](src/modules/write/import-assets.ts#L74)), `useImageInsert` ([use-image-insert.ts:64](src/modules/write/use-image-insert.ts#L64)), IssuesPanel/CheckerPanel, `Workspace` (chủ sở hữu `bundle`/`setBundle`).
> **Sources:** QA session 2026-07-14, phát hiện #5 [[w25-health-check-root-causes]].

---

## 1. Micro-task Target

Cho người dùng **gắn ảnh vào đúng ref chưa nhúng** ngay tại chỗ — không phải import lại hay sửa markdown tay. Hai lối vào: (1) từ **placeholder** trong preview (A đã dựng điểm neo); (2) từ **issue ảnh vỡ** trong panel Soát lỗi. Thao tác: chọn file ảnh → `createImageAsset` → thêm vào `bundle.assets` → **rewrite ref cũ** (đường dẫn cục bộ hoặc `asset:` mồ côi) thành `asset:<id-mới>` trong markdown **đúng mục** → toast xác nhận → checker tự hết P0 ảnh đó.

- **S1 — Gắn từ placeholder.** Placeholder có nút "**Gắn ảnh**" (hoặc click vùng) → mở trình chọn file (`accept="image/*"`) → `createImageAsset(file, 5MB)` → cập nhật asset + rewrite ref trong markdown của mục chứa ref.
- **S2 — Gắn từ Soát lỗi.** Issue ảnh vỡ có action "Gắn ảnh" cạnh "Xem" — cùng luồng, xác định ref mục tiêu từ mục + đường dẫn trong message.
- **S3 — Rewrite chính xác 1 ref.** Chỉ đổi **đúng** ref được gắn (theo đường dẫn/id gốc), **không** đụng ref khác; tái dùng `rewriteMarkdownRefs`/regex an toàn đã có. Toast thành công/lỗi (kích thước, không phải ảnh).

> 🔒 Ảnh **offline** base64/IndexedDB, **không** upload server (giữ mô hình hiện tại). Không đổi schema `ReportAsset`. Không đổi luật checker — sửa dữ liệu thì P0 tự hết.

## 2. Scope

### In scope
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY): placeholder A nhận callback "gắn ảnh" (truyền từ Workspace) — mở file picker, gọi handler với ref mục tiêu + sectionId.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): handler `attachImageToRef(sectionId, originalRef, file)` — `createImageAsset` → thêm asset (`useImageInsert.handleImageInserted`) → rewrite ref trong `section.markdown` → `setBundle` → toast.
- [src/components/IssuesPanel.tsx](src/components/IssuesPanel.tsx) / [src/modules/check/CheckerPanel.tsx](src/modules/check/CheckerPanel.tsx) (MODIFY): thêm action "Gắn ảnh" cho issue mã ảnh-vỡ (local-image / missing-asset); gọi cùng handler.
- [src/modules/write/import-assets.ts](src/modules/write/import-assets.ts) (REUSE/nhẹ): dùng `rewriteMarkdownRefs` cho 1 ref; nếu cần helper rewrite `asset:oldId → asset:newId` thì thêm nhỏ, có test.
- Test (NEW/UPDATE): gắn ảnh vào ref cục bộ → markdown mục đổi thành `asset:<id>`, asset thêm vào bundle, ref khác nguyên vẹn; gắn vào `asset:` mồ côi → id cập nhật; file >5MB/không phải ảnh → toast lỗi, không đổi bundle.

### Out of scope
- ❌ Kéo-thả nhiều ảnh hàng loạt / auto-match theo tên (đã có ở luồng import kèm thư mục) — B chỉ sửa **từng ref** thủ công.
- ❌ Đổi placeholder rendering (thuộc A). ❌ Đổi checker luật.
- ❌ Trình quản lý asset toàn cục (ngoài phạm vi break_task).

## 3. Checklist
- [ ] **S1** Placeholder có nút "Gắn ảnh" → chọn file → ảnh hiển thị thật, ref thành `asset:<id>` trong markdown đúng mục.
- [ ] **S2** Issue ảnh vỡ ở Soát lỗi có "Gắn ảnh" → cùng kết quả; sau gắn, chạy lại checker thấy P0 ảnh đó biến mất.
- [ ] **S3** Chỉ đúng 1 ref bị đổi; ref/nội dung khác nguyên vẹn; undo editor không hỏng (đổi qua state markdown mục).
- [ ] Toast thành công + lỗi (kích thước/định dạng). 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/components/Workspace.tsx` | MODIFY | `attachImageToRef` orchestrator; toast |
| `src/components/PreviewPane.tsx` | MODIFY | nút "Gắn ảnh" trên placeholder → callback |
| `src/components/IssuesPanel.tsx` | MODIFY | action "Gắn ảnh" cho issue ảnh vỡ |
| `src/modules/check/CheckerPanel.tsx` | MODIFY nhẹ | truyền callback xuống IssuesPanel |
| `src/modules/write/import-assets.ts` | REUSE/nhẹ | rewrite 1 ref (local→asset, asset→asset) + test |
| `*.test.ts(x)` | NEW/UPDATE | các case gắn/lỗi/không-đụng-ref-khác |

> **Import boundary:** không lib mới. `createImageAsset`, `rewriteMarkdownRefs`, toast W13/W20 sẵn có.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Rewrite trúng nhiều ref giống nhau (2 chỗ dùng `images/x.png`) | Med | Xác định phạm vi theo **sectionId** của placeholder/issue; nếu trùng trong cùng mục, cân nhắc gắn tất cả cùng đường dẫn (nhất quán) — ghi rõ hành vi + test. |
| Sửa markdown mục đang mở làm mất undo/con trỏ editor | Med | Cập nhật qua `setBundle`→section.markdown (nguồn sự thật); editor re-sync như các sửa state khác; không remount EditorView. |
| Trùng lặp logic với luồng import kèm thư mục | Low | Tái dùng `rewriteMarkdownRefs`; không đẻ pipeline thứ hai. |
| Ảnh lớn dồn IndexedDB | Low | Giữ cap 5MB (`createImageAsset`); cảnh báo 2MB như `import-assets` hiện có nếu muốn nhất quán. |

## 6. Verification Plan
- Import (hoặc paste markdown) có `![Hình](images/hinh-3-1.png)` → placeholder → "Gắn ảnh" → chọn PNG → ảnh hiện thật; kiểm markdown mục: `![Hình](asset:<uuid>)`; reload → ảnh còn (IndexedDB).
- Ref `asset:orphan` → "Gắn ảnh" → id cập nhật, hiển thị.
- Tab Soát lỗi: issue "Ảnh sử dụng đường dẫn cục bộ…" có "Gắn ảnh"; sau gắn, Soát lại → P0 đó mất.
- File 6MB / .txt → toast lỗi, bundle không đổi. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve; docs commit trước, src/ sau. Thi công sau A (cần placeholder làm điểm neo).`
