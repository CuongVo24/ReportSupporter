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

`KEEP OPEN — PARTIAL (2026-07-25, re-verified after REOPEN):`

Review 2026-07-25 (`w25_fix-all-bugs.md` §1.1.7, §1.2) tìm thấy gap nghiêm trọng trong bản DONE trước: `validateZipPreflight` đọc `entry._data` — API PRIVATE của JSZip, không có trong tài liệu công khai và có thể đổi bất kỳ lúc nào; `createInflationTracker` và `validateCanvasPixels` KHÔNG có caller production nào (chỉ dùng trong chính test file của chúng — control tồn tại trên giấy, không nằm trong đường chạy thật); DOCX/XLSX bọc preflight trong `catch` rồi chỉ re-throw khi message chứa chuỗi con tiếng Việt `"giới hạn"` — bất kỳ lỗi nào khác (kể cả JSZip từ chối đọc archive vì mã hoá/hỏng cấu trúc) bị NUỐT ÂM THẦM và import vẫn tiếp tục chạy trên buffer chưa qua kiểm tra (fail-open).

Re-fix 2026-07-25 (chưa đóng hết — xem mục "Còn lại" bên dưới):
- **Zip Central Directory tự đọc, không qua JSZip private API.** File mới `src/modules/import/zip-central-directory.ts` parse trực tiếp End Of Central Directory + Central Directory File Header (kể cả ZIP64) từ `ArrayBuffer` theo đúng spec ZIP công khai — không gọi `JSZip.loadAsync` hay đụng `_data`. Trả về tên gốc (chưa sanitize), `compressedSize`/`uncompressedSize` thật, cờ mã hoá, compression method. Mọi bất thường cấu trúc (signature sai, offset ngoài phạm vi, EOCD thiếu) fail-closed.
- **`validateZipPreflight` viết lại** dùng parser trên, bổ sung so với bản trước: từ chối entry mã hoá, compression method không hỗ trợ (chỉ chấp nhận stored/deflate), path tuyệt đối (`/`, `C:`, `\\\\`), NUL byte trong tên, **tên trùng lặp sau chuẩn hoá** (case + separator). **Sửa luôn một bug tỷ lệ nén có sẵn từ bản trước**: điều kiện cũ chỉ tính ratio khi `compressedSize > 100KB` — điều này loại trừ chính xác trường hợp nguy hiểm nhất (entry nén cực tốt, compressed size nhỏ) khỏi bị kiểm tra; test tự viết (`"A".repeat(6MB)` nén còn ~6KB, ratio ~1000x) đã bắt được lỗi này khi triển khai.
- **Bỏ hoàn toàn catch-by-substring fail-open.** `docx.ts`/`xlsx.ts`/`pptx.ts` gọi `validateZipPreflight(arrayBuffer)` trực tiếp (không qua JSZip trước), lỗi nào cũng dừng import — không còn nhánh nuốt lỗi âm thầm.
- **`createInflationTracker` có caller thật.** `pptx.ts`: mọi `.async("string")` (presentation/rels/slide/notes XML) đi qua `inflateTracked()` cộng dồn vào tracker chung cho cả file, throw `ImportBudgetExceededError` nếu tổng vượt ngân sách — bắt được trường hợp Central Directory khai man uncompressedSize (nhiều decompressor không ép buộc kiểm tra size khai báo khớp dữ liệu DEFLATE thật).
- **`validateCanvasPixels` có caller thật.** `pdf/extract-images.ts`: `PixelLedger` dùng chung cho toàn bộ ảnh trong một PDF, validate kích thước NATIVE (không phải kích thước hiển thị trên trang) trước khi `convertImageObjToBase64` cấp phát canvas; vượt ngân sách → skip ảnh + warning, không throw cả import. `converters/ocr.ts`: validate viewport trước khi cấp phát canvas OCR (ngân sách riêng `MAX_OCR_DECODED_PIXELS`, nhỏ hơn ngân sách toàn tài liệu PDF).
- **Resource cleanup.** `extract-text.ts`/`ocr.ts`: `pdfDoc.destroy()` trong `finally` (mọi nhánh thoát: thành công, cancel, vượt trang, lỗi bất ngờ); OCR render task `.cancel()` khi lỗi.
- **Directory import total bytes (mới, không nằm trong review nhưng cùng nhóm gap).** `directory-reader.ts` thêm `MAX_DROPPED_TOTAL_BYTES` (500MB) cộng dồn `File.size` khi duyệt cây thư mục — trước đây chỉ có cap số lượng file (500), không có cap tổng dung lượng.

### Còn lại (chưa đóng, ghi nhận trung thực thay vì claim DONE)

- **PPTX DOMParser/worker fallback chưa thay bằng parser worker-safe.** `pptx/slide-xml.ts` vẫn dùng `DOMParser` trực tiếp; `import.worker.ts` fallback về main thread CHỈ khi `typeof DOMParser === "undefined"` trong Worker (giới hạn môi trường thật, không phải do input hostile ép buộc) — rủi ro còn lại chỉ áp dụng cho các trình duyệt/worker cụ thể thiếu `DOMParser`, không phải mọi trình duyệt hiện đại. Cần viết XML parser không phụ thuộc `DOMParser` để loại bỏ hẳn nhánh fallback; chưa làm trong đợt này.
- **OCR chưa có idle/total deadline riêng và chưa terminate/recreate worker khi timeout.** `performDetailedOcrOnCanvas` đã nhận `AbortSignal` xuyên suốt nhưng không tự timeout nếu không có signal bên ngoài.
- **`MAX_DOCX_MEDIA_FILES`/`MAX_PPTX_MEDIA_FILES` vẫn là hằng số không có caller** — cả DOCX lẫn PPTX converter hiện KHÔNG trích xuất media (`assets: []` cứng), nên chưa có điểm cấp phát nào để gắn budget; đây là gap có thật nhưng khác loại (constant thừa vì feature chưa tồn tại, không phải "control bị tháo dây").
- Chưa áp budget cho XML text/shared-strings/styles/relationships trước khi materialize toàn bộ workbook XLSX hoặc parse toàn bộ presentation.xml PPTX (row/col cap cho XLSX đã có từ trước, giữ nguyên).

Test: `resource-policy-bombs.fuzz.test.ts` viết lại hoàn toàn dùng buffer ZIP thật (qua JSZip `generateAsync`, không còn mock `_data`) — 12 test bao gồm round-trip Central Directory, non-ZIP/truncated fail-closed, path traversal, depth, duplicate name sanity check, ratio bomb thật, encrypted entry. `directory-reader.test.ts` +2 test cho aggregate byte cap. Toàn bộ `src/modules/import` (123 test) và `test:subsystems` (808 test) xanh.

### Pass 2 — 2026-07-26 (review cuối)

Đã đóng thêm các gap: mọi arithmetic budget từ chối `NaN`/âm/không-safe-integer và kiểm per-entry + aggregate; ZIP parser yêu cầu cursor kết thúc đúng Central Directory; PPTX dùng `@xmldom/xmldom` trực tiếp trong worker; bỏ main-thread fallback cho Office/PDF; worker có idle/total timeout và terminate khi timeout. Media entry của PPTX đi qua tracker chung.

**Vẫn mở:** streaming inflation phải enforce trước allocation cho mọi format, và XLSX XML/shared-strings/styles cần pre-parse budget trước `XLSX.read`. Trạng thái giữ `KEEP OPEN — PARTIAL`.
