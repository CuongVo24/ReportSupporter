# Contract For AI — W19 Fix (A): Hợp Nhất Pipeline Render Preview ↔ Export

> **Lane:** Core / break_task / week19_break.
> **Branch:** `w19/near-completed` (nhánh chung cả tuần).
> **Type:** Architecture / defect-root — keystone của W19.
> **Findings:**
> - **S1** (🔴 Critical) — Tồn tại **hai pipeline render tách rời**: preview qua `renderMdastToHtml` ([markdown-pipeline.ts:86](src/lib/markdown-pipeline.ts#L86)); export tự dựng `hastProcessor` riêng ([prepare-export.ts:126](src/modules/export/prepare-export.ts#L126)) rồi stringify riêng ([print-preview.ts:61](src/modules/export/print-preview.ts#L61)). → #5/#6 Preview ≠ PDF "by construction".
> - **S2** (🔴) — **Hai sanitize schema khác nhau**: preview cho phép `id` trên h1–h6 + `clobberPrefix:""` ([markdown-pipeline.ts:14-34](src/lib/markdown-pipeline.ts#L14)); export **không** cho `id` heading và **không** set `clobberPrefix` ([prepare-export.ts:111-124](src/modules/export/prepare-export.ts#L111)) → id heading bị strip/đổi `user-content-` ⇒ **anchor TOC chết trong PDF**.
> - **S3** (🔴) — **`injectHeadingNumbers` nhân đôi & lệch nhau**: bản preview bỏ qua heading rỗng ([PreviewPane.tsx:58](src/components/PreviewPane.tsx#L58)); bản export **không** bỏ qua, vẫn `state.index++` ([helpers.ts:31-32](src/modules/export/helpers.ts#L31)). Vì `numberHeadings` bỏ heading rỗng ([number-headings.ts:22](src/modules/format/number-headings.ts#L22)) ⇒ export **lệch off-by-one** ngay khi có 1 heading rỗng.
> - **S4** (🟠) — **TOC dựng 2 nơi**: React `TocBlock` ([PreviewPane.tsx:94](src/components/PreviewPane.tsx#L94)) vs string template ([print-preview.ts:31](src/modules/export/print-preview.ts#L31)).
> **Builds on:** `markdown-pipeline.ts`, `prepare-export.ts`, `print-preview.ts`, `helpers.ts`, `PreviewPane.tsx`.
> **Sources:** Product Review 2026-06-29; `VoiceAndContent.md §7`.

---

## 1. Micro-task Target

Thiết lập **một nguồn render duy nhất** dùng chung cho preview, print-preview và PDF: cùng processor, cùng sanitize schema, một `injectHeadingNumbers`, một bộ dựng TOC.

- **S1 — Một render core.** Tách hàm `renderReport(mdast | sections) → { html, hast }` trong `lib/markdown-pipeline.ts` (hoặc module `lib/report-render.ts` mới) làm **điểm vào duy nhất**. `prepare-export` và `PreviewPane` đều gọi nó; xoá `hastProcessor` riêng trong `prepare-export.ts`.
- **S2 — Một sanitize schema dùng chung.** Đưa `customSchema` (cho phép `id` h1–h6, `clobberPrefix:""`, `data:` protocol, class) thành **hằng export** từ `markdown-pipeline.ts`; `prepare-export` import dùng lại thay vì khai báo schema thứ hai. Bảo đảm id heading **không** bị strip ⇒ anchor TOC sống trong PDF.
- **S3 — Một `injectHeadingNumbers`.** Xoá bản trong `helpers.ts`, giữ **một** bản chuẩn (bỏ qua heading rỗng, đồng bộ với `numberHeadings`). Cả preview & export import cùng hàm.
- **S4 — Một TOC renderer.** Tách hàm dựng markup TOC dùng chung (React component + biến thể string, hoặc render HTML một lần rồi nhúng), đảm bảo cấu trúc/`id`/href khớp tuyệt đối hai phía.

> 🔒 Sau contract này **cấm tồn tại nhánh render thứ hai**. Mọi nơi cần HTML báo cáo phải đi qua render core.
> 🔒 Không đổi public `CheckResult`/`ReportSection`. Token-only, giọng `§7`.

## 2. Scope

### In scope
- [src/lib/markdown-pipeline.ts](src/lib/markdown-pipeline.ts) (MODIFY): export `customSchema`; (tuỳ chọn) thêm `renderReport` core.
- [src/lib/report-render.ts](src/lib/report-render.ts) (NEW, tuỳ chọn): điểm vào render hợp nhất nếu tách khỏi pipeline.
- [src/modules/export/prepare-export.ts](src/modules/export/prepare-export.ts) (MODIFY): bỏ `hastProcessor`/schema riêng, import schema + render core; import `injectHeadingNumbers` chuẩn.
- [src/modules/export/print-preview.ts](src/modules/export/print-preview.ts) (MODIFY): dùng TOC renderer chung.
- [src/modules/export/helpers.ts](src/modules/export/helpers.ts) (MODIFY): **xoá** `injectHeadingNumbers` trùng (giữ `PRESETS`/`getFlatText`).
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY): import `injectHeadingNumbers` + TOC renderer chung; bỏ bản nội bộ.
- [src/lib/report-render.test.ts](src/lib/report-render.test.ts) hoặc [src/modules/export/parity.test.ts](src/modules/export/parity.test.ts) (NEW): test **parity** preview-vs-export.

### Out of scope
- ❌ Sửa thuật toán đánh số (đó là `w19_fix_heading_numbering_single_source`).
- ❌ Sửa caption (đó là `w19_fix_figure_caption_dedup`).
- ❌ CSS in / bề mặt in (các contract TOC/PRINT).

## 3. Checklist
- [ ] **S1** Render core duy nhất; `prepare-export` không còn processor riêng.
- [ ] **S2** Một schema dùng chung; id heading sống trong cả preview & PDF (anchor click nhảy đúng).
- [ ] **S3** Một `injectHeadingNumbers`; xoá bản trùng; không off-by-one khi có heading rỗng.
- [ ] **S4** Một TOC renderer; href↔id khớp hai phía.
- [ ] Parity test: cùng input → cấu trúc HTML (heading id, thứ tự, caption hook) khớp. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/lib/markdown-pipeline.ts` | MODIFY | export `customSchema`; (opt) render core |
| `src/lib/report-render.ts` | NEW (opt) | điểm vào render hợp nhất |
| `src/modules/export/prepare-export.ts` | MODIFY | bỏ schema/processor riêng |
| `src/modules/export/print-preview.ts` | MODIFY | TOC renderer chung |
| `src/modules/export/helpers.ts` | MODIFY | xoá injector trùng |
| `src/components/PreviewPane.tsx` | MODIFY | dùng injector + TOC chung |
| `src/modules/export/parity.test.ts` | NEW | parity preview↔export |

> **Import boundary:** không lib mới. Chỉ tái cấu trúc nội bộ.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Refactor keystone gây regression rộng | High | Parity test + giữ chữ ký hàm cũ làm wrapper; commit nhỏ từng S. |
| Preview scope theo section vs export gộp toàn bộ gây khác counter | High | Tách "scope" khỏi "render": render core nhận danh sách heading đã đánh số; B chuẩn hoá nguồn số. |
| Sanitize chung nới lỏng bảo mật | Med | Giữ allow-list tối thiểu; chỉ thêm `id` heading + class đã dùng. |

## 6. Verification Plan
- Cùng một báo cáo: dump HTML preview và HTML export → diff cấu trúc (heading `id`, thứ tự node, hook caption) phải khớp.
- Mở PDF: click mục lục → nhảy đúng heading (anchor sống).
- Chèn 1 heading rỗng → số các heading sau **giống nhau** ở preview và PDF (hết off-by-one).
- 4 gate xanh (lint/typecheck/test/build).

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w19/near-completed`): `fix(export): unify preview/export into one render core, schema, heading injector and TOC renderer`.
