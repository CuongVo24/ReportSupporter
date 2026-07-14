# Contract For AI — W24 Fix (A): Ảnh Chưa Nhúng Render Thành `<img>` Chết & Phát Request Mạng (Preview Vỡ + Dev-Server Đơ)

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Bug correctness/UX + hiệu năng. **Keystone tuần**, làm trước tiên.
> **Findings:**
> - **S1** (🔴) — **Ref ảnh không giải được render icon vỡ.** `resolveAssetRefs(html, assets)` thay `asset:<id>`/`image:<id>` bằng `asset.data` **chỉ khi** tìm thấy id; không thấy thì **giữ nguyên chuỗi** ([resolve-assets.ts:12](src/modules/write/resolve-assets.ts#L12)-L15). Chuỗi `asset:deadbeef` còn lại nằm ở `src` của `<img>`; sanitizer `customSchema.protocols.src` chỉ whitelist `http`/`https`/`data` — **không** có `asset`/`image` ([markdown-pipeline.ts:31](src/lib/markdown-pipeline.ts#L31)-L34) ⇒ **gỡ luôn `src`** ⇒ `<img alt="Hình 3.2">` không src ⇒ **icon vỡ + chỉ còn alt**. Đúng hệt screenshot user.
> - **S2** (🔴) — **Đường dẫn cục bộ lọt sanitizer và phát request mạng.** `![...](images/hinh-3-1.png)` **không** thuộc scheme `asset:`/`image:` nên `resolveAssetRefs` **bỏ qua**; đường dẫn tương đối **được** sanitizer cho phép ⇒ `<img src="images/hinh-3-1.png">` render ⇒ trình duyệt **phát `GET /images/hinh-3-1.png`**. QA đo: **404**, và Next dev buộc compile route `/_not-found` **~108 giây, chặn cả server** (GET / sau đó 20–70s, Fast Refresh 33s). Báo cáo nhiều hình vỡ → dội 404 liên tục → **"app chết"** như user mô tả.
> - **S3** (🟠) — **Ảnh chết lọt cả file xuất.** `prepare-export` cũng chỉ `resolveAssetRefs` ([prepare-export.ts:56](src/modules/export/prepare-export.ts#L56)); nếu gate P0 bị bỏ qua (hiện chặn, nhưng E có thể mở "xuất nháp") thì `<img src="images/...">`/`asset:` mồ côi lọt vào HTML/PDF/DOCX — file đứng một mình chắc chắn vỡ. Cần **defense-in-depth** cùng chỗ.
> - **S4** (🟠) — **Import preview cũng vỡ + dội 404 ngay lúc nhập.** `ImportPreviewDialog` render bằng chính `PreviewPane` ([ImportPreviewDialog.tsx:360](src/modules/import/ImportPreviewDialog.tsx#L360)); tài liệu import thiếu ảnh → dialog xem-trước dội 404 → có thể treo ngay bước import.
> **Builds on:** `resolve-assets.ts` (`resolveAssetRefs`), `markdown-pipeline.ts` (`customSchema`), `PreviewPane.tsx` ([:154](src/components/PreviewPane.tsx#L154),L177,L409), `prepare-export.ts`, `ImportPreviewDialog.tsx`, quy tắc checker ảnh (`check/rules/images.ts`, `broken-link.ts`).
> **Sources:** QA session 2026-07-14 (drive dev server), phát hiện #1–#4 [[w25-health-check-root-causes]].

---

## 1. Micro-task Target

Ref ảnh **không giải được** (đường dẫn cục bộ tương đối, `asset:`/`image:` mồ côi) phải render thành **placeholder có ý nghĩa** — khung rõ ràng + tên/alt ảnh + lý do "**Ảnh chưa được nhúng**" + lối dẫn sửa (trỏ tới [[w24_fix_image_recovery_attach_from_placeholder_and_issues]]) — và **tuyệt đối không phát request mạng**. Áp đồng nhất cho **3 điểm render**: PreviewPane (soạn thảo), prepare-export (file xuất), ImportPreviewDialog (xem trước nhập).

- **S1 — Placeholder thay icon vỡ.** Ref `asset:`/`image:` mồ côi → node placeholder (giữ alt/caption làm nhãn), **không** để `<img>` trơ mất src.
- **S2 — Chặn request mạng (điểm cứng).** Ref ảnh **không** phân giải được thành data-URL nội bộ **không được** để lọt `src` đường dẫn cục bộ ra DOM. Biến thành placeholder **trước** khi vào sanitizer/DOM (vd trong `resolveAssetRefs`: ref không khớp → thay bằng marker placeholder thay vì giữ nguyên; hoặc tầng render map thành node an toàn). Kết quả kiểm chứng: **0 request** `GET /images/...` khi mở báo cáo có ảnh cục bộ.
- **S3 — Đồng nhất ở file xuất.** prepare-export dùng cùng cơ chế → HTML/PDF/DOCX không chứa `<img>` chết/đường dẫn cục bộ.
- **S4 — Import preview an toàn.** ImportPreviewDialog kế thừa cùng hành vi (dùng chung PreviewPane) → không dội 404 lúc nhập.

> 🔒 **Không xoá ảnh khỏi nội dung.** Placeholder **thay chỗ hiển thị**, markdown gốc (ref) giữ nguyên để B gắn lại được. Không sửa `runChecker` (vẫn báo P0 ảnh vỡ). Microcopy đủ dấu theo `§7`.

## 2. Scope

### In scope
- [src/modules/write/resolve-assets.ts](src/modules/write/resolve-assets.ts) (MODIFY): mở rộng để **phân loại** ref: (a) giải được → data-URL như cũ; (b) `asset:`/`image:` mồ côi hoặc đường dẫn cục bộ không khớp → thay bằng **marker placeholder** (giữ alt) thay vì để nguyên. Không phát src cục bộ.
- [src/lib/markdown-pipeline.ts](src/lib/markdown-pipeline.ts) (MODIFY nếu cần): cho phép class/attr của node placeholder qua sanitizer (whitelist tối thiểu); **không** nới protocol src.
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY): render marker placeholder thành khối `.ws-preview-image-missing` (khung + nhãn + lý do + nút/lối dẫn sửa — nút thực thi thuộc B, ở đây tối thiểu là chỗ neo).
- [src/modules/export/prepare-export.ts](src/modules/export/prepare-export.ts) (MODIFY): cùng cơ chế placeholder cho file xuất (bản in: khung xám + chú thích "Ảnh chưa nhúng", **không** src cục bộ).
- CSS preview/print (MODIFY): style `.ws-preview-image-missing` bằng token; bản in trắng-đen `--rs-report-*`.
- Test (NEW/UPDATE): `resolve-assets.test.ts` — ref mồ côi/đường dẫn cục bộ → **không** còn `src` cục bộ, ra marker; snapshot PreviewPane/prepare-export có placeholder, **không** có `<img src="images/`.

### Out of scope
- ❌ Nút "Gắn ảnh vào đây" (thuộc [[w24_fix_image_recovery_attach_from_placeholder_and_issues]]) — A chỉ dựng **điểm neo** placeholder.
- ❌ Đổi luật checker ảnh (vẫn P0). ❌ Cho phép "xuất nháp" (thuộc Decide E).
- ❌ Đổi cơ chế nhúng ảnh hợp lệ (`createImageAsset`/`extract-assets`).

## 3. Checklist
- [ ] **S1** Ref `asset:`/`image:` mồ côi → placeholder có nhãn (alt/caption), không `<img>` mất src.
- [ ] **S2** Ref đường dẫn cục bộ → **0 request mạng**; đo bằng Network panel: không `GET /images/...`. Dev-server không còn compile `/_not-found` khi mở báo cáo ảnh vỡ.
- [ ] **S3** prepare-export không phát `<img src="images/">`/`asset:` mồ côi vào HTML/PDF/DOCX; placeholder in được.
- [ ] **S4** ImportPreviewDialog kế thừa hành vi (dùng chung PreviewPane) — không dội 404 lúc nhập.
- [ ] Checker vẫn báo P0 ảnh vỡ (không đổi luật). 4 gate xanh (`npm test`, `tsc --noEmit`).

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/resolve-assets.ts` | MODIFY | phân loại ref; mồ côi/cục bộ → marker placeholder, không giữ src cục bộ |
| `src/lib/markdown-pipeline.ts` | MODIFY nhẹ | whitelist attr placeholder; **không** nới protocol src |
| `src/components/PreviewPane.tsx` | MODIFY | render `.ws-preview-image-missing` (điểm neo cho B) |
| `src/modules/export/prepare-export.ts` | MODIFY | placeholder cho file xuất (bản in) |
| `src/app/styles/preview-pane.css` (+ print CSS) | MODIFY | style placeholder bằng token |
| `src/modules/write/resolve-assets.test.ts` + snapshot | NEW/UPDATE | không còn src cục bộ; có marker |

> **Import boundary:** không lib mới. Dùng sanitizer/pipeline sẵn có.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Đổi `resolveAssetRefs` phá ảnh **hợp lệ** (data-URL) | High→mitigated | Test giữ: `asset:` khớp → vẫn data-URL nguyên vẹn; chỉ nhánh **không khớp** đổi hành vi. |
| Placeholder lọt cả ảnh **remote http(s)** hợp lệ (bị nhầm là "chưa nhúng") | Med | Chỉ coi là "chưa nhúng" khi: `asset:`/`image:` không khớp **hoặc** đường dẫn tương đối cục bộ. `http(s)://` giữ nguyên (vẫn cho qua sanitizer). |
| Regex img trong markdown/HTML bỏ sót biến thể (title, HTML `<img>`) | Med | Phủ cả 2 dạng như `extract-assets`/`scanImageReferences` đã làm; test cả `![]()` và `<img src>`. |
| Bản in placeholder chiếm layout khác ảnh thật → lệch trang | Low | Khung placeholder cố định tỉ lệ hợp lý; chấp nhận khác — mục tiêu là **không vỡ/không 404**, không phải giả ảnh. |

## 6. Verification Plan
- Mở báo cáo có `![](images/x.png)` + `![](asset:orphan)`: Network panel **0** request `GET /images/...`; preview hiện **2 placeholder** có nhãn; **không** icon vỡ. `preview_logs` **không** còn dòng compile `/_not-found`.
- Ảnh hợp lệ (`asset:` khớp, và một ảnh `https://...`): vẫn hiển thị bình thường.
- Xuất HTML (qua Decide E hoặc test unit prepare-export): file **không** chứa `<img src="images/`/`asset:orphan`; có placeholder in.
- Import file thiếu ảnh: ImportPreviewDialog hiện placeholder, **không** dội 404.
- Checker vẫn liệt kê P0 ảnh vỡ. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve; docs commit trước, src/ sau.`
