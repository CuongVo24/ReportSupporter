# Contract For AI — W4 Break: Fix PDF Phantom Download & DOCX Cover Line-Breaks

> **Lane:** Core / break_task / week4_break.
> **Branch:** `feature/W4-export-mvp` (hoặc `fix/w4-pdf-docx-breaks`).
> **Type:** Bug fix — review findings **#1 (🔴) PDF tải file HTML đội lốt `.pdf`**, **#2 (🟡) Cover DOCX dồn 1 dòng** (W4 export review).
> **Builds on:** Group B (`export-pdf.ts` `exportPdfViaBrowserPrint`), Group C (`export-docx.ts` `buildDocxCoverPage`), Group D (`use-export.ts` job lifecycle + download anchor).
> **Sources:** W4 export code review (PDF download / DOCX cover), `Design/Modules/4.Export.md §3` (PDF qua browser print), thư viện `docx@9.7.1` (`TextRun.break` — `\n` trong text **không** tạo ngắt dòng).

---

## 1. Micro-task Target

Vá 2 lỗi observable khi người dùng bấm export thật trên browser (test tự động không bắt được vì chỉ kiểm Blob/header):

- **#1 (🔴) File `.pdf` tải về thực chất là HTML.** `exportPdf` → `exportPdfViaBrowserPrint` mở print dialog (đúng) **nhưng** còn trả về `Blob` `text/html`. `use-export.ts` chạy đoạn download-anchor cho **mọi** target → người dùng vừa thấy hộp thoại in, vừa nhận file `report.pdf` chứa HTML. Mở file đó bằng PDF reader sẽ hỏng. Lộ trình PDF của MVP là "user chọn *Save as PDF* trong print dialog" — KHÔNG nên tự tải thêm một file giả.
- **#2 (🟡) Cover page DOCX dồn về một dòng.** `buildDocxCoverPage` dùng `text: cover.lecturer + "\n"`, `"Thành viên thực hiện:\n"`, `\`  • ${member}\n\``. Thư viện `docx` **không** render `\n` trong `TextRun` thành ngắt dòng — phải dùng `break: 1` hoặc tách `Paragraph`. Hậu quả: giảng viên + toàn bộ danh sách thành viên in liền nhau trên một dòng.

## 2. Scope

### In scope

**#1 — PDF không tải file rác** (`src/modules/export/use-export.ts`):
- Trong `runExport` **và** `retry`: với `target === "pdf"`, **bỏ qua** khối download-anchor (tạo `<a download>` + click). Job vẫn chuyển `done` bình thường khi `exportPdf` trả `ok` (print dialog đã do `exportPdfViaBrowserPrint` mở). Hai target `html`/`docx` giữ nguyên hành vi tải file.
  - Triển khai gợi ý: chỉ chạy khối download khi `target !== "pdf"` (HTML/DOCX). Không đổi chữ ký hàm, không đổi `ExportJob`.
- `src/modules/export/export-pdf.ts`: giữ trả `Blob` HTML (để test/đại diện output) **nhưng** cập nhật JSDoc `exportPdfViaBrowserPrint` ghi rõ: Blob trả về **chỉ là đại diện**, người gọi (`use-export`) **không** được tải nó ra dưới đuôi `.pdf`. Logic in **không đổi**.

**#2 — Cover DOCX ngắt dòng đúng** (`src/modules/export/export-docx.ts` · `buildDocxCoverPage`):
- Bỏ mọi `"\n"` nhúng trong `TextRun.text`. Mỗi dòng logic (giảng viên · nhãn "Thành viên thực hiện" · từng thành viên) phải là **một dòng riêng**, bằng một trong hai cách (chọn cách đầu cho rõ ràng):
  - **(A) khuyến nghị:** tách khối info thành **nhiều `Paragraph`** — 1 paragraph cho giảng viên, 1 cho nhãn thành viên, mỗi thành viên 1 paragraph (giữ `indent.left: 1440`, căn trái, style/size như cũ).
  - **(B) thay thế:** giữ một `Paragraph` nhưng dùng `new TextRun({ text, break: 1 })` để mỗi dòng mới bắt đầu bằng một line-break.
- Giữ nguyên: thứ tự cover (school → divider → title → course → info → date → `PageBreak`), font, size (26 = 13pt), bold nhãn.

