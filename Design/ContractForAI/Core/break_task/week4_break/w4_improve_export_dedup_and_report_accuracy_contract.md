# Contract For AI — W4 Break: De-dup Export Hook, Cache AST & Honest QA Report

> **Lane:** Core / break_task / week4_break.
> **Branch:** `feature/W4-export-mvp` (hoặc `chore/w4-export-cleanup`).
> **Type:** Code-quality / accuracy — review findings **#3** (trùng lặp `useExport`), **#4** (parse 2 lần trong `prepareExport`), **#5** (artefact PDF lệch bằng chứng), **#6** (Acceptance Report tô hồng). Không đổi hành vi observable.
> **Builds on:** Group D (`use-export.ts`), Group A pipeline (`prepare-export.ts`), Group E (`W4_Acceptance_Report.md`, `samples/`).
> **Sources:** W4 export code review (code-quality), `Design/Modules/4.Export.md §8` (QC checklist), `Design/Reports/Month1/W4/`.

---

## 1. Micro-task Target

Dọn 4 điểm chất lượng/độ trung thực sau khi 2 bug (Contract 1) đã vá. **Không** thay đổi output người dùng nhìn thấy — chỉ giảm trùng lặp, bớt parse thừa, và làm tài liệu QA khớp thực tế.

- **#3 `useExport` lặp ~80 dòng.** `runExport` và `retry` gần như y hệt (chọn exporter theo target → pack DOCX → tải Blob → set job). Logic lệch nhau theo thời gian là rủi ro thật.
- **#4 `prepareExport` parse mỗi section 2 lần.** Vòng 1 (`prepare-export.ts` ~dòng 53-62) parse để gom heading đánh số; vòng 2 (~dòng 83-170) parse lại chính các section đó để dựng body. Mỗi section qua `parseMarkdown` hai lần.
- **#5 Artefact `samples/report.pdf` lệch bằng chứng.** File là PDF thật (tạo tay) trong khi app MVP sinh HTML rồi để browser "Save as PDF". Người đọc báo cáo dễ hiểu nhầm app xuất PDF nhị phân trực tiếp.
- **#6 Acceptance Report tô hồng.** Nhiều mục đánh `PASS` nhưng thực chất là *fallback* (math trong DOCX, mermaid, page-number). "100% parity" tuyệt đối hoá quá mức.

## 2. Scope

### In scope

**#3 — Tách executor dùng chung** (`src/modules/export/use-export.ts`):
- Trích một hàm nội bộ `executeExport(target, bundle, fileName)` chứa toàn bộ: chọn exporter (html/pdf/docx) → pack DOCX (try/catch → `ExportError` `render-docx` `recoverable`) → trả `Blob`. Cả `runExport` và `retry` gọi chung; mỗi nơi tự lo phần set job (`running`/`done`/`error`) và tải file.
- **Giữ nguyên hành vi** sau Contract 1: nhánh `pdf` không tải file (tôn trọng gating của Contract 1 — executor trả Blob, người gọi quyết định tải hay không theo `target`). Giữ nguyên mapping `stage` lỗi (`render-html`/`render-pdf`/`render-docx`) và `recoverable`.
- Không đổi chữ ký public `useExport` / `runExport` / `retry` / `ExportJob`.

**#4 — Parse một lần** (`src/modules/export/prepare-export.ts`):
- Parse mỗi section **một lần**, lưu lại AST (vd `{ sec, ast }[]`), dùng cho cả bước gom heading (đánh số toàn cục) lẫn bước dựng body. Lưu ý `injectHeadingNumbers` đang mutate AST → đảm bảo thứ tự: gom heading từ AST **trước**, rồi `injectHeadingNumbers` trên **cùng** AST đó (không parse lại). Kết quả `combinedMdast`/`hast`/`toc`/`figures`/`tables` phải **không đổi** so với hiện tại.

**#5 — Artefact PDF trung thực** (`Design/Reports/Month1/W4/`):
- Trong `W4_Acceptance_Report.md` §4, chú thích rõ `report.pdf` được tạo bằng **"Save as PDF" từ print dialog của trình duyệt** (không phải app xuất nhị phân trực tiếp). Tuỳ chọn: đổi tên/đặt cạnh `report.print.html` (HTML mà app thực sự sinh) để đối chiếu. Không cần regenerate binary.

