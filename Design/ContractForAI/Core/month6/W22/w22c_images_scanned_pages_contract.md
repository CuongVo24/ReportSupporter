# Contract For AI - W22 Group C: Images & Scanned Pages

> **Lane / Week:** Core / Month 6 / W22 - Day 3 (`Design/TaskBrief/Core/month6/w22.md` `[C180]`-`[C181]`).
> **Branch:** `feature/W22-import-pdf`.
> **Builds on:** W22A (document/page handle), W21D (`extract-assets` đường ReportAsset).
> **Depended on by:** Group D (flow hoàn chỉnh), W24 (OCR chạy trên trang `scanned-page`).
> **Sources:** `w22.md` Locked #4, `6.Import.md` §3.2/§5.

---

## 1. Micro-task Target

Hai việc: (1) **trích ảnh nhúng** trong PDF → `ReportAsset` base64 (qua đường W21D), chèn theo vị trí tương đối trong content flow; (2) **phát hiện trang scan** — trang không có text layer (hoặc text < ngưỡng) → warning `scanned-page` (kèm `location: "page N"`) + placeholder trong Markdown: `> [Trang N: bản scan — chưa trích được chữ. Thử OCR (experimental) ở bản W24.]`. **Detect-only** — OCR là W24.

> **🔒 Scan = detect-only (Locked #4).** Không kéo tesseract về tuần này; nhưng cũng không im lặng bỏ trang.
> **⚠️ Ảnh render-giới-hạn.** Ảnh vector/quá lớn không decode được → `image-skipped`, import tiếp tục.

## 2. Scope

### In scope (`[C180]`/`[C181]`)
- `src/modules/import/pdf/extract-images.ts` (**NEW**): duyệt image objects per page (pdfjs ops), decode → canvas → base64 PNG/JPEG → `ReportAsset` qua helper W21D; vị trí y-toạ độ để chèn giữa các block text.
- Kích thước gate: ảnh > cap (theo `6.Import.md` §6) → `image-skipped`; ảnh trang trí quá nhỏ (icon <24px) bỏ qua không warning.
- `src/modules/import/pdf/detect-scanned.ts` (**NEW**): text items/trang < ngưỡng và có ảnh full-page → `scanned-page`; placeholder blockquote tiếng Việt.
- Mixed document (trang chữ + trang scan xen kẽ) xử lý đúng từng trang.

### Out of scope
- ❌ OCR (W24); vector graphics → SVG; caption tự sinh cho ảnh.
- ❌ Registry wiring/limits tổng (Group D).

## 3. Checklist
- [ ] Ảnh raster nhúng → `ReportAsset`, preview render; vị trí tương đối hợp lý (giữa các block theo y).
- [ ] Ảnh không decode được → `image-skipped` + import tiếp tục; icon nhỏ bỏ qua im lặng (chủ đích, ghi comment).
- [ ] Trang scan → `scanned-page` + placeholder đúng format; trang chữ bình thường không false positive.
- [ ] Mixed document: từng trang phân loại độc lập.
- [ ] Canvas decode không rò memory (release sau dùng).
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/pdf/extract-images.ts` | NEW | ops → canvas → ReportAsset |
| `src/modules/import/pdf/detect-scanned.ts` | NEW | ngưỡng text + full-page image |
| `src/modules/import/pdf/*.test.ts` | NEW | unit detect (data thuần) + integration ảnh |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Ảnh nhiều/lớn → OOM | High | Cap + `image-skipped`; canvas release; test PDF nhiều ảnh. |
| False positive scan (trang mục lục ít chữ) | Medium | Ngưỡng kép: ít text **và** có ảnh full-page. |
| Vị trí ảnh chèn lạc chỗ | Medium | Best-effort theo y; chấp nhận được vì preview W24 cho chỉnh. |
| jsdom không có canvas trong test | Medium | Tách logic quyết định (pure) khỏi decode; decode test ở integration/manual. |

## 6. Verification Plan
- Vitest: detect-scanned pure tests + extract-images trên fixture nhỏ.
- Manual: PDF có ảnh → asset xuất hiện + preview render; PDF scan → placeholder + warning hiển thị ở dropzone result.
- 4 gates xanh.

## 7. Status

`COMPLETED`

> Commit: `feat(import): extract embedded pdf images to ReportAsset`; `feat(import): scanned-page detection with placeholder + warning`; `docs(import): commit w22c contract`.
