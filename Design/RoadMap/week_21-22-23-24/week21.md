# 📅 WEEK 21: IMPORT FOUNDATION & DOCX

> Phase 5 — Universal Import (W21-W24). Reference: `Design/RoadMap/MasterRoadMap.md` §Phase 5, `Design/Modules/6.Import.md`.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Dựng xương sống Universal Import — và format đầu tiên phải là format "thắng chắc": DOCX.*

Tuần mở Phase 5: khoá **Import Model** (`CanonicalTypes.md` §11), dựng **converter registry** + **universal dropzone** (đường `.md` hiện có refactor thành converter đầu tiên, không đổi behavior), dựng **reverse pipeline** HTML → Markdown (`rehype-remark` + `remark-stringify`, chỉ sống trong module Import), và ship **DOCX converter** qua `mammoth` (heading/list/table giữ cấu trúc, ảnh nhúng → `ReportAsset`). DOCX đi trước vì cho kết quả đẹp nhất với ít công nhất — khung registry chuẩn hoá tại đây để W22-W23 chỉ "cắm thêm converter".

Mục tiêu chốt từ MasterRoadMap:
- Khoá Import Model + converter registry + universal dropzone.
- Reverse pipeline HTML → Markdown chỉ sống trong Import.
- DOCX converter: cấu trúc giữ được, ảnh nhúng thành asset.
- Heading → section split + `ImportDraft` + warnings chuẩn hoá.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** Module 6 — Import (mới, `src/modules/import/`).
- **Depends on:** pipeline unified (W2), `markdown-import.ts`/`import-assets.ts` (đường .md hiện có), sanitize policy preview.
- **Depended on by:** W22 (PDF), W23 (XLSX/PPTX), W24 (preview diff/OCR/close).
- **Đo theo:** `6.Import.md` §5 (DOCX row) — heading/list/table/image sang đúng cấu trúc trên fixtures.

---

## 3. 🔭 Scope

### ✅ In scope
- `CanonicalTypes.md` §11 vào code: `src/types/import.ts` + zod schema ranh giới I/O.
- Registry (`resolve` theo extension + MIME, `maxBytes` gate, reject-có-thông-báo).
- UniversalImportDropzone thay `MarkdownImportDropzone` — `.md` là converter đầu tiên, behavior cũ giữ nguyên.
- `htmlToMarkdown()` (sanitize → rehype-remark → remark-stringify, GFM) nội bộ module Import.
- DOCX converter (`mammoth`): heading/list/table → Markdown; ảnh base64 → `ReportAsset` + link `asset://<id>`.
- Section split theo heading (tái dùng logic readme-import) + `ImportDraft` (absorb `MarkdownImportDraft`).
- Fixtures `.docx` + snapshot tests.

### ⛔ Out of scope
- PDF/XLSX/PPTX converter (W22/W23); OCR (W24); preview diff UI đầy đủ (W24 — tuần này dùng draft confirm hiện có).
- Backend conversion; formula engine; fidelity layout 1:1.
- Đổi behavior Write/Format/Check/Export ngoài điểm cắm dropzone.

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W21-import-foundation`.

### Day 1 — Import Types & Reverse Pipeline
- `[NEW]` `src/types/import.ts` (+ zod) khớp CanonicalTypes §11; `ReportIssue.module` thêm `"import"`.
- Cài `rehype-remark`, `remark-stringify`, `mammoth` (runtime, exact pin — approve trước).
- `[NEW]` `src/modules/import/html-to-markdown.ts` — sanitize → rehype-remark → stringify GFM.

### Day 2 — Converter Registry & Universal Dropzone
- `[NEW]` `src/modules/import/registry.ts` + `converters/markdown.ts` (refactor đường .md).
- `[MODIFY]` `MarkdownImportDropzone` → `UniversalImportDropzone` — accept list từ registry, reject format lạ có thông báo.

### Day 3 — DOCX Converter
- `[NEW]` `src/modules/import/converters/docx.ts` — mammoth → HTML → `htmlToMarkdown()`.
- Strip số chương hard-code đầu heading (Format là nguồn số duy nhất).

### Day 4 — Assets, Section Split & ImportDraft
- Ảnh nhúng docx → `ReportAsset` (base64) qua đường `import-assets`; link rewrite `asset://<id>`.
- `ImportDraft` + heading→section split; warnings `unsupported-element`/`image-skipped`/`table-flattened`.

### Day 5 — Fixtures, Tests & QA
- `[NEW]` fixtures `.docx` (Word VN thực tế: heading/list/bảng/ảnh) + snapshot tests Vitest.
- `[NEW]` `Design/Reports/Month6/W21/W21_QA_Report.md` + `build_output.txt`.

---

## 5. 📦 Dependencies installed this week

| Library | Why | Stack ref |
|---|---|---|
| `rehype-remark` | HTML → mdast (reverse pipeline, chỉ trong Import) | `PipelineContract.md` §4 |
| `remark-stringify` | mdast → Markdown text | `PipelineContract.md` §4 |
| `mammoth` | DOCX → HTML semantic, chạy client-side | `6.Import.md` §5 |

> Runtime deps, exact pin, approve trước khi cài. **FORBIDDEN:** import `rehype-remark`/`remark-stringify` ngoài `src/modules/import/`.

---

## 6. 📤 Deliverables

- Import Model trong code + zod; registry + universal dropzone (đường .md không đổi behavior).
- `htmlToMarkdown()` reverse pipeline nội bộ Import.
- DOCX → Markdown: heading/list/table/image đúng cấu trúc trên fixtures; warnings chuẩn.
- `ImportDraft` thống nhất (hết `MarkdownImportDraft` song song).
- `Design/Reports/Month6/W21/` QA report + build log.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Reverse pipeline rò ra module khác | High | Lint/grep gate: `rehype-remark` chỉ trong `src/modules/import/`. |
| XSS qua HTML mammoth | High | Sanitize bắt buộc trước rehype-remark (PipelineContract §4). |
| Refactor dropzone vỡ đường .md cũ | Medium | Test regression import .md trước/sau; behavior giữ nguyên. |
| Docx VN (Times New Roman, bảng điểm) lệch | Medium | Fixtures lấy từ báo cáo thật; snapshot đối chiếu. |
| Hai shape draft song song | Medium | W21 absorb `MarkdownImportDraft` vào `ImportDraft` — một nguồn. |

---

## 8. ✅ Definition of Done

- [ ] `npm run lint` + `typecheck` + `build` xanh; Vitest xanh toàn bộ.
- [ ] Registry route đúng theo extension+MIME; format lạ reject có thông báo; 50MB gate hoạt động.
- [ ] Import `.md` behavior y hệt trước refactor (regression test).
- [ ] DOCX fixtures: heading/list/bảng/ảnh sang đúng; ảnh thành `ReportAsset`, preview render được.
- [ ] Không heading nào mang số chương hard-code sau import.
- [ ] `rehype-remark`/`remark-stringify`/`mammoth` không bị import ngoài module Import.
- [ ] QA report + build log tại `Design/Reports/Month6/W21/`.
- [ ] Commit kèm contract, branch `feature/W21-import-foundation`.
