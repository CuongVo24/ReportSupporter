# Contract For AI — W19 Fix (D): Nhúng Ảnh + Cổng Validate Trước Export

> **Lane:** Core / break_task / week19_break.
> **Branch:** `w19/near-completed` (nhánh chung cả tuần).
> **Type:** Defect-root / asset integrity + pre-export gate.
> **Findings:**
> - **S1** (🔴 Critical) — **Ảnh mất trong PDF**: nguồn dùng đường dẫn file cục bộ `![…](Figures/hinh 1.2 …)`. `resolveAssetRefs` **chỉ** thay `asset:<id>`/`image:<id>`, **bỏ qua** mọi thứ khác ([resolve-assets.ts:12](src/modules/write/resolve-assets.ts#L12)). Cửa sổ in là `about:blank` ([export-pdf.ts:38](src/modules/export/export-pdf.ts#L38)) ⇒ đường dẫn tương đối resolve về `about:blank` ⇒ **ảnh chết**. Chỉ ảnh dán/thả (đã thành data-URI qua `createImageAsset`, [EditorPanel.tsx:126](src/components/EditorPanel.tsx#L126)) mới sống.
> - **S2** (🟠) — **Không có validate trước export** (#7): `prepareExport` không kiểm tra ảnh/ref/mermaid; người dùng chỉ phát hiện lỗi *sau khi* in.
> **Builds on:** `resolve-assets.ts`, `prepare-export.ts`, `ExportPanel.tsx`/`use-export.ts`.
> **Sources:** Product Review 2026-06-29 (#1, #7, #56, #57).

---

## 1. Micro-task Target

Bảo đảm **mọi ảnh xuất hiện trong report đều nhúng được** (data-URI/asset hợp lệ), và có **cổng validate** chặn/ cảnh báo trước khi export.

- **S1 — Phát hiện ảnh không nhúng được.** Quét AST tìm node `image` có `src` **không** phải `data:`/`asset:`/`image:` đã resolve (vd đường dẫn tương đối, `http(s)` ngoài). Đánh dấu là "ảnh không nhúng".
- **S2 — Cổng validate `validateExport(bundle) → { ok, issues[] }`** (thuần, test được): kiểm ảnh không nhúng (#1/#56), heading rỗng/nhảy cấp, caption thiếu, mermaid không render được, ref hỏng. Trả danh sách `{ severity, code, message, sectionId }`.
- **S3 — UI gate trước export.** `ExportPanel`/`SubmissionPanel` chạy `validateExport` trước; nếu có lỗi P0 (ảnh chết) → cảnh báo + cho phép "vẫn xuất" có chủ đích. Microcopy theo `§7`.
- **S4 — (P2, tuỳ Approve) Helper nhúng ảnh từ path.** Nếu môi trường cho phép đọc file (drag-drop/upload), gợi ý chuyển path → asset data-URI; nếu không, chỉ cảnh báo. **Không** tự fetch mạng.

> 🔒 **Không thêm phụ thuộc mạng**; không tự tải ảnh `http`. Chỉ nhúng từ asset cục bộ đã có.
> 🔒 Ngưỡng kích thước ảnh nhúng (cảnh báo khi vượt) để tránh phình bundle.

## 2. Scope

### In scope
- [src/modules/export/validate-export.ts](src/modules/export/validate-export.ts) (NEW): `validateExport` thuần + mã lỗi.
- [src/modules/export/validate-export.test.ts](src/modules/export/validate-export.test.ts) (NEW): unit (ảnh chết, ref hỏng, heading/caption).
- [src/modules/export/prepare-export.ts](src/modules/export/prepare-export.ts) (MODIFY): expose issue khi resolve (đánh dấu ảnh chưa nhúng).
- [src/modules/write/resolve-assets.ts](src/modules/write/resolve-assets.ts) (MODIFY nhẹ): (tuỳ) trả cờ "không resolve được" thay vì im lặng.
- [src/modules/export/ExportPanel.tsx](src/modules/export/ExportPanel.tsx) + [src/modules/export/SubmissionPanel.tsx](src/modules/export/SubmissionPanel.tsx) (MODIFY): chạy gate + hiển thị issue trước export.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style danh sách cảnh báo (token semantic).

### Out of scope
- ❌ Tự fetch ảnh mạng (vi phạm privacy-first).
- ❌ Progress export (đó là `w19_fix_pdf_print_surface`).

## 3. Checklist
- [ ] **S1** Phát hiện ảnh không nhúng (path/`http`).
- [ ] **S2** `validateExport` trả issue có severity/code/section; test biên.
- [ ] **S3** Gate UI cảnh báo trước export; cho phép xuất có chủ đích.
- [ ] **S4** (nếu Approve) helper path→asset cục bộ. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/validate-export.ts` | NEW | cổng validate thuần |
| `src/modules/export/validate-export.test.ts` | NEW | unit |
| `src/modules/export/prepare-export.ts` | MODIFY | đánh dấu ảnh chưa nhúng |
| `src/modules/write/resolve-assets.ts` | MODIFY | cờ không-resolve (opt) |
| `src/modules/export/ExportPanel.tsx` | MODIFY | gate UI |
| `src/modules/export/SubmissionPanel.tsx` | MODIFY | gate UI nộp bài |
| `src/app/globals.css` | MODIFY | style cảnh báo |

> **Import boundary:** không lib mới; không network.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Chặn export quá gắt gây bực | Med | Cảnh báo + "vẫn xuất"; P0 chỉ cho ảnh chết. |
| Nhúng ảnh lớn phình bundle | Med | Ngưỡng + cảnh báo, không tự nhúng quá ngưỡng. |
| False positive ảnh `data:` hợp lệ | Low | Whitelist `data:`/asset đã resolve. |

## 6. Verification Plan
- Report có `![](Figures/x)` → gate báo "ảnh chưa nhúng", PDF không còn icon vỡ thầm lặng.
- Report ảnh dán (data-URI) → gate sạch, PDF hiện ảnh.
- Heading rỗng/caption thiếu → liệt kê issue đúng section. 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w19/near-completed`): `fix(export): detect non-embeddable images and add pre-export validation gate`.
