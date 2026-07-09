# 🚀 MONTH 6 SUMMARY: UNIVERSAL IMPORT (W21-W24)

> Phase 5 of `Design/RoadMap/MasterRoadMap.md`. Covers Week 21 → Week 24. Module spec: `Design/Modules/6.Import.md`.

---

## 🎯 Phase Goal

**Đưa mọi tài liệu có sẵn vào workspace — rồi để phần còn lại của app làm việc của nó.**

Các phase trước xây chuỗi viết → format → check → export → present. Phase 5 mở **cửa vào**: import **DOCX / PDF / XLSX / PPTX → Markdown**, hoàn toàn client-side (không backend, không upload — giữ privacy posture). Định vị: **import-to-edit**, không phải trang converter dùng-một-lần — file convert xong sống tiếp trong Write/Check/Export. Kết hợp Export sẵn có → app **round-trip**. Nguyên tắc xuyên suốt: Markdown là giao diện duy nhất (`PipelineContract.md` §4), warnings trung thực (không mất nội dung im lặng), heading heuristic phải được user xác nhận, OCR chỉ experimental.

---

## 📅 The 4 Weeks

### 🧱 Week 21: Import Foundation & DOCX
*Trọng tâm: xương sống registry + format thắng chắc.*
- Import Model (`CanonicalTypes.md` §11) + converter registry + universal dropzone (.md refactor vào registry).
- Reverse pipeline HTML→MD (chỉ trong Import); DOCX qua mammoth — heading/list/bảng/ảnh.

### 📄 Week 22: PDF Import
*Trọng tâm: format khó nhất — heuristic trung thực.*
- pdfjs-dist (worker local) → text + font/position; cluster font-size → heading (`heading-guessed`).
- Ảnh → asset; trang scan → `scanned-page` (không im lặng); 50MB + 300 trang gate.

### 📊 Week 23: XLSX & PPTX
*Trọng tâm: chứng minh registry là extension point.*
- XLSX (SheetJS, dist chính thức): sheet → bảng GFM; merged/truncate có warning.
- PPTX trên jszip sẵn có: title → heading, bullets, notes, media → asset. Không sửa core W21.

### ✅ Week 24: Preview Diff, OCR & Close
*Trọng tâm: user kiểm soát — rồi chứng minh round-trip.*
- Preview diff (remap heading, append/replace) + Check-on-import (module "import").
- OCR experimental (tesseract.js, OFF mặc định, explicit action); import worker + perf/a11y.
- E2E round-trip 4 format → edit → check → export. **Đóng Phase 5.**

---

## 🏁 Key Milestones

- **M6.1 (W21):** Registry + dropzone + DOCX→MD chuẩn cấu trúc; `ImportDraft` thống nhất.
- **M6.2 (W22):** PDF→MD heuristic + scan detection; giới hạn an toàn hoạt động.
- **M6.3 (W23):** Đủ 4 format; thêm converter không sửa core.
- **M6.4 (W24):** Preview diff + check-on-import + OCR experimental + worker; E2E round-trip pass — Phase 5 acceptance.

---

## 📦 Cumulative Deliverables (cuối Tháng 6 — toàn dự án)

- Toàn bộ Phase 1-4 + hardening W16-20 còn xanh.
- Module 6 — Import: 4 converter (docx/pdf/xlsx/pptx) + markdown, registry, universal dropzone, warnings chuẩn hoá.
- Preview diff + check-on-import; OCR experimental behind flag; import worker + progress.
- Round-trip: import → edit → check → export (HTML/PDF/DOCX) chứng minh bằng E2E.
- Evidence: `Design/Reports/Month6/W21..W24/` (QA reports, fixtures, Phase 5 acceptance).

---

## ⚠️ Phase-level Risks

| Risk | Level | Mitigation |
|---|---|---|
| Sản phẩm trượt thành "trang converter" | High | Import-to-edit: cửa vào duy nhất là workspace; không trang convert riêng; PRD amended có chủ đích. |
| PDF heuristic sai → user mất niềm tin | High | `heading-guessed` + preview remap bắt buộc trước commit; fixtures đa nguồn; QA đối chiếu. |
| Bundle phình (pdfjs/tesseract/xlsx) | High | Dynamic import per converter; tesseract on-click; bundle size gate mỗi tuần. |
| XSS qua HTML trung gian | High | Sanitize bắt buộc trước rehype-remark (PipelineContract §4); test độc hại trong fixtures. |
| Mất nội dung im lặng | Medium | Warning policy bắt buộc (`6.Import.md` §3.2); QA checklist đối chiếu nguồn↔kết quả. |
| Reverse pipeline rò khỏi Import | Medium | Grep/lint gate: rehype-remark/remark-stringify chỉ trong `src/modules/import/`. |

---

## ✅ Phase Exit Criteria

- [ ] Cả 4 tuần đạt Definition of Done riêng.
- [ ] Lint + typecheck + build xanh; Vitest xanh toàn bộ (kể cả unit heuristic + worker integration).
- [ ] 4 format import đúng cấu trúc trên fixtures; warnings trung thực; format lạ reject có thông báo.
- [ ] Preview diff + check-on-import hoạt động; commit chỉ qua đường Write hiện có.
- [ ] OCR: experimental, OFF mặc định, explicit action, có progress/cancel.
- [ ] Client-side 100%: không network call khi import (offline OK); pdf.js worker/cmaps local.
- [ ] Converter deps chỉ sống trong module Import (dynamic import); bundle chính không phình quá gate.
- [ ] E2E round-trip pass; Phase 5 acceptance report tại `Design/Reports/Month6/W24/`.
- [ ] `ProductPRD.md` §6 amended không bị vi phạm ngược (không hứa "mọi định dạng").