**#6 — QC checklist thành thật** (`W4_Acceptance_Report.md` §2 & §1):
- Đổi các mục thực chất là fallback sang `PASS (fallback)` kèm 1 dòng nói rõ giới hạn: Math trong DOCX (text trong ngoặc, không phải OMML), Mermaid (liệt kê code nếu chưa pre-render), page-number/header-footer (browser-managed). 
- Bỏ/định lượng lại tuyên bố tuyệt đối "100% parity" → "numbering parity (cùng một nguồn số, map trực tiếp)".

### Out of scope
- ❌ Bất kỳ thay đổi output observable nào (HTML/PDF/DOCX bytes giữ nguyên ngoài cover đã sửa ở Contract 1).
- ❌ 2 bug PDF-download / DOCX-cover → **Contract 1**.
- ❌ Memoize numbering ở tầng React/Workspace (đã làm ở W3 break) — đây chỉ là `prepareExport` thuần.
- ❌ Native math/mermaid render (W7+).

## 3. Checklist
- [ ] `use-export.ts`: có `executeExport` dùng chung; `runExport`/`retry` không còn lặp khối chọn-exporter/pack. Hành vi + `stage`/`recoverable` không đổi; PDF vẫn không tải file.
- [ ] `prepare-export.ts`: mỗi section parse đúng **một lần**; `toc`/`figures`/`tables`/`hast` đầu ra không đổi (test cũ vẫn xanh).
- [ ] `W4_Acceptance_Report.md`: artefact PDF chú thích nguồn gốc; các mục fallback ghi `PASS (fallback)`; bỏ "100%" tuyệt đối.
- [ ] Tests cũ (136) vẫn xanh; thêm/giữ test khẳng định `prepareExport` output bất biến.
- [ ] 4 gates xanh (lint / typecheck / test / build).

## 4. Expected Interfaces / Files

```ts
// use-export.ts — nội bộ, không export:
async function executeExport(
  target: ExportTarget,
  bundle: ReportProjectBundle
): Promise<Blob>; // throw ExportError; người gọi lo set job + (tuỳ target) tải file

// prepare-export.ts — chữ ký public KHÔNG đổi:
export function prepareExport(bundle: ReportProjectBundle): ExportInput;
```

| File | NEW/MODIFY | Est. lines |
|---|---|---:|
| `src/modules/export/use-export.ts` | MODIFY | ~−60 (gộp), +~30 helper |
| `src/modules/export/prepare-export.ts` | MODIFY | ~−10 (bỏ vòng parse 2) |
| `src/modules/export/prepare-export.test.ts` *(nếu chưa có, thêm)* | NEW/MODIFY | +~20 (output bất biến) |
| `Design/Reports/Month1/W4/W4_Acceptance_Report.md` | MODIFY | ~+10 (chú thích) |

> **Import boundary** không đổi. Thuần, offline, no `fetch`. Refactor an toàn: dựa vào 136 test hiện có làm lưới hồi quy.

## 5. Risks & Mitigations

| Risk | Mức | Mitigation |
|---|---:|---|
| Gộp `executeExport` làm lệch xử lý lỗi DOCX-pack | TB | Giữ try/catch pack → `ExportError` `render-docx` `recoverable` y như cũ; test error-path DOCX hiện có phải vẫn xanh. |
| Parse-một-lần đổi thứ tự mutate (`injectHeadingNumbers`) gây lệch số | TB | Gom heading từ AST trước khi inject; assert `toc`/numbering output bằng snapshot test cũ. |
| Refactor vô tình đổi PDF gating của Contract 1 | Thấp | Làm Contract 1 trước; test "PDF no-download" của Contract 1 phải còn xanh. |
| Sửa report bị coi là "hạ chuẩn" nghiệm thu | Thấp | Đây là tăng độ trung thực (fallback vẫn là PASS có điều kiện), không phải fail mới. |

## 6. Verification Plan
- Unit: `prepareExport(bundle)` cho cùng input → `toc`, `figures`, `tables`, `combinedMdast.children.length` **bằng** baseline (snapshot/giá trị cứng) ⇒ refactor không đổi output.
- Unit: error-path DOCX (pack lỗi) vẫn cho job `error` `stage: render-docx` `recoverable: true`.
- Unit: HTML vẫn tải, PDF vẫn không tải (kế thừa test Contract 1).
- Đọc lại `W4_Acceptance_Report.md`: mọi `PASS` fallback đều có chú thích; không còn "100%".
- lint / typecheck / test / build xanh (136 + bổ sung).

## 7. Status

`PENDING` — chờ Approve. Thực hiện **sau** Contract 1 (`w4_fix_pdf_download_and_docx_cover_breaks_contract.md`).

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. Đề xuất commit: `refactor(export): share export executor + single-parse pipeline` + `docs(qa): make W4 acceptance report fallback-honest`.
