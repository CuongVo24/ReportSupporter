# 📅 WEEK 22: PDF IMPORT

> Phase 5 — Universal Import (W21-W24). Reference: `Design/RoadMap/MasterRoadMap.md` §Phase 5, `Design/Modules/6.Import.md`.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *PDF → Markdown ngay trong trình duyệt — cấu trúc đúng, và trung thực về những gì không sang được.*

Tuần khó nhất Phase 5. PDF không mang semantic structure như DOCX — chỉ có chữ + toạ độ + font. Chiến lược: `pdfjs-dist` trích **text kèm font/position metadata** theo trang, rồi tầng **heuristic layout**: cluster font-size → heading levels, merge dòng → paragraph, regex bullet/số → list. Ảnh trong PDF trích thành `ReportAsset`. Trang scan (không text layer) **không im lặng bỏ qua** — phát warning `scanned-page` (OCR để W24). Mọi heading suy ra từ heuristic đều gắn `heading-guessed` để user xác nhận ở preview.

Mục tiêu chốt từ MasterRoadMap:
- `pdfjs-dist` (worker bundle local): trích text theo trang kèm font/position.
- Heuristic: font-size clustering → heading; merge dòng → paragraph; list detection.
- Trích ảnh → `ReportAsset`; phát hiện trang scan → `scanned-page`.
- Giới hạn an toàn: 50MB, page cap 300; bảng flatten + warning.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** `src/modules/import/converters/pdf.ts` + tầng heuristic.
- **Depends on:** W21 registry/`ImportResult`/warnings/section split.
- **Depended on by:** W24 (OCR chạy trên trang `scanned-page`; preview diff remap `heading-guessed`).
- **Đo theo:** `6.Import.md` §5 (PDF row) — fixtures PDF từ Word/LaTeX ra đúng heading/paragraph/list.

---

## 3. 🔭 Scope

### ✅ In scope
- `pdfjs-dist` exact pin; worker của pdf.js bundle **local** (không CDN — offline posture).
- Text extraction per page: item + font size/name + transform (toạ độ).
- Heuristic module (pure functions, test được): font-size clustering → heading map; line merge; list detection.
- Image extraction (embedded image objects) → `ReportAsset`; ảnh hỏng/quá lớn → `image-skipped`.
- Scanned-page detection: trang không có text layer → warning `scanned-page` + placeholder ghi chú trong Markdown.
- Registry integration + limits (50MB, 300 trang) + `table-flattened` khi gặp vùng nghi là bảng.
- Fixtures: PDF export từ Word, từ LaTeX, PDF scan.

### ⛔ Out of scope
- OCR (W24 — experimental); tái tạo bảng PDF thành GFM table hoàn chỉnh (flatten + warning là chấp nhận được).
- Layout 2 cột hoàn hảo (best-effort theo thứ tự đọc; ghi limitation).
- Form fields/annotation/chữ ký số.

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W22-import-pdf`.

### Day 1 — pdfjs Setup & Text Extraction
- Cài `pdfjs-dist` (exact pin, approve trước); config worker bundle local.
- `[NEW]` `converters/pdf.ts` khung + `pdf/extract-text.ts` — text items + font + position per page.

### Day 2 — Layout Heuristics
- `[NEW]` `pdf/heading-heuristic.ts` — cluster font-size (body = mode; lớn hơn → h1/h2/h3 theo bậc).
- `[NEW]` `pdf/paragraph-merge.ts` + list detection (bullet chars, "1.", "a)"). Heading heuristic → `heading-guessed`.

### Day 3 — Images & Scanned Pages
- Image extraction → `ReportAsset` (base64) + chèn đúng vị trí tương đối trong flow.
- Scanned-page detection → warning `scanned-page` + placeholder `> [Trang N: bản scan — chưa trích được chữ]`.

### Day 4 — Registry Integration & Limits
- Đăng ký PdfConverter; gate 50MB + page cap 300 (`file-too-large`); vùng bảng → flatten + `table-flattened`.
- Kết nối section split W21; strip số chương hard-code đầu heading.

### Day 5 — Fixtures, Tests & QA
- Fixtures 3 nguồn (Word-PDF, LaTeX-PDF, scan-PDF) + snapshot tests heuristic (pure function tests riêng).
- `[NEW]` `Design/Reports/Month6/W22/W22_QA_Report.md` + `build_output.txt`.

---

## 5. 📦 Dependencies installed this week

| Library | Why | Stack ref |
|---|---|---|
| `pdfjs-dist` | PDF parse client-side (Mozilla PDF.js), worker riêng bundle local | `6.Import.md` §5, `PipelineContract.md` §4 |

> Runtime dep, exact pin, approve trước. **FORBIDDEN:** load pdf.js worker/cmaps từ CDN.

---

## 6. 📤 Deliverables

- PDF → Markdown: heading (heuristic + warning), paragraph, list, ảnh trên fixtures Word/LaTeX.
- Trang scan được phát hiện + báo rõ, không mất im lặng.
- Heuristic layer là pure functions có unit test riêng (không cần PDF thật để test logic).
- `Design/Reports/Month6/W22/` QA report + build log.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| Heuristic sai heading → cấu trúc rác | High | `heading-guessed` + preview remap (W24); fixtures đa nguồn; cluster theo mode font. |
| PDF lớn treo UI | High | Page cap 300 + 50MB gate; W24 chuyển vào import worker; progress per page. |
| Worker pdf.js cấu hình sai (CDN lén) | Medium | Bundle local, kiểm build offline. |
| 2 cột đọc sai thứ tự | Medium | Best-effort sort theo toạ độ; ghi limitation trong QA + warning. |
| Bundle phình vì pdfjs | Medium | Dynamic import converter — chỉ tải khi user import PDF. |

---

## 8. ✅ Definition of Done

- [ ] Lint + typecheck + build xanh; Vitest xanh (kể cả unit heuristic).
- [ ] Fixtures Word-PDF/LaTeX-PDF: heading/paragraph/list/ảnh sang đúng cấu trúc.
- [ ] Scan-PDF: warning `scanned-page` + placeholder, không crash/không im lặng.
- [ ] Mọi heading heuristic có `heading-guessed`; không số chương hard-code.
- [ ] 50MB + 300 trang gate hoạt động; pdf.js worker load local (offline OK).
- [ ] pdfjs chỉ được dynamic-import trong module Import.
- [ ] QA report + build log tại `Design/Reports/Month6/W22/`.
- [ ] Commit kèm contract, branch `feature/W22-import-pdf`.
