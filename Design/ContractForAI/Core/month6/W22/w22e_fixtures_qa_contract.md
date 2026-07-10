# Contract For AI - W22 Group E: PDF Fixtures, Tests & QA

> **Lane / Week:** Core / Month 6 / W22 - Day 5 (`Design/TaskBrief/Core/month6/w22.md` `[C184]`-`[C185]`).
> **Branch:** `feature/W22-import-pdf`.
> **Builds on:** Group A-D (trọn flow PDF), W21E (fixture infra + boundary test).
> **Depended on by:** W24 (E2E + OCR trên fixture scan), Phase 5 acceptance.
> **Sources:** `w22.md` Locked #3, `Conventions/TestStrategy.md`, `6.Import.md` §3.2.

---

## 1. Micro-task Target

Khoá W22 bằng **fixtures 3 nguồn** (PDF-từ-Word, PDF-từ-LaTeX, PDF-scan) + snapshot tests trọn flow, mở rộng boundary test cho `pdfjs-dist`, và `W22_QA_Report.md` — đặc biệt phải **đo và báo cáo trung thực chất lượng heuristic**: heading đúng/sai/thiếu per fixture, tỉ lệ `heading-guessed`, limitation 2 cột/bảng.

> **🔒 Heading heuristic đo được (Locked #3).** QA có bảng đối chiếu heading nguồn ↔ heading kết quả từng fixture — không nói chung chung "khá tốt".
> **⚠️ Fixture scan là đầu vào W24 OCR** — chọn bản scan tiếng Việt rõ chữ.

## 2. Scope

### In scope (`[C184]`/`[C185]`)
- Fixtures (**NEW** `__fixtures__/`): `report-word.pdf` (export từ báo cáo Word VN — heading 3 cấp/list/bảng/ảnh), `paper-latex.pdf` (2 cột hoặc 1 cột LaTeX), `scan-vn.pdf` (≥2 trang scan tiếng Việt).
- Snapshot tests trọn flow per fixture: sections + headings + warnings count/codes.
- Boundary test (MODIFY): thêm `pdfjs-dist` vào danh sách chỉ-trong-Import.
- `Design/Reports/Month6/W22/W22_QA_Report.md` (**NEW**): bảng heading nguồn↔kết quả (đúng/sai cấp/thiếu/thừa) per fixture; tỉ lệ `heading-guessed`; limitation 2 cột + bảng flatten kèm ví dụ; offline check kết quả; DoD map `week22.md` §8; + `build_output.txt`.

### Out of scope
- ❌ Cải thiện heuristic theo kết quả đo (lỗi lớn → break task tuần sau, không vá nóng Day 5).
- ❌ OCR fixture scan (W24).

## 3. Checklist
- [ ] 3 fixtures đúng 3 nguồn, ẩn danh hoá, mô tả nguồn gốc trong QA.
- [ ] Snapshot flow xanh; số warning/codes đúng chủ đích từng fixture (scan → `scanned-page` ≥2).
- [ ] Boundary test bắt pdfjs import ngoài module.
- [ ] Bảng đối chiếu heading per fixture có số liệu thật (đếm tay khi lập QA).
- [ ] Limitation 2 cột/bảng có ví dụ cụ thể trích từ fixture.
- [ ] 4 gates xanh + `build_output.txt`.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/__fixtures__/*.pdf` | NEW | 3 nguồn |
| `src/modules/import/pdf-flow.test.ts` | NEW | snapshot per fixture |
| `src/modules/import/module-boundary.test.ts` | MODIFY | + pdfjs-dist |
| `Design/Reports/Month6/W22/W22_QA_Report.md` | NEW | đối chiếu heading + limitations |
| `Design/Reports/Month6/W22/build_output.txt` | NEW | 4 gates log |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Snapshot PDF giòn (pdfjs version) | Medium | Pin exact; snapshot cấu trúc (headings/warnings) là chính, full text phụ. |
| Đo heading chủ quan | Medium | Quy ước đếm ghi trong QA (đúng = đúng text + đúng cấp). |
| Fixture scan chất lượng kém → W24 OCR khổ | Medium | Chọn scan rõ chữ ≥300dpi. |
| Kết quả đo xấu gây vá nóng | Medium | Out-of-scope khoá; lỗi lớn → break task. |

## 6. Verification Plan
- Toàn bộ Vitest W22 xanh (unit heuristic + flow + boundary); 4 gates xanh.
- QA review: mở từng fixture bằng viewer đối chiếu bảng heading.
- Offline import cả 3 fixtures thành công.

## 7. Status

`COMPLETED`

> Commit: `test(import): pdf fixtures (word/latex/scan) + flow snapshots`; `docs(reports): W22 QA report with heading accuracy table`; `docs(import): commit w22e contract`.
