# Contract For AI - W7 Group D: PDF Page-break Behavior

> **Lane / Week:** Core / Month 2 / W7 - Day 4 (`Design/TaskBrief/Core/month2/w7.md` `[C82]`-`[C83]`).
> **Branch:** `feature/W7-format-hardening`.
> **Builds on:** W4 export **thật** (`src/modules/export/print-css.ts`, `export-pdf.ts` — đã ship, browser-print path), `FormatPreset.chapterStartsNewPage` (`src/types/format.ts`).
> **Depended on by:** Group E (DOCX parity với PDF), W8 submission package.
> **Sources:** `w7.md` Locked Decisions #1/#5/#6, `week7.md` Day 4, `2.Format.md` ("start new major chapter on a new page"), `4.Export.md §5.3`.

---

## 1. Micro-task Target

Siết **page-break PDF**: chương lớn (h1) bắt đầu trang mới, tránh widow/orphan heading, giữ caption với nội dung; ổn định page number/header/footer qua các trang trên đường browser-print.

> **🔒 Harden export THẬT, không stub (Locked #5).** `print-css.ts`/`export-pdf.ts` đã tồn tại và chạy (W4). Group D **tinh chỉnh tại chỗ**, không viết export mới.
> **🔒 Browser-print MVP; Puppeteer OFF (Locked #6).** Page-break là print CSS; header/footer/page-number là best-effort, không hứa pixel-parity. Puppeteer chỉ đụng nếu có Contract hardening riêng được duyệt.
> **🔒 Một nguồn (Locked #1).** Không re-number heading/caption; chỉ thêm hành vi ngắt trang.

## 2. Scope

### In scope (`[C82]`/`[C83]`)
- `src/modules/export/print-css.ts` (MODIFY): `break-before: page` cho h1 (chương lớn) khi `chapterStartsNewPage`; `break-after: avoid` cho heading (tránh orphan heading cuối trang); `break-inside: avoid` cho khối caption + hình/bảng (keep-with-next); widow/orphan control cho paragraph.
- `src/modules/export/export-pdf.ts` (MODIFY): ổn định page number/header/footer qua trang trên đường `window.print()` (ghi rõ best-effort theo trình duyệt). Giữ `renderPdfWithPuppeteer()` **OFF** (không cài Chromium).
- Vitest/snapshot: print-css chứa các quy tắc `break-before/after/inside` cho h1/heading/figure; export-pdf vẫn chạy browser-print path (không bật Puppeteer); không đổi numbering.

### Out of scope
- ❌ Bật Puppeteer / cài Chromium (Contract riêng nếu cần).
- ❌ Caption/LoF/LoT (Groups A/B).
- ❌ References (Group C).
- ❌ DOCX (Group E).
- ❌ Re-number heading/caption.
- ❌ Dep mới.

## 3. Checklist
- [ ] `print-css.ts`: h1 `break-before: page` theo `chapterStartsNewPage`; heading `break-after: avoid`; caption/figure `break-inside: avoid`; widow/orphan.
- [ ] `export-pdf.ts`: header/footer/page-number ổn định best-effort; Puppeteer giữ OFF.
- [ ] Không đổi numbering (một nguồn).
- [ ] Test/snapshot print CSS rules + export-pdf vẫn browser-print.
- [ ] ≤200 dòng/file; 4 gates xanh.

## 4. Expected Interfaces / Files

> Không thêm public API; tinh chỉnh print CSS + PDF path hiện có.

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/print-css.ts` | MODIFY | ~+25 (break rules) |
| `src/modules/export/export-pdf.ts` | MODIFY | ~+15 (header/footer/page-number) |
| `src/modules/export/print-css.test.ts` (hoặc export-pdf.test.ts) | NEW/MODIFY | ~50 |

> **Import boundary:** export nội bộ; không dep mới; Puppeteer OFF. No `fetch`, offline.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Page-break khác nhau giữa trình duyệt | Medium | Print CSS chuẩn A4; test trên sample đa template; mở Puppeteer chỉ khi không đủ (Contract riêng). |
| Vô tình re-number/đổi layout caption | Low | Chỉ thêm CSS break; không gọi numbering; test numbering không đổi. |
| Header/footer/page-number không ổn định | Medium | Ghi rõ best-effort; dùng `@page` margin box khi trình duyệt hỗ trợ. |
| Bật nhầm Puppeteer (dep không có) | Low | Giữ stub OFF; test khẳng định browser-print path. |

## 6. Verification Plan
- PDF sample (đa template): mỗi chương h1 bắt đầu trang mới; không heading mồ côi cuối trang.
- Caption đi cùng hình/bảng (không tách trang giữa caption và hình).
- Page number/header/footer xuất hiện qua các trang (best-effort).
- export-pdf vẫn chạy browser-print (Puppeteer OFF); numbering không đổi.
- lint/typecheck/test/build xanh; lưu PDF before/after vào samples (Group E).

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: (1) `fix(export): PDF page-break for chapters + widow/orphan control`; (2) `feat(export): stable page number/header/footer (best-effort)`; +1 docs commit.
