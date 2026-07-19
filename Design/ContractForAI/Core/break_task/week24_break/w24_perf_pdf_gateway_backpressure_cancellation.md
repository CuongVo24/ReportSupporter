# Contract For AI — W24 Perf (G): PDF Gateway Đồng Bộ Deadline · Hủy Render Khi Client Rời · Không Buffer Artifact Hai Lần

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Performance/reliability end-to-end; làm sau F.
> **Findings:**
> - **S1** (🔴) — deadline lệch tầng: renderer cho `setContent` 30s **và** `page.pdf` 30s nối tiếp, `/api/pdf` abort sau 30s, client abort sau 35s. Gateway có thể trả timeout trong khi Chromium vẫn tiếp tục làm việc gần một phút.
> - **S2** (🟠) — client/request disconnect chưa được nối tới page lifecycle. Job đã vô ích vẫn giữ slot/CPU/RAM cho tới timeout.
> - **S3** (🟠) — `/api/pdf` buffer `request.text()`, tạo thêm full copy qua `TextEncoder().encode`, tạo sanitized string, rồi buffer toàn PDF bằng `response.arrayBuffer()`. Với ngưỡng 25/50 MiB, một request tạo nhiều bản sao heap ở serverless gateway.
> - **S4** (🟡) — renderer 503/429 sau F hiện sẽ bị route đổi thành `502 "rejected"`; `Retry-After` mất, client không phân biệt bão hòa với artifact lỗi.
> **Builds on:** [[w24_perf_pdf_renderer_capacity_recovery]], `/api/pdf`, `export-pdf.ts`.
> **Sources:** review tổng thể 2026-07-19 + source verification hiện tại.

---

## 1. Micro-task Target

Biến PDF thành một request lifecycle thống nhất: **một deadline budget**, cancellation truyền xuyên client → Next route → renderer page, backpressure giữ nguyên status/retry, và gateway không giữ thêm một full PDF buffer chỉ để forward.

- **S1 — Deadline hierarchy.** Chốt và test thứ tự `renderer operation < gateway < browser client` (ví dụ 40s < 45s < 50s). Renderer dùng **một deadline tổng** cho setContent+pdf, không cộng hai timeout độc lập.
- **S2 — Cancellation.** `exportPdf` dùng AbortController; `/api/pdf` combine `request.signal` với deadline; renderer lắng nghe request aborted/response close và đóng page/release slot ngay. Cancellation là outcome riêng, không relaunch browser.
- **S3 — Bounded forwarding.** Giữ sanitize bắt buộc nhưng bỏ full-size encode copy không cần thiết; response PDF được verify prefix `%PDF-` + đếm byte trong bounded stream rồi forward, không `arrayBuffer()` toàn artifact tại gateway. Nếu runtime không cho stream an toàn, phải có heap measurement chứng minh phương án thay thế.
- **S4 — Preserve overload semantics.** 429/503 từ renderer được map đúng; forward `Retry-After`; client hiển thị “dịch vụ đang bận, thử lại sau N giây” và giữ Print Preview fallback. 4xx auth/input không bị đổi thành lỗi 502 chung.

> 🔒 Không bỏ `sanitizePdfHtml`, 25 MiB input cap, 50 MiB output cap hoặc `%PDF-` verification để đổi lấy tốc độ.
> 🔒 Không auto-retry POST PDF ở client nếu chưa có idempotency/admission proof; người dùng chủ động thử lại theo `Retry-After`.

## 2. Scope

### In scope
- [src/app/api/pdf/route.ts](src/app/api/pdf/route.ts) (MODIFY): combined abort, bounded input/output, status/header mapping.
- [services/pdf-renderer/server.mjs](services/pdf-renderer/server.mjs) (MODIFY): shared deadline, abort/close page.
- [src/modules/export/export-pdf.ts](src/modules/export/export-pdf.ts) (MODIFY): aligned client timeout, busy/retry UX, caller cancellation surface nếu cần.
- Route/client/integration tests (UPDATE): fragmented streams, oversized response, abort, 503 Retry-After.

### Out of scope
- ❌ Admission/browser relaunch/resource limit (F).
- ❌ Đổi HTML sanitizer hoặc chất lượng PDF.
- ❌ Queue phân tán/multi-region.

## 3. Checklist
- [ ] Ba deadline có một source/config contract và test thứ tự; renderer không thể chạy sau gateway quá grace nhỏ.
- [ ] Client abort/tab rời làm page đóng + slot release; không ghi response sau `close`.
- [ ] Gateway enforce byte cap cả khi thiếu/sai `Content-Length`, verify `%PDF-`, không full-buffer output.
- [ ] Renderer 503 + `Retry-After` tới đúng client; UI phân biệt busy/timeout/unavailable/invalid artifact.
- [ ] Peak heap gateway giảm rõ trên payload 25 MiB/PDF 50 MiB; không hồi quy security tests.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/api/pdf/route.ts` | MODIFY | abort composition, bounded streaming proxy |
| `services/pdf-renderer/server.mjs` | MODIFY | one operation deadline + disconnect cleanup |
| `src/modules/export/export-pdf.ts` | MODIFY | timeout/status/retry UX |
| `src/app/api/pdf/route.test.ts` | UPDATE | status, stream cap, abort |
| `scripts/test-pdf-integration.mjs` | UPDATE | disconnect/deadline proof |

> **Import boundary:** Web/Node stream primitives sẵn có; không thêm proxy library.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Stream response trước khi verify hết rồi mới phát hiện oversized | High | Bounded temp/spool hoặc stream gate phù hợp runtime; không commit 200 tới khi prefix/header hợp lệ; test chunked oversized. |
| Abort race gây double close/write-after-end | Med | Idempotent cleanup + một completion state; test abort ở read/setContent/pdf/write. |
| Deadline ngắn làm fail tài liệu hợp lệ | Med | Baseline P95/P99 tài liệu 40 trang + ảnh; đặt headroom và metric stage duration. |
| Status renderer lộ chi tiết nội bộ | Low | Allowlist status/header; body lỗi public trung tính. |

## 6. Verification Plan
- Render tài liệu 40 trang: stage timing nằm trong shared budget; client/gateway/renderer không timeout lệch.
- Abort client khi renderer đang `page.pdf`: active slot về 0 nhanh, request sau được nhận, không có unhandled rejection.
- Mock renderer trả chunked PDF 50 MiB+1: gateway dừng, trả lỗi an toàn, peak heap không tăng theo hai full artifact copies.
- Mock renderer bão hòa: client nhận 503 + Retry-After và copy fallback Print Preview; không ghi job “artifact invalid”.

## 7. Status

`PROPOSED — phụ thuộc F; chưa thi công.`

