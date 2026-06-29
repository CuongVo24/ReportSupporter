# Contract For AI — W19 Fix (B): Một Nguồn Đánh Số Heading

> **Lane:** Core / break_task / week19_break.
> **Branch:** `w19/near-completed` (nhánh chung cả tuần).
> **Type:** Defect-root / numbering correctness.
> **Findings:**
> - **S1** (🔴 Critical) — **Đánh số chồng đôi**: hệ thống *tự sinh* số rồi **prepend** vào text heading mà tác giả **đã gõ sẵn** số ([PreviewPane.tsx:62](src/components/PreviewPane.tsx#L62) / [helpers.ts:33](src/modules/export/helpers.ts#L33)). Nguồn `## 6.1. Vấn Đề…` + số sinh `6.1` ⇒ render **"6.1 6.1."** = #3 `6.1.6.1`. UI còn có gợi ý "không cần tự gõ số" ([PreviewPane.tsx:335](src/components/PreviewPane.tsx#L335)) nhưng không **ép** điều đó.
> - **S2** (🔴) — **Counter cấp-1 = 0**: `numberHeadings` khởi tạo mảng đếm `[0,…]` ([number-headings.ts:16](src/modules/format/number-headings.ts#L16)); section mở đầu bằng `##` (h2) mà chưa có `#` (h1) ⇒ cấp-1 = 0 ⇒ **`0.1`** (#4). Kết hợp S1 ⇒ "0.1 1.4. Phạm Vi…".
> **Builds on:** `number-headings.ts`, `parse-headings.ts`; chạy **sau** `w19_fix_unified_render_pipeline` (để chỉ còn 1 injector).
> **Sources:** Product Review 2026-06-29.

---

## 1. Micro-task Target

Bảo đảm **chỉ một nguồn số duy nhất** (số tự sinh), loại số tác giả gõ tay, và counter ổn định khi tài liệu không mở đầu bằng h1.

- **S1 — Strip số gõ tay.** Trước khi `injectHeadingNumbers`, chuẩn hoá text heading: bóc tiền tố số phân cấp ở đầu (`^\s*\d+(\.\d+)*\s*[.)]?\s+`) **chỉ khi** đứng đầu heading, giữ nguyên phần chữ (kể cả tiếng Việt có dấu). Áp ở tầng `parseHeadings`/normalize, không sửa file nguồn của người dùng.
- **S2 — Counter cấp-1 bền.** Khi tài liệu/đoạn bắt đầu ở depth > 1, **không** để cấp trên = 0: hoặc (a) "promote" — coi heading đầu tiên là gốc tương đối, hoặc (b) đảm bảo ít nhất `1` cho cấp thiếu (tránh `0.x`). Quy tắc khai báo rõ + test biên (mở đầu h2/h3, nhảy cấp h1→h3).
- **S3 — Một nguồn áp dụng cả TOC & body.** Vì A đã hợp nhất injector, B chỉ cần sửa `numberHeadings`/normalize ⇒ TOC (`generateToc`) và body tự nhất quán.

> 🔒 **Không sửa markdown nguồn của người dùng**; chỉ chuẩn hoá khi parse→render. Người dùng vẫn gõ tự nhiên.
> 🔒 Strip phải an toàn: không nuốt nhầm nội dung không phải số thứ tự (vd "2024 báo cáo" không bị coi là số mục).

## 2. Scope

### In scope
- [src/modules/format/number-headings.ts](src/modules/format/number-headings.ts) (MODIFY): counter cấp-1 bền; (tuỳ) nhận cờ `stripManualNumber`.
- [src/modules/format/parse-headings.ts](src/modules/format/parse-headings.ts) (MODIFY): bóc tiền tố số khi trích text heading (hoặc hàm `stripHeadingNumberPrefix` riêng dùng chung).
- [src/modules/format/strip-heading-number.ts](src/modules/format/strip-heading-number.ts) (NEW, tuỳ chọn): regex bóc tiền tố + test riêng.
- [src/modules/format/number-headings.test.ts](src/modules/format/number-headings.test.ts) (MODIFY): test chồng-số, `0.x`, nhảy cấp.
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY nhẹ): gợi ý/hint cập nhật nếu cần (số tự sinh là chuẩn).

### Out of scope
- ❌ Hợp nhất injector (đã làm ở A).
- ❌ Caption numbering (đó là C).

## 3. Checklist
- [ ] **S1** Bóc tiền tố số gõ tay an toàn; `## 6.1. X` → hiển thị đúng **"6.1 X"** (không `6.1.6.1`).
- [ ] **S2** Section mở đầu h2 không còn `0.x`; quy tắc test biên xanh.
- [ ] **S3** TOC & body khớp số sau chuẩn hoá. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/format/strip-heading-number.ts` | NEW (opt) | regex + test bóc tiền tố |
| `src/modules/format/parse-headings.ts` | MODIFY | dùng strip khi trích text |
| `src/modules/format/number-headings.ts` | MODIFY | counter cấp-1 bền |
| `src/modules/format/number-headings.test.ts` | MODIFY | test chồng-số/`0.x`/nhảy cấp |

> **Import boundary:** không lib mới.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Strip nuốt nhầm chữ (false positive) | High | Regex neo đầu + yêu cầu khoảng trắng sau số; test tiếng Việt/đời thực. |
| "Promote" cấp-1 phá phân cấp đa-section | Med | Đánh số **toàn cục** theo thứ tự section (A đã gộp); test tài liệu nhiều chương. |
| Người dùng *muốn* tự đánh số | Low | Mặc định auto; (P2) cờ format `manualNumbering` tắt strip — ghi backlog. |

## 6. Verification Plan
- `## 6.1. Vấn Đề…` → preview/PDF hiển thị **"6.1 Vấn Đề…"** (đúng 1 số).
- Section bắt đầu `## 1.4. Phạm Vi` trong tài liệu có chương 1 (h1) → ra `1.4`, **không** `0.1`.
- Heading chứa năm "Báo cáo 2024" (không phải mục) → **không** bị bóc.
- 4 gate xanh.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w19/near-completed`): `fix(format): single source heading numbering — strip manual prefixes and stabilize level-1 counter`.
