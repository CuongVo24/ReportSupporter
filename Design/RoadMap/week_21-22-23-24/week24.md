# 📅 WEEK 24: PREVIEW DIFF, OCR EXPERIMENTAL & PHASE 5 CLOSE

> Phase 5 — Universal Import (W21-W24). Reference: `Design/RoadMap/MasterRoadMap.md` §Phase 5, `Design/Modules/6.Import.md`.

---

## 1. 🎯 Week Goal / Theme

**Theme:** *Người dùng kiểm soát kết quả import — rồi khoá Phase 5 bằng round-trip thật.*

Tuần đóng Phase 5 với 4 mảng: (1) **Import preview diff** — dialog duyệt Markdown kết quả, remap heading level, chọn append/replace trước khi commit (điểm hạ cánh của mọi `heading-guessed` W22); (2) **Check-on-import** — Check engine chạy trên `ImportDraft`, issues `module: "import"` hiện ngay trong preview; (3) **OCR experimental** — `tesseract.js` lazy-load, flag default OFF, chỉ chạy sau explicit action trên trang `scanned-page` (vie+eng); (4) **hardening + close** — chuyển converter nặng vào import worker, progress per file, rồi **E2E round-trip**: import cả 4 format → edit → check → export 3 format.

Mục tiêu chốt từ MasterRoadMap:
- Preview diff: duyệt + remap heading + append/replace trước commit.
- Check engine trên `ImportDraft` (module "import").
- OCR experimental: lazy, OFF mặc định, explicit action.
- Import worker + progress + perf; E2E round-trip; **đóng Phase 5**.

---

## 2. 🧩 Context — Modules & Dependencies

- **Builds:** `ImportPreviewDialog`, check-on-import, `converters/ocr.ts` (experimental), import worker.
- **Depends on:** W21-W23 (registry + 4 converter + warnings), Check engine (W3), primitive UI Phase 4 (Dialog/Toast/Tabs).
- **Depended on by:** — (đóng Phase 5).
- **Đo theo:** E2E round-trip pass + `6.Import.md` §6 performance budget.

---

## 3. 🔭 Scope

### ✅ In scope
- `ImportPreviewDialog`: render kết quả qua pipeline chuẩn, panel warnings, remap heading (±level), chọn section giữ/bỏ, mode append/replace.
- Check-on-import: chạy CheckContext trên draft; issues hiện trong preview; **không chặn** commit (user quyết).
- OCR: `tesseract.js` dynamic import, flag `ocrEnabled` default OFF; nút "Thử OCR (experimental)" trên trang scan; kết quả gắn `heading-guessed`; progress + cancel.
- Import worker (theo `PipelineContract.md` §4): DOCX/XLSX/PPTX convert + PDF heuristic off-main-thread; progress per file; main thread không block >200ms.
- A11y states dropzone/preview (đủ empty/loading/error, focus, aria) theo chuẩn Phase 4.
- E2E round-trip scenario + Phase 5 close report.

### ⛔ Out of scope
- OCR production-quality / OCR mặc định bật; ngôn ngữ ngoài vie+eng.
- Server-side conversion path; diff character-level với file gốc (chỉ preview kết quả + warnings).
- Feature mới ngoài Import (feature freeze phần close).

---

## 4. 🛠️ Task Breakdown (Day 1 → Day 5)

> Branch: `feature/W24-import-hardening`.

### Day 1 — Import Preview Dialog
- `[NEW]` `src/modules/import/ImportPreviewDialog.tsx` (primitive Dialog/Tabs Phase 4): preview render + warnings panel + append/replace.

### Day 2 — Heading Remap & Check-on-import
- Remap heading level per section (±) + bỏ/giữ section trước commit.
- Check engine trên `ImportDraft` → issues `module: "import"` trong preview (không chặn commit).

### Day 3 — OCR Experimental
- Cài `tesseract.js` (approve trước); dynamic import; flag OFF; explicit action trên trang `scanned-page`.
- OCR vie+eng → paragraphs + `heading-guessed`; progress + cancel; fail → thông báo, không crash.

### Day 4 — Import Worker & Perf/A11y Hardening
- `[NEW]` `src/modules/import/import.worker.ts` — converter chạy worker, Structured Clone, progress events.
- Perf budget: main thread <200ms block; memory (revoke URLs, asset cap); a11y states dropzone/preview.

### Day 5 — E2E Round-trip & Phase 5 Close
- E2E: import docx + pdf + xlsx + pptx → edit → check → export HTML/PDF/DOCX; ghi scenario.
- `[NEW]` `Design/Reports/Month6/W24/W24_Phase5_Acceptance_Report.md` + `build_output.txt`; cập nhật `6.Import.md` status. **Đóng Phase 5.**

---

## 5. 📦 Dependencies installed this week

| Library | Why | Stack ref |
|---|---|---|
| `tesseract.js` | OCR WASM client-side — **experimental**, lazy dynamic import, flag OFF mặc định | `6.Import.md` §5/§6 |

> Approve trước khi cài. **FORBIDDEN:** tesseract vào bundle chính / OCR tự chạy không explicit action.

---

## 6. 📤 Deliverables

- Preview diff + remap heading + append/replace; user thấy warnings + issues trước khi commit.
- Check-on-import hoạt động (module "import").
- OCR experimental sau explicit action, có progress/cancel.
- Import worker + progress; perf budget đạt; a11y states đủ.
- E2E round-trip pass + Phase 5 acceptance report tại `Design/Reports/Month6/W24/`.

---

## 7. ⚠️ Risks

| Risk | Level | Mitigation |
|---|---|---|
| OCR thành kỳ vọng production | High | Label "experimental", flag OFF, không cam kết chất lượng; docs + QA ghi rõ. |
| Tesseract WASM phình bundle | High | Dynamic import on-click; kiểm bundle gate; không preload. |
| Worker hoá vỡ converter đã xanh | Medium | Converter là pure function từ W21-23; worker chỉ là host; giữ nguyên test cũ + thêm worker integration test. |
| Preview thêm bước làm phiền import nhỏ | Medium | Draft sạch (0 warning, 0 issue) → commit nhanh 1 click. |
| E2E lộ lỗi tích hợp muộn | High | Chạy E2E ngay Day 5 sáng; localized fix; ưu tiên đường chính. |

---

## 8. ✅ Definition of Done

- [ ] Lint + typecheck + build xanh; Vitest xanh toàn bộ.
- [ ] Preview: remap heading, bỏ/giữ section, append/replace, warnings + issues hiển thị; commit qua đường Write hiện có.
- [ ] OCR: OFF mặc định, chỉ chạy sau explicit action, progress + cancel, fail an toàn.
- [ ] Converter chạy trong worker; main thread không block >200ms với file 50MB.
- [ ] A11y states dropzone/preview đạt chuẩn Phase 4 (axe 0 critical trên surface mới).
- [ ] E2E round-trip 4 format pass; export 3 format validate.
- [ ] Phase 5 acceptance report + build log tại `Design/Reports/Month6/W24/`; `6.Import.md` cập nhật status.
- [ ] Commit kèm contract, branch `feature/W24-import-hardening`.
