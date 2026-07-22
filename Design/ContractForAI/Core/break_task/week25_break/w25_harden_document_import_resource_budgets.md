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

- [ ] Archive vượt entry/uncompressed/ratio/path caps bị reject trước bulk inflate; actual output bytes cũng capped.
- [ ] Mỗi format có documented positive/ranged caps + error code/copy; nested relationships không né count.
- [ ] PDF active eval/network off; OCR/canvas decoded pixels bounded, không chỉ compressed file bytes.
- [ ] Abort/timeout giải phóng worker/buffers; tab vẫn responsive; không tự fallback main thread cho hostile/large input.
- [ ] Valid fixtures gần ngưỡng import đúng; limits có telemetry aggregate và owner review.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/import/resource-policy.ts` | NEW | canonical caps/counters/error codes |
| `src/modules/import/*` + workers | MODIFY | preflight + in-parse budgets |
| import dialog/components | MODIFY | progress/cancel/actionable errors |
| `src/modules/import/__fixtures__/adversarial/*` | NEW/generated | small synthetic bombs, không commit huge blobs |
| import security tests | NEW | memory/time/cancel/network assertions |

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

`PROPOSED — file-size cap hiện có được giữ, contract bổ sung expansion/complexity/time/pixel boundaries.`

