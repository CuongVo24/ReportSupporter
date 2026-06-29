# Contract For AI — W20 Fix (C): Đánh Số Caption/Heading Khi Chương Bắt Đầu Bằng H2

> **Lane:** Core / break_task / week20_break.
> **Branch:** `w20/import-fidelity` (nhánh chung cả tuần).
> **Type:** Defect-root / numbering correctness (imported docs).
> **Findings:**
> - **S1** (🟠) — **Caption đổi số / lệch chuỗi** (#6, #23): `buildCaptionRegistry` tăng `chapterNum` **chỉ** khi `heading.depth === 1` ([caption-registry.ts:39](src/modules/format/caption-registry.ts#L39)). Tài liệu nhập mở chương bằng `##` ("2.4 Workflow…") ⇒ `chapterNum` **đứng yên 0** ⇒ label = `Hình ${Math.max(chapterNum,1)}.${figChapterCount}` = **"Hình 1.x" mãi**, lệch số tác giả gõ tay ("Hình 2.3") và lệch cross-ref.
> - **S2** (🟠) — **Caption nhân đôi** "Hình 1.2 / Hình 1.2:" (#5): phần lớn là **hệ quả ảnh 404** — trình duyệt hiện `alt="Hình 1.2 — Workflow…"` **ngay trên** caption tự sinh "Hình 1.2: Workflow…". (Sửa tận gốc ở `w20_fix_import_asset_evidence_ingest`; contract này lo phần **số** không khớp.)
> - **S3** (🟡) — Heading numbering cũng khoá H1 làm "chương" ⇒ số mục lệch khi tài liệu nhập dùng `##`/`###` làm cấp ngoài cùng.
> **Builds on:** W19-B/C (`number-headings.ts`, `caption-registry.ts`, `captions.ts`, `inject-headings.ts`).
> **Sources:** Product Review 2026-06-29 (#5, #6, #23).

---

## 1. Micro-task Target

Cho phép "chương" bắt đầu ở **mức heading nông nhất thực tế** (H1 **hoặc** H2), để đánh số caption/heading khớp ý tác giả ở **cả** tài liệu tạo-trong-app (H1) lẫn tài liệu nhập (H2).

- **S1 — Auto-detect mức chương.** Tính `chapterDepth` = mức heading **nông nhất** xuất hiện trong tài liệu (min depth). Tăng `chapterNum`/reset `figChapterCount`/`tableChapterCount` khi gặp heading ở `chapterDepth` (thay vì cứng `=== 1`).
- **S2 — Tôn trọng số tác giả nếu phát hiện.** Nếu caption/heading tác giả đã gõ tiền tố `N(.N)*` nhất quán, ưu tiên **giữ** số tác giả (chỉ chuẩn hoá định dạng), tránh ghi đè thành chuỗi lệch. Có format-setting để chốt hành vi.
- **S3 — Đồng bộ registry/body/LoF/LoT.** Số ở caption thân, danh mục hình/bảng và cross-ref dùng **một** nguồn (registry) sau khi sửa mức chương.

> 🔒 Giữ `entry.id` (`fig-N`/`table-N`) ổn định cho cross-ref/LoF.
> 🔒 Không sửa markdown nguồn; chuẩn hoá khi parse→render. Không hồi quy tài liệu H1-chương.

## 2. Scope

### In scope
- [src/modules/format/caption-registry.ts](src/modules/format/caption-registry.ts) (MODIFY): `chapterDepth` auto-detect; tăng chapter ở mức nông nhất.
- [src/modules/format/number-headings.ts](src/modules/format/number-headings.ts) (MODIFY): chuẩn hoá gốc đánh số theo `chapterDepth`.
- [src/modules/format/captions.ts](src/modules/format/captions.ts) (KIỂM TRA): dùng label registry mới; không nhân đôi.
- [src/modules/format/caption-registry.test.ts / number-headings.test.ts](src/modules/format) (NEW/MODIFY): test H2-chương lẫn H1-chương.
- [src/modules/format/generate-lof-lot.ts](src/modules/format/generate-lof-lot.ts) (KIỂM TRA): LoF/LoT khớp số mới.

### Out of scope
- ❌ Ingest/nhúng ảnh (đó là A) — dòng `alt` trùng biến mất khi ảnh sống.
- ❌ Cross-reference động `Hình 2.1` trong thân (backlog) — chỉ **kiểm tra** ref ở `w20_fix_validation_issues_panel`.

## 3. Checklist
- [ ] **S1** Tài liệu H2-chương: "Hình 2.3" đánh đúng (không còn "Hình 1.x").
- [ ] **S2** Số tác giả nhất quán được tôn trọng (không ghi đè lệch).
- [ ] **S3** registry/body/LoF/LoT đồng số; tài liệu H1-chương không hồi quy. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/format/caption-registry.ts` | MODIFY | `chapterDepth` auto-detect |
| `src/modules/format/number-headings.ts` | MODIFY | gốc đánh số theo mức nông nhất |
| `src/modules/format/caption-registry.test.ts` | NEW/MODIFY | test H2 vs H1 chương |
| `src/modules/format/captions.ts` | KIỂM TRA | dùng label mới |
| `src/modules/format/generate-lof-lot.ts` | KIỂM TRA | LoF/LoT đồng số |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Auto-detect sai khi có 1 H1 tiêu đề báo cáo + chương H2 | High | Bỏ qua heading "tiêu đề tài liệu" (depth duy nhất, xuất hiện 1 lần đầu) khi tính `chapterDepth`; test mẫu thật. |
| Ghi đè số tác giả gây bất ngờ | Med | Format-setting "tôn trọng số tác giả"; mặc định an toàn + snapshot. |
| Hồi quy tài liệu H1-chương | Med | Test cả hai dạng; `chapterDepth=1` là nhánh cũ. |

## 6. Verification Plan
- Mẫu báo cáo nhập (chương `## 2.x`) → caption "Hình 2.3" đúng vị trí, cross-ref khớp.
- Mẫu app (chương `# 1`) → số không đổi (không hồi quy).
- Sau khi A nhúng ảnh: caption chỉ còn **một** dòng (hết `alt` trùng). 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w20/import-fidelity`): `fix(format): number chapters from shallowest heading level so H2-rooted imported docs paginate captions/headings correctly`.
