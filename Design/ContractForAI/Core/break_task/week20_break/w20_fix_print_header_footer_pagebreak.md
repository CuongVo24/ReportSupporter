# Contract For AI — W20 Fix (B): Khử Header/Footer Trình Duyệt · Strip Placeholder · Page-Break & Padding Bảng

> **Lane:** Core / break_task / week20_break.
> **Branch:** `w20/import-fidelity` (nhánh chung cả tuần).
> **Type:** Print surface / output cleanliness.
> **Findings:**
> - **S1** (🔴) — **PDF còn `localhost:3000` (footer) + timestamp** (#2, #3): in bằng `iframeWindow.print()` ([export-pdf.ts:110](src/modules/export/export-pdf.ts#L110)) trên tài liệu `http://localhost:3000`. Chrome **tự chèn** URL + ngày-giờ vào lề. CSS `@bottom-center`/`@top-center` (footer tuỳ biến) ở [print-css.ts:27-28](src/modules/export/print-css.ts#L27) **không được engine in của Chrome hỗ trợ** ⇒ footer của ta bị **bỏ im lặng**, để lộ default của trình duyệt.
> - **S2** (🟠) — **Placeholder `[CHÈN ẢNH BUYER LOGIN]` còn sót** (#4): `prepareExport`/`buildPrintableHtml` đưa text **nguyên văn**; rule text-markers chỉ *cảnh báo* trong Checker, **không** strip khi export.
> - **S3** (🟠) — **Khoảng trắng lớn & page-break xấu** (#7, #28): `figure/img/table { break-inside: avoid }` ([print-css.ts:47](src/modules/export/print-css.ts#L47)) đẩy figure xuống trang sau để lại lỗ; thiếu `break-after: avoid` chặt cho heading.
> - **S4** (🟡) — **Bảng glossary sát mép** (#8): `th,td { padding: 6pt }` hơi nhỏ.
> **Builds on:** `export-pdf.ts`, `print-css.ts`, `print-preview.ts`, `prepare-export.ts`.
> **Sources:** Product Review 2026-06-29 (#2, #3, #4, #7, #8, #27, #28).

---

## 1. Micro-task Target

PDF nộp bài **sạch dấu vết trình duyệt**: không URL/timestamp hệ thống, không placeholder soạn thảo, page-break gọn, bảng có lề thở.

- **S1 — Khử header/footer hệ thống.** Mặc định (no-dep): `@page { margin: 0 }` + bọc nội dung trong wrapper có padding lề (Chrome **bỏ** header/footer mặc định khi `margin: 0`). Bỏ `@bottom-center`/`@top-center` không-hiệu-lực; nếu cần footer "Báo cáo …"/"Trang x" thì render bằng **phần tử chạy** trong nội dung (không dựa vào engine). *(P2, tuỳ Approve)* Bật `renderPdfWithPuppeteer` để có footer "Trang x/y" thật.
- **S2 — Strip placeholder khi export.** Trong `prepareExport`, loại bỏ marker `[CHÈN …]`/`[TODO …]`/`{{…}}` (regex neo) khỏi nội dung in (vẫn cảnh báo ở Issues panel). Không sửa markdown nguồn.
- **S3 — Page-break.** Thêm `h1..h6 { break-after: avoid }` chặt; figure giữ `break-inside: avoid` nhưng cho phép caption dính hình; giảm "mồ côi" bằng `orphans/widows`. Tránh lỗ trắng vô lý.
- **S4 — Padding bảng.** Tăng `th,td` padding (vd 6→8–10pt) cho bản in, vẫn vừa A4.

> 🔒 Chỉ lo **bề mặt & dọn dẹp in**; nội dung/đánh số do A/C/D lo.
> 🔒 `--rs-report-*` bất biến (trắng-đen). Không thêm phụ thuộc mạng.

## 2. Scope

### In scope
- [src/modules/export/print-css.ts](src/modules/export/print-css.ts) (MODIFY): `@page margin:0` + wrapper padding; bỏ margin-box; `break-after: avoid`; padding bảng.
- [src/modules/export/print-preview.ts](src/modules/export/print-preview.ts) (MODIFY): wrapper lề nội dung; (tuỳ) phần tử footer chạy.
- [src/modules/export/prepare-export.ts](src/modules/export/prepare-export.ts) (MODIFY): strip placeholder marker khi export.
- [src/modules/export/export-pdf.ts](src/modules/export/export-pdf.ts) (MODIFY nhẹ / tuỳ Approve): nhánh Puppeteer cho footer/số trang thật.
- [src/modules/export/print-css.test.ts / prepare-export.test.ts](src/modules/export) (MODIFY): test không margin-box, strip placeholder.

### Out of scope
- ❌ Đánh số caption/heading (đó là C).
- ❌ Bố cục TOC/cover (kế thừa W19 `w19_fix_toc_print_layout`).
- ❌ Số trang thật ngoài nhánh Puppeteer (engine in HTML không tính được).

## 3. Checklist
- [ ] **S1** PDF không còn `localhost:3000`/timestamp ở lề.
- [ ] **S2** Không còn `[CHÈN ẢNH…]` trong PDF (vẫn cảnh báo ở panel).
- [ ] **S3** Heading không mồ côi; figure không để lỗ trắng vô lý.
- [ ] **S4** Bảng glossary có lề thở. 4 gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/export/print-css.ts` | MODIFY | `@page margin:0`, break rules, padding |
| `src/modules/export/print-preview.ts` | MODIFY | wrapper lề + footer chạy |
| `src/modules/export/prepare-export.ts` | MODIFY | strip placeholder |
| `src/modules/export/export-pdf.ts` | MODIFY (opt) | nhánh Puppeteer P2 |
| `src/modules/export/print-css.test.ts` | MODIFY | test no margin-box |

> **Import boundary:** không lib mới ở nhánh mặc định; Puppeteer chỉ khi Approve P2.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| `@page margin:0` mất lề → nội dung sát mép giấy | High | Wrapper padding mô phỏng lề 20/30mm; in thử A4 đo. |
| Chrome vẫn hiện header nếu user bật "Headers and footers" | Med | margin:0 ẩn mặc định; ghi chú hướng dẫn; lựa chọn Puppeteer cho chắc. |
| Strip placeholder nuốt nội dung thật | Med | Regex neo mẫu rõ (`[CHÈN`/`{{`); test; chỉ strip khi export, giữ nguồn. |
| Puppeteer làm nặng build | Med (P2) | Sau cờ Approve; lazy import; không bật mặc định. |

## 6. Verification Plan
- Export PDF → **không** thấy `localhost:3000`/`12:39 29/6/26` bất kỳ trang nào.
- Báo cáo có placeholder → PDF sạch, panel vẫn liệt kê.
- In thử 17–58 trang: heading không mồ côi, figure không để lỗ lớn, bảng có lề. 4 gate xanh.

## 7. Status

`PROPOSED — chờ Approve`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Commit (trên `w20/import-fidelity`): `fix(export): suppress browser print header/footer via zero-margin page, strip authoring placeholders, tighten page-breaks and table padding`.
