# Contract For AI - W24 Group C: OCR Experimental (tesseract.js)

> **Lane / Week:** Core / Month 6 / W24 - Day 3 (`Design/TaskBrief/Core/month6/w24.md` `[C200]`-`[C201]`).
> **Branch:** `feature/W24-import-hardening`.
> **Builds on:** W22C (`scanned-page` detection + placeholder), W24A (preview dialog — nút OCR sống tại đây).
> **Depended on by:** Group E (E2E nhánh scan), Phase 5 acceptance (offline + bundle gate).
> **Sources:** `w24.md` Locked #1/#6, `6.Import.md` §5 (OCR row), tiền lệ AI flag W11 (`CanonicalTypes.md` §10 — default OFF, explicit action).

---

## 1. Micro-task Target

Thêm **OCR experimental** cho trang scan: `tesseract.js` **lazy dynamic import on-click**, flag `ocrEnabled` **default OFF**; nút "Thử OCR (experimental)" chỉ hiện trên section có `scanned-page`; chạy vie+eng với **progress + cancel**; kết quả → paragraphs (heading nếu đoán → `heading-guessed`); fail → thông báo + giữ placeholder, **không crash**. Label "experimental" rõ trong UI — không cam kết chất lượng.

> **🔒 OCR = experimental, OFF, explicit (Locked #1).** Cùng triết lý AI W11: mặc định tắt, chỉ chạy sau explicit action, off-state app đầy đủ tính năng.
> **🔒 Offline gate (Locked #6).** Worker + core WASM + traineddata (vie+eng) đóng gói/tự host local — không tải CDN runtime.
> **⚠️ Không vào bundle chính** — toàn bộ tesseract chỉ tải khi user bấm nút.

## 2. Scope

### In scope (`[C200]`/`[C201]`)
- `package.json`/lockfile (MODIFY): `tesseract.js` exact pin; assets (worker/wasm/traineddata vie+eng) tự host trong `public/` hoặc bundler asset — ghi rõ dung lượng trong QA.
- `src/modules/import/converters/ocr.ts` (**NEW**): nhận page image (render lại trang PDF scan qua pdfjs → canvas) → tesseract recognize vie+eng → paragraphs; heading đoán (dòng ngắn đầu khối, chữ hoa) → `heading-guessed`.
- Flag `ocrEnabled` default `false` (settings local — cùng chỗ AI flag); OFF → nút không hiện.
- Preview (MODIFY): nút "Thử OCR (experimental)" trên section `scanned-page`; progress bar per trang + cancel (terminate worker); kết quả thay placeholder trong draft (chưa commit).
- Fail/timeout → toast lỗi + placeholder giữ nguyên.

### Out of scope
- ❌ OCR mặc định/tự động; ngôn ngữ ngoài vie+eng; OCR ảnh trong docx/pptx.
- ❌ Cải thiện chất lượng OCR (đây là experimental — chất lượng ghi nhận, không cam kết).

## 3. Checklist
- [x] Flag OFF mặc định: không nút, không tải tesseract byte nào (network tab sạch).
- [x] Bật flag + bấm nút → tesseract tải local (không CDN), progress hiển thị, cancel dừng thật (worker terminate).
- [x] Kết quả vie+eng vào draft thay placeholder; heading đoán có `heading-guessed`; commit mới ghi vào project.
- [x] Fail (ảnh hỏng/timeout) → toast + placeholder giữ, không crash.
- [x] Label "experimental" hiển thị rõ tại nút và kết quả.
- [x] Bundle chính không đổi size (tesseract async chunk + public assets).
- [x] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `package.json` / lockfile | MODIFY | tesseract.js exact pin |
| `public/ocr/*` (hoặc asset pipe) | NEW | worker/wasm/traineddata vie+eng local |
| `src/modules/import/converters/ocr.ts` | NEW | page canvas → text |
| `src/modules/import/ImportPreviewDialog.tsx` | MODIFY | nút OCR + progress/cancel |
| `src/modules/import/ocr-settings.ts` | NEW | flag default OFF |
| `src/modules/import/converters/ocr.test.ts` | NEW | flag/fail-path (mock recognize) |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Thành kỳ vọng production | High | Label + docs + QA ghi limitation (Locked #1). |
| Traineddata vie nặng (~10-15MB) | High | Tự host, tải on-click duy nhất, cache; ghi dung lượng QA; không preload. |
| Cancel không dừng worker thật | Medium | `worker.terminate()`; test cancel giữa chừng. |
| OCR chạy trên máy yếu treo | Medium | Progress + cancel; timeout mềm có thông báo. |
| Kéo CDN runtime lén (default tesseract path) | Medium | Config `workerPath/corePath/langPath` local; offline test bắt buộc. |

## 6. Verification Plan
- Vitest flag/fail-path xanh (mock); 4 gates xanh.
- Manual offline: bật flag, OCR fixture `scan-vn.pdf` (W22E) → text tiếng Việt hợp lý, progress + cancel hoạt động; network tab 0 request ngoài.
- Flag OFF: bundle + network không dấu vết tesseract.

## 7. Status

`COMPLETED`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. ⚠️ Approve bao gồm cài `tesseract.js` **runtime** exact pin + tự host assets vie+eng. Đề xuất commit: `feat(import): experimental OCR via tesseract.js (flag OFF, on-click, local assets)`; `docs(import): commit w24c contract`.

