# Contract For AI — W20 Fix (A): Import Ingest Ảnh + Minh Chứng (Khử 404 Tận Gốc)

> **Lane:** Core / break_task / week20_break.
> **Branch:** `w20/import-fidelity` (nhánh chung cả tuần).
> **Type:** Defect-root / import fidelity + asset integrity. **KEYSTONE.**
> **Findings:**
> - **S1** (🔴 Critical) — **Toàn bộ ảnh 404**: báo cáo nhập từ `.md` trỏ `![…](Figures/hinh_1_2_workflow_tong_the.png)` và `UniVillage_Final_Evidence/**`. `importReadme` **chỉ cắt section theo heading** ([readme-import.ts](src/modules/write/readme-import.ts)), **không** ingest byte ảnh; `resolveAssetRefs` chỉ thay `asset:`/`image:` ([resolve-assets.ts:12](src/modules/write/resolve-assets.ts#L12)) ⇒ path lọt qua → trình duyệt `GET /Figures/x.png` → **404** (không có thư mục `public/`). Hệ quả: preview & PDF mất ảnh, caption còn-hình-mất.
> - **S2** (🔴) — **Panel "Minh chứng" trống sau import**: panel phải đọc từ `bundle.evidence` ([Workspace.tsx:1114](src/components/Workspace.tsx#L1114)); import **không** tạo evidence/video ⇒ "đủ minh chứng/hình/video" rỗng dù `.md` có tham chiếu.
> - **S3** (🟠) — **404 thầm lặng**: server vẫn 200 OK trang, chỉ ảnh 404; người dùng chỉ thấy khi mở terminal (#VII) → cần báo rõ "không tìm thấy ảnh" ngay khi import.
> **Builds on:** `markdown-import.ts`, `readme-import.ts`, `resolve-assets.ts`, `use-image-insert.ts` (đã tạo asset data-URI), `MarkdownImportDropzone.tsx`, `EvidencePanel.tsx`.
> **Sources:** Product Review 2026-06-29 (#1, panel minh chứng mất, terminal 404).

---

## 1. Micro-task Target

Khi nhập một `.md`, **ingest mọi tham chiếu ảnh/minh chứng** kèm theo thành asset cục bộ (data-URI/`asset:<id>`) và **populate `bundle.evidence`**, để ảnh **sống** trong preview/PDF và panel phải có dữ liệu — **không** 404 thầm lặng.

- **S1 — Quét tham chiếu ảnh khi import.** Parse `.md` → liệt kê mọi `image.url` không phải `data:`/`asset:`/`http(s)` (đường dẫn cục bộ tương đối). Trả về danh sách "ảnh cần ingest".
- **S2 — Ingest từ file người dùng cấp.** Hỗ trợ kéo-thả/upload **kèm** thư mục/zip ảnh (hoặc File System Access API nếu khả dụng). Với mỗi path khớp tên file → đọc bytes → tạo `ReportAsset` (data-URI, có ngưỡng kích thước) → **viết lại** tham chiếu trong markdown thành `asset:<id>` (hoặc giữ map path→id qua `resolveAssetRefs` mở rộng). **Không** tự fetch mạng.
- **S3 — Map minh chứng → `bundle.evidence`.** Phát hiện ảnh/đường dẫn thuộc khối evidence (vd `UniVillage_Final_Evidence/**`, ảnh trong appendix) → tạo `EvidenceItem` tương ứng để panel phải có nội dung.
- **S4 — Degrade an toàn + báo cáo.** Path không tìm được file → **không** bịa; thêm vào "missing assets" và hiển thị tóm tắt sau import ("22/25 ảnh đã nhúng, 3 thiếu") thay vì 404 thầm lặng.

> 🔒 **Không fetch mạng**; chỉ đọc file người dùng chủ động cung cấp.
> 🔒 Ngưỡng kích thước/asset (cảnh báo khi vượt) để tránh phình IndexedDB.
> 🔒 Đối khớp tên theo **basename** (bỏ thư mục) để chịu khác biệt cấu trúc thư mục.

## 2. Scope

### In scope
- [src/modules/write/markdown-import.ts](src/modules/write/markdown-import.ts) (MODIFY): quét image refs; gắn danh sách "assets cần ingest" vào draft.
- [src/modules/write/import-assets.ts](src/modules/write/import-assets.ts) (NEW): hàm thuần ghép path→file→`ReportAsset` + rewrite markdown `path → asset:<id>`; tách evidence.
- [src/modules/write/import-assets.test.ts](src/modules/write/import-assets.test.ts) (NEW): unit (match basename, rewrite, missing list, ngưỡng size).
- [src/modules/write/resolve-assets.ts](src/modules/write/resolve-assets.ts) (MODIFY nhẹ): (tuỳ) hỗ trợ map `path → asset` ngoài `asset:`/`image:`.
- [src/modules/write/MarkdownImportDropzone.tsx](src/modules/write/MarkdownImportDropzone.tsx) (MODIFY): nhận thêm ảnh/zip kèm `.md`; gọi ingest; show tóm tắt nhúng/thiếu.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): nối kết quả ingest vào `bundle.assets` + `bundle.evidence`.
- [src/app/globals.css](src/app/globals.css) (MODIFY): style tóm tắt import (token semantic).

### Out of scope
- ❌ Cổng validate/Issues panel (đó là `w20_fix_validation_issues_panel`).
- ❌ Tự fetch ảnh `http(s)` (vi phạm privacy-first).
- ❌ Bố cục/in PDF (đó là `w20_fix_print_header_footer_pagebreak`).

## 3. Checklist
- [ ] **S1** Quét ra đúng danh sách ảnh-path cần ingest từ `.md`.
- [ ] **S2** Ingest file kèm → asset data-URI + rewrite ref; ảnh hiện trong preview.
- [ ] **S3** Evidence populate `bundle.evidence` → panel phải có nội dung.
- [ ] **S4** File thiếu → liệt kê "missing", không 404 thầm lặng. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/import-assets.ts` | NEW | path→asset + rewrite + tách evidence (thuần) |
| `src/modules/write/import-assets.test.ts` | NEW | unit basename/rewrite/missing/size |
| `src/modules/write/markdown-import.ts` | MODIFY | quét refs vào draft |
| `src/modules/write/resolve-assets.ts` | MODIFY | (opt) map path→asset |
| `src/modules/write/MarkdownImportDropzone.tsx` | MODIFY | nhận ảnh kèm + tóm tắt |
| `src/components/Workspace.tsx` | MODIFY | nối assets + evidence |
| `src/app/globals.css` | MODIFY | style tóm tắt import |

> **Import boundary:** không lib mới; không network. (File System Access API là web platform, không phải dependency.)

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Trình duyệt không cho đọc thư mục ảnh | High | Degrade: chấp nhận upload zip/nhiều file kèm; nếu không có → chỉ map + cảnh báo (S4). |
| Tên file trùng ở thư mục khác | Med | Match basename + cảnh báo nếu nhiều ứng viên; cho chọn. |
| Nhúng ảnh lớn phình IndexedDB | Med | Ngưỡng + cảnh báo; không tự nhúng quá ngưỡng. |
| Rewrite ref phá markdown gốc | Med | Rewrite trên bản parse, neo theo node `image.url`; snapshot test. |

## 6. Verification Plan
- Nhập `.md` + thư mục ảnh → preview & PDF **hiện đủ ảnh**; terminal **không còn** `GET /Figures/* 404`.
- Panel "Minh chứng" có item sau import (không còn rỗng).
- Thiếu 1 ảnh → tóm tắt "đã nhúng N, thiếu 1" + tên file thiếu; không 404 thầm lặng. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w20/import-fidelity`): `fix(write): ingest referenced images & evidence on markdown import, rewrite refs to embedded assets`.
