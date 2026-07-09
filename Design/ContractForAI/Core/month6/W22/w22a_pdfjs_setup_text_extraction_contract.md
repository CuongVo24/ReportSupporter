# Contract For AI - W22 Group A: pdfjs Setup & Text Extraction

> **Lane / Week:** Core / Month 6 / W22 - Day 1 (`Design/TaskBrief/Core/month6/w22.md` `[C176]`-`[C177]`).
> **Branch:** `feature/W22-import-pdf`.
> **Builds on:** W21 (registry, `ImportResult`, warnings, strip-heading helper).
> **Depended on by:** Group B-E (heuristic/ảnh/scan/fixtures ăn output extract), W24 (worker + OCR).
> **Sources:** `w22.md` Locked #1/#2, `6.Import.md` §5 (PDF row), `PipelineContract.md` §4 (worker/offline).

---

## 1. Micro-task Target

Cài `pdfjs-dist` (runtime, exact pin) với **worker bundle local** (không CDN — offline posture), và dựng tầng **text extraction**: per page trả về text items kèm `fontSize`/`fontName`/transform (toạ độ), sort theo thứ tự đọc (top→bottom, trái→phải). Output là **data thuần** (serializable) — tầng heuristic Group B không chạm pdfjs API.

> **🔒 pdfjs local hoàn toàn (Locked #1).** Worker/cmaps/fonts bundle local; build offline vẫn chạy; dynamic import — không vào bundle chính.
> **🔒 Extract output = data thuần (Locked #2).** `ExtractedPage`/`TextItem` là plain objects — unit test heuristic không cần PDF thật, và W24 worker chuyển qua Structured Clone được.

## 2. Scope

### In scope (`[C176]`/`[C177]`)
- `package.json`/lockfile (MODIFY): `pdfjs-dist` exact pin; cấu hình `GlobalWorkerOptions.workerSrc` trỏ asset local (bundler-emitted).
- `src/modules/import/converters/pdf.ts` (**NEW**): khung converter, dynamic import pdfjs, mở document từ ArrayBuffer.
- `src/modules/import/pdf/extract-text.ts` (**NEW**): per page → `TextItem[]` (`text`, `fontSize`, `fontName`, `x`, `y`, `width`) sort thứ tự đọc; kiểu module-local (không phải canonical — data trung gian).
- Encrypted PDF → lỗi có thông báo rõ (không crash).

### Out of scope
- ❌ Heading/paragraph/list heuristic (Group B); ảnh/scan (Group C); registry wiring + limits (Group D); fixtures/QA (Group E).
- ❌ OCR/tesseract (W24); form fields/annotation/chữ ký số.

## 3. Checklist
- [ ] `pdfjs-dist` exact pin; `npm ci` xanh; worker load từ asset local.
- [ ] Build production + chạy **offline** (devtools offline) → import PDF vẫn hoạt động.
- [ ] pdfjs chỉ dynamic import trong `src/modules/import/`; bundle chính không chứa pdfjs.
- [ ] `TextItem[]` là plain objects (structured-clone-safe), sort đúng thứ tự đọc trên trang test.
- [ ] PDF encrypted → thông báo lỗi tiếng Việt, không crash.
- [ ] 4 gates xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `package.json` / lockfile | MODIFY | `pdfjs-dist` exact pin |
| `src/modules/import/converters/pdf.ts` | NEW | khung + dynamic import + worker config |
| `src/modules/import/pdf/extract-text.ts` | NEW | TextItem[] per page, plain data |
| `src/modules/import/pdf/extract-text.test.ts` | NEW | sort/shape trên PDF nhỏ inline |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Worker config sai → pdfjs fallback main thread/CDN | High | Offline build test bắt buộc (Locked #1). |
| TextItem giữ reference pdfjs (không clone được) | Medium | Map sang plain object ngay tại extract (Locked #2). |
| Bundle chính phình | Medium | Dynamic import; kiểm chunk khi build. |
| PDF encrypted/hỏng crash | Medium | try/catch → typed error + thông báo. |

## 6. Verification Plan
- 4 gates xanh; Vitest extract trên PDF nhỏ pass (shape + sort).
- Build production, tắt mạng → import PDF chạy; network tab không request pdfjs asset ngoài.
- `structuredClone(extractedPages)` không throw.

## 7. Status

`WAITING_FOR_APPROVAL`

> ⛔ VibeCode Step 2: chưa chạm `src/` cho tới khi Approve. ⚠️ Approve bao gồm cài `pdfjs-dist` **runtime** exact pin. Đề xuất commit: `feat(import): pdfjs-dist with local worker, offline-safe`; `feat(import): pdf text extraction with font/position metadata`; `docs(import): commit w22a contract`.
