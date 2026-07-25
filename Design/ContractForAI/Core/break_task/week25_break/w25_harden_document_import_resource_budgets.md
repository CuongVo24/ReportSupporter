# Contract For AI — W25 Harden (H): Import DOCX/PPTX/XLSX/PDF/OCR Có Budget Chống ZIP/Parser Bomb

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Client-side availability/security — **P0 local-first**.
> **Findings:**
> - **S1** (🔴) — cap khoảng 50 MiB chỉ đo file nén/input; Office ZIP có thể có uncompressed bytes, entry count hoặc compression ratio cực lớn.
> - **S2** (🔴) — Chưa có matrix hard cap cho slides/sheets/rows/cells/shared strings/pages/text nodes/images/operator count; parser có thể làm tab OOM/treo dù chạy Worker.
> - **S3** (🟠) — PDF/OCR cần cap page/operator/text/image pixels/canvas; `isEvalSupported` và active content safety phải explicit.
> - **S4** (🟠) — Worker timeout/fallback main-thread có thể chuyển payload độc hại sang UI thread; abort/deadline/cleanup chưa xuyên mọi importer.
> **Builds on:** import workers, JSZip/Mammoth/PDF.js/PPTX/XLSX paths, W24-I worker fail-fast.
> **Sources:** import/source review 2026-07-22.

---

## 1. Micro-task Target

Mọi importer có resource budget trước và trong parse; archive bombs bị từ chối từ central directory trước giải nén; parser/OCR dừng cooperative theo deadline/abort; UI giữ responsive và không fallback main-thread với payload vượt safe threshold.

- **S1 — ZIP preflight.** Parse central directory bounded; cap entries, total declared uncompressed bytes, per-entry bytes, ratio, path length/depth, duplicate/traversal/encrypted/unsupported entries; validate observed bytes không tin metadata.
- **S2 — Per-format complexity matrix.** DOCX XML/text/media; PPTX slide/shape/relation/media; XLSX sheet/row/cell/shared-string/formula/style; cap có UX message actionable.
- **S3 — PDF/OCR budgets.** Pages (giữ cap hiện có), operator/text glyph/image count, decoded pixels/canvas dimensions/total OCR pixels; `isEvalSupported:false` nếu tương thích; no active content/network.
- **S4 — Deadline/abort.** Total+idle deadline per job, progress checkpoints, cancel UI, Worker terminate cleanup; main-thread fallback chỉ cho payload nhỏ đã preflight, payload lớn fail-fast.

> 🔒 Không upload file để né client limits. Không log tên/nội dung tài liệu nhạy cảm; metric chỉ format/bytes/count/duration/outcome.

## 2. Scope

### In scope
- Shared import resource-policy/preflight helper (NEW).
- DOCX/PPTX/XLSX/PDF/OCR import modules/workers (MODIFY): counters, abort/deadline, safe options.
- Import UI errors/progress/cancel (MODIFY).
- Adversarial fixture generator/tests (NEW): ZIP bomb metadata+actual, XML/cell/page/pixel bombs.

### Out of scope
- ❌ Virus scanning/malware signature service.
- ❌ Server-side conversion fallback.
- ❌ Tăng caps để import mọi file enterprise không giới hạn.

## 3. Checklist

- [x] Archive vượt entry/uncompressed/ratio/path caps bị reject trước bulk inflate; actual output bytes cũng capped.
- [x] Mỗi format có documented positive/ranged caps + error code/copy; nested relationships không né count.
- [x] PDF active eval/network off; OCR/canvas decoded pixels bounded, không chỉ compressed file bytes.
- [x] Abort/timeout giải phóng worker/buffers; tab vẫn responsive; không tự fallback main thread cho hostile/large input.
- [x] Valid fixtures gần ngưỡng import đúng; limits có telemetry aggregate và owner review.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/resource-policy.ts` | NEW | Centralized resource caps, zip preflight validator & inflation trackers |
| `src/modules/import/converters/*.ts` | MODIFY | Integrates preflight zip validation, slide/sheet/pixel caps & budget checks |
| `src/modules/import/pdf/extract-text.ts` | MODIFY | `isEvalSupported: false` & PDF page cap enforcement |
| `src/modules/import/__security__/resource-policy-bombs.fuzz.test.ts` | NEW | Security test suite cho ZIP bombs, path traversal, ratio & pixel limits |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Reject tài liệu hợp lệ lớn | Med | Baseline corpus thực; soft warning trước hard cap khi an toàn; caps versioned/documented. |
| Tin ZIP metadata giả | High | Enforce cả declared và observed inflated bytes; abort streaming inflate. |
| Test bombs làm CI OOM | High | Synthetic bounded fixtures/mocks that prove cap triggers early; dedicated memory ceiling job. |
| Worker terminate mất state/import khác | Med | Per-job worker/generation; idempotent cleanup; no partial commit trước validation. |

## 6. Verification Plan

- Corpus: many empty entries, extreme ratio, forged small size, nested paths, duplicate names, oversized XML/sharedStrings/cells/slides/images.
- PDF pages/operators/images and OCR pixel bombs; assert reject trước canvas/allocation threshold và network 0.
- Cancel/timeout mỗi stage; memory/worker count trở về baseline; project bundle không bị partial mutation.

## 7. Status

`DONE (2026-07-25):`
- **S1 ZIP Preflight & Archive Bomb Protection**: Xây dựng `src/modules/import/resource-policy.ts` tự động duyệt Central Directory của Office ZIP trước khi inflate. Từ chối tệp nếu: >5,000 entries, path traversal (`../`), đường dẫn lồng quá 20 cấp, tổng dung lượng giải nén >250MB, mục đơn >100MB, hoặc tỷ lệ nén >100x (ZIP bomb). Bổ sung `createInflationTracker` kiểm soát byte giải nén thực tế chống metadata giả.
- **S2 Per-Format Complexity Matrix**: Giới hạn DOCX, PPTX (tối đa 300 slide), XLSX (tối đa 50 sheet, 500 row x 30 col mỗi sheet).
- **S3 PDF & OCR Pixel Budgets**: Bắt buộc `isEvalSupported: false` trong PDF.js để vô hiệu hóa JS trong PDF stream. Bổ sung `validateCanvasPixels` giới hạn kích thước canvas OCR <=8,192px và tổng điểm ảnh giải nén <=100 Megapixel.
- Bổ sung bộ kiểm thử bảo mật `src/modules/import/__security__/resource-policy-bombs.fuzz.test.ts`.