**Regression tests** (thuần, không jsdom):
- **#1**: spy/mock `document.createElement("a")` (hoặc kiểm số lần click) — gọi `runExport("pdf", bundle)` trong môi trường có `window` → **không** tạo anchor `download` `.pdf`; job vẫn `done`. Gọi `runExport("html", …)` → **có** tải. (Có thể dùng jsdom env của vitest cho test này, hoặc kiểm gián tiếp qua không-throw + status.)
- **#2**: `exportDocx(bundle)` với `metadata.members = ["A","B","C"]` + `lecturer` → đếm số `Paragraph` trong cover (hoặc số `TextRun`/`break`) chứng minh mỗi thành viên nằm ở dòng riêng, **không** còn ký tự `"\n"` trong bất kỳ `TextRun.text` nào của cover.

### Out of scope
- ❌ Server-side Puppeteer PDF (`renderPdfWithPuppeteer` vẫn là stub — hardening sau).
- ❌ Header/footer/page-number Word-native (Phase-2, đã ghi Known Limitations).
- ❌ Native Word math object (W7) · Mermaid headless (sau).
- ❌ Tái cấu trúc trùng lặp `runExport`/`retry` và các điểm code-quality khác → **Contract 2** (`w4_improve_export_dedup_and_report_accuracy_contract.md`).

## 3. Checklist
- [x] `use-export.ts`: `target === "pdf"` **không** chạy download-anchor (cả `runExport` lẫn `retry`); job vẫn `done`. HTML/DOCX vẫn tải.
- [x] `export-pdf.ts`: JSDoc ghi rõ Blob là đại diện, không tải dưới `.pdf`. Logic in không đổi.
- [x] `export-docx.ts` `buildDocxCoverPage`: không còn `"\n"` trong `TextRun`; giảng viên + từng thành viên ở dòng riêng (Paragraph hoặc `break: 1`).
- [x] Tests: PDF không tạo anchor download · DOCX cover mỗi thành viên một dòng (không `\n`).
- [x] 4 gates xanh (lint / typecheck / test / build).

## 4. Expected Interfaces / Files

```ts
// use-export.ts — không đổi chữ ký; chỉ gating download theo target:
//   if (target !== "pdf") { /* tạo <a download> + click */ }
// export-pdf.ts — chữ ký không đổi; chỉ JSDoc.
// export-docx.ts — buildDocxCoverPage trả Paragraph[] như cũ, nội bộ ngắt dòng đúng.
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/use-export.ts` | MODIFY | ~+4 (gating 2 chỗ) |
| `src/modules/export/export-pdf.ts` | MODIFY | JSDoc only |
| `src/modules/export/export-docx.ts` | MODIFY | ~+15 (tách info block) |
| `src/modules/export/use-export.test.ts` | MODIFY | ~+25 (PDF no-download) |
| `src/modules/export/export-docx.test.ts` | MODIFY | ~+20 (cover line breaks) |

> **Import boundary** không đổi. Thuần, offline, no `fetch`. Không đổi `ExportJob`/`ExportResult` type.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Bỏ download PDF khiến user tưởng "không có gì xảy ra" nếu popup bị chặn | TB | `exportPdfViaBrowserPrint` đã trả lỗi "Popup blocked…" `recoverable` → job `error` + nút Thử lại hiển thị (đã có). Hành vi đúng. |
| `break: 1` (cách B) đặt sai vị trí làm dư/thiếu một dòng trống | Thấp | Khuyến nghị cách (A) nhiều `Paragraph` — rõ ràng, không phụ thuộc vị trí break. |
| Test mock anchor phụ thuộc môi trường jsdom | Thấp | Dùng env jsdom của vitest cho riêng test này, hoặc kiểm gián tiếp (status `done` + spy `createElement`). |
| Hồi quy: HTML/DOCX vô tình mất download | Thấp | Test khẳng định HTML vẫn tạo anchor; chỉ gate đúng nhánh `pdf`. |

## 6. Verification Plan
- Unit: `runExport("pdf", bundle)` (window có) → không có `<a download="*.pdf">` được click; job → `done`. `runExport("html", …)` → có anchor tải.
- Unit: `exportDocx` với `lecturer` + `members=["A","B","C"]` → cover không chứa `TextRun.text` nào có `"\n"`; mỗi thành viên một dòng riêng.
- Manual (khi chạy app): bấm **PDF** → chỉ hiện print dialog, **không** có file `.pdf` rác tải về. Bấm **DOCX** → mở Word, cover hiển thị giảng viên + danh sách thành viên xuống dòng đúng.
- lint / typecheck / test / build xanh.

## 7. Status

`DONE`
