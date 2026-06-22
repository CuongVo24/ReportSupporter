# 📅 WEEK 4: EXPORT MVP

> Phase 1 — MVP Report Workspace (W1-W4). Reference: `Design/RoadMap/MasterRoadMap.md` §Week 4.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Replace export stubs with usable HTML / browser-print PDF / DOCX — close the MVP loop.*

Tuần 4 là tuần "đóng vòng" MVP: biến các export stub/placeholder (W1) thành export **dùng được**. HTML là export thật, PDF MVP đi qua browser print / print CSS từ HTML đã format, DOCX sinh bằng **`docx`** từ mdast AST ở mức editable basic. Puppeteer chuyển sang hardening sau nếu browser print không đủ. Cuối tuần ra **acceptance report** đầu tiên trong `Design/Reports/`.

Mục tiêu chốt từ MasterRoadMap:
- Export Markdown to HTML.
- Export formatted report to PDF.
- Export formatted report to DOCX.
- Add export status and error handling.
- Produce first acceptance report in `Design/Reports/`.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** Module 4 — Export (`src/modules/export`) ở mức MVP đầy đủ 3 target.
- **Depends on:** W2 pipeline `unified` (HTML), W3 Format (heading numbering + TOC + caption), W1 types + export service skeleton.
- **Depended on by:** Phase 2 — W7 (PDF page-break / DOCX layout hardening), W8 (submission package gói export history + evidence.zip).
- **Node usage:** MVP không cần server-side PDF; Puppeteer worker/service là hardening sau.

---

## 3. 🔭 Scope

### ✅ In scope
- HTML export thật: pipeline `unified` + print CSS nhúng (A4, Times New Roman 13/14, line-height 1.5, justify).
- PDF export usable: browser print / print CSS từ HTML đã format.
- DOCX export thật: `docx` sinh từ mdast AST (deterministic, không LibreOffice/Pandoc).
- Cover page metadata (project title, school, course, lecturer, members) trong cả 3 format.
- Export status UI (idle / running / success / error) + error visible & recoverable.
- First acceptance report trong `Design/Reports/Month1/W4/`.

### ⛔ Out of scope (Non-goals + để Phase 2)
- PDF page-break/chapter-break tinh chỉnh nâng cao (→ W7 Format Hardening).
- DOCX layout verification checklist chi tiết (→ W7).
- List of figures/tables, references rules nâng cao (→ W7).
- `slides.pptx`, `evidence.zip`, `README.md` generator (→ Phase 2/3).
- `@react-pdf/renderer`, Pandoc, LibreOffice (CẤM — `TechnicalStack.md` §4).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W4-export-mvp`.

### Day 1 — HTML Export (real)
- `[MODIFY]` `src/modules/export/export-html.ts` (pipeline `unified` → `rehype-stringify` + print CSS nhúng)
- `[NEW]` `src/modules/export/print-css.ts` (A4, Times New Roman 13/14, line-height 1.5, justify — token từ Format W3)
- `[NEW]` `src/modules/export/build-cover-page.ts` (metadata → cover HTML)

### Day 2 — PDF Export via Browser Print
- `[MODIFY]` `src/modules/export/export-pdf.ts` (implement `exportPdfViaBrowserPrint()` to open/trigger print surface from formatted HTML)
- `[NEW]` `src/modules/export/print-preview.ts` (prepare printable HTML surface)
- *Lý do:* Có PDF submission-friendly sớm, không kéo Chromium/Puppeteer vào MVP (để dành `renderPdfWithPuppeteer()` cho later hardening).

### Day 3 — DOCX Export via `docx`
- `[MODIFY]` `src/modules/export/export-docx.ts` (mdast AST → `docx` Document: heading numbering, table, code block, image, caption)
- `[NEW]` `src/modules/export/mdast-to-docx.ts` (mapping node → docx element)

### Day 4 — Export Status & Error Handling
- `[NEW]` `src/modules/export/ExportPanel.tsx` (chọn target, trạng thái idle/running/success/error)
- `[NEW]` `src/modules/export/use-export.ts` (gọi export, surface error — không nuốt exception)
- `[NEW]` `src/types/export.ts` (`ExportTarget`, `ExportStatus`, `ExportResult`, `ExportJob`)
- `[MODIFY]` `src/modules/export/index.ts` (public surface)

### Day 5 — Acceptance Report & QA
- Chạy 3 export trên sample report → kiểm cover page + heading + table + code + image + caption.
- `[NEW]` `Design/Reports/Month1/W4/W4_Acceptance_Report.md`, `samples/` (report.html · report.pdf · report.docx), `build_output.txt`

---

## 5. 📦 Dependencies installed this week

| Library | Why (this week) | Stack ref |
|---|---|---|
| `docx` | DOCX sinh trực tiếp từ mdast AST, deterministic, không cần LibreOffice/Pandoc | §4 |

> HTML export tái dùng `rehype-stringify` (đã cài W2). **CHƯA cài:** `qrcode` (→W5), `pptxgenjs` (→Phase 3).

---

## 6. 📤 Deliverables

- Export HTML thật (print CSS A4 + cover page).
- Export PDF usable qua browser print / print CSS.
- Export DOCX thật qua `docx` từ mdast.
- 3 format giữ heading structure / table / code block / image / caption nhất quán.
- Export status UI + error visible & recoverable.
- **First acceptance report** + sample files trong `Design/Reports/Month1/W4/`.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Browser print khác nhau giữa trình duyệt | Medium | Dùng print CSS chuẩn A4; ghi rõ header/footer/page number là best-effort ở MVP, Puppeteer hardening sau. |
| PDF ≠ preview HTML (numbering/caption lệch) | High | PDF render từ chính HTML pipeline + numbering W3 (cùng nguồn AST). |
| DOCX không trung thực Markdown phức tạp | Medium | Map mdast node có kiểm soát; test trên sample đa dạng (table/code/math/image). |
| Export nuốt exception | Medium | `ExportResult` typed, error visible & recoverable (`Modules/4.Export.md` Acceptance). |
| Vượt scope sang "convert mọi định dạng" | High | Chỉ 3 target `report.html/pdf/docx` + README→report (`ProductPRD.md` §6). |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` xanh.
- [ ] `npm run typecheck` xanh (no `any`).
- [ ] `npm run build` xanh.
- [ ] `Vitest` xanh (mdast→docx mapping + cover page có test).
- [ ] 3 export (HTML/PDF/DOCX) chạy thật trên sample report.
- [ ] Cover page metadata + heading + table + code + image + caption đúng cả 3 format.
- [ ] Export error visible & recoverable (không nuốt exception).
- [ ] PDF browser print dùng cùng HTML/numbering với preview (deterministic best-effort).
- [ ] **First acceptance report** + samples tại `Design/Reports/Month1/W4/`.
- [ ] Commit kèm contract, branch `feature/W4-export-mvp`.
