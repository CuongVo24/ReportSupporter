# Contract For AI — W19 Fix (C): Khử Trùng Caption Hình + Thống Nhất Đánh Số

> **Lane:** Core / break_task / week19_break.
> **Branch:** `w19/near-completed` (nhánh chung cả tuần).
> **Type:** Defect-root / caption correctness.
> **Findings:**
> - **S1** (🔴 Critical) — **Caption hình luôn được "tiêm" thêm**: `normalizeCaptions` đẩy một paragraph caption **mới** sau MỌI ảnh ([captions.ts:50-69](src/modules/format/captions.ts#L50)), khác với bảng vốn **dò & tái dùng** caption sẵn có ([captions.ts:84-101](src/modules/format/captions.ts#L84)). ⇒ caption tác giả gõ tay ("Hình 1.2: …") **vẫn còn** + caption tự sinh ⇒ 2 dòng.
> - **S2** (🔴) — **Label nối với alt đã chứa label**: text caption = `` `${entry.label}: ${entry.text}` `` với `entry.text = img.alt` ([caption-registry.ts:61](src/modules/format/caption-registry.ts#L61), [captions.ts:61](src/modules/format/captions.ts#L61)). `alt = "Hình 1.2 - Workflow…"` ⇒ **"Hình 3: Hình 1.2 - Workflow…"** (label kép).
> - **S3** (🟠) — **Lệch scheme số**: preset `captionNumbering: "continuous"` ([helpers.ts:58](src/modules/export/helpers.ts#L58)) sinh "Hình 3" trong khi tác giả gõ per-chapter "Hình 1.2".
> - *(Liên đới)* dòng thứ 3 trong ảnh là **alt của ảnh hỏng** hiển thị như caption — thuộc `w19_fix_image_embed_export_validation`.
> **Builds on:** `caption-registry.ts`, `captions.ts`.
> **Sources:** Product Review 2026-06-29 (#2).

---

## 1. Micro-task Target

Caption hình dùng **cùng quy tắc với bảng**: dò caption sẵn có rồi *chuẩn hoá tại chỗ*, không tạo bản trùng; tách bạch label và nội dung; thống nhất scheme số.

- **S1 — Dò & tái dùng caption hình sẵn có.** Trước/sau paragraph chứa ảnh, nếu có paragraph bắt đầu `^(hình|figure)\b` thì **chuẩn hoá tại chỗ** (giống nhánh bảng) thay vì chèn mới. Chỉ chèn mới khi **không** có caption nào.
- **S2 — Tách label khỏi nội dung.** Khi build registry, **strip** tiền tố "Hình N(.N)*" khỏi `alt`/caption trước khi lưu `entry.text` (giống bảng đã làm ở [caption-registry.ts:81](src/modules/format/caption-registry.ts#L81)). Render = `label + ": " + text` không lặp.
- **S3 — Thống nhất scheme.** Mặc định **per-chapter** cho preset academic (khớp thói quen "Hình 1.2"), hoặc tôn trọng số tác giả nếu phát hiện. Đồng bộ giữa registry, body, LoF.

> 🔒 Giữ `entry.id` ổn định (`fig-N`) để cross-ref/LoF dùng được.
> 🔒 Không sửa markdown nguồn; chuẩn hoá khi parse→render.

## 2. Scope

### In scope
- [src/modules/format/captions.ts](src/modules/format/captions.ts) (MODIFY): nhánh hình dò caption sẵn có (đối xứng nhánh bảng); chỉ chèn khi thiếu.
- [src/modules/format/caption-registry.ts](src/modules/format/caption-registry.ts) (MODIFY): strip tiền tố "Hình N.N" khỏi `text`; (tuỳ) lấy text từ caption paragraph thay vì chỉ `alt`.
- [src/modules/format/captions.test.ts](src/modules/format/captions.test.ts) (MODIFY): test 1-caption (không trùng), label không kép.
- [src/modules/export/helpers.ts](src/modules/export/helpers.ts) (MODIFY nhẹ): preset `captionNumbering` mặc định per-chapter (nếu chốt).
- [src/modules/format/generate-lof-lot.ts](src/modules/format/generate-lof-lot.ts) (KIỂM TRA): LoF dùng `label`/`text` mới nhất quán.

### Out of scope
- ❌ Ảnh hỏng/nhúng ảnh (đó là D).
- ❌ Cross-reference động `Hình 2.1` trong thân (backlog #53).

## 3. Checklist
- [ ] **S1** Có caption tay → **không** sinh bản trùng; không có → sinh đúng 1.
- [ ] **S2** Không còn label kép ("Hình 3: Hình 1.2 …" → "Hình 1.2: Workflow…").
- [ ] **S3** Số hình nhất quán registry/body/LoF theo 1 scheme. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/format/captions.ts` | MODIFY | nhánh hình đối xứng nhánh bảng |
| `src/modules/format/caption-registry.ts` | MODIFY | strip label khỏi text; scheme |
| `src/modules/format/captions.test.ts` | MODIFY | test không trùng/không kép |
| `src/modules/export/helpers.ts` | MODIFY | default scheme (nếu chốt) |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Dò caption tay sai vị trí (trên/dưới ảnh) | Med | Quét cả `i-1`/`i+1` như bảng; regex `^(hình|figure)`. |
| Đổi scheme phá báo cáo cũ | Med | Cho phép format setting; mặc định an toàn + test snapshot. |
| Strip label nuốt nội dung | Low | Regex neo đầu khớp mẫu "Hình N(.N)*[:.-]". |

## 6. Verification Plan
- Ảnh + caption tay "Hình 1.2: Workflow…" → đúng **một** dòng caption, không "Hình 3: Hình 1.2…".
- Ảnh không caption tay → sinh đúng 1 caption đánh số.
- LoF khớp số/nhãn với caption thân. 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w19/near-completed`): `fix(format): dedupe figure captions (reuse existing), strip duplicated label, unify numbering scheme`.
