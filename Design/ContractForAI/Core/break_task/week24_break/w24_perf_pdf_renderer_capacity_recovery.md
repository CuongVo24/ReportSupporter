# Contract For AI — W24 Perf (F): PDF Renderer Có Admission Control · Tự Phục Hồi Chromium · Giới Hạn Tài Nguyên

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Performance/reliability — **blocker trước public beta**.
> **Findings:**
> - **S1** (🔴) — `services/pdf-renderer/server.mjs` giữ một Chromium nhưng tạo `browser.newPage()` cho mọi request, không semaphore/queue/capacity gate. Rate limit `5/phút` ở `/api/pdf` là theo identity, không bảo vệ tổng tải; nhiều người dùng có thể đồng thời đưa HTML tối đa 25 MiB vào nhiều page Chromium.
> - **S2** (🔴) — `browser` là `const` khởi tạo một lần. Khi Chromium `disconnected`, `/health` vẫn trả `200 {ok:true}` và mọi request sau tiếp tục gọi instance chết cho tới khi process/container bị restart.
> - **S3** (🟠) — `docker-compose.pdf.yml` có read-only/tmpfs/security hardening nhưng chưa có `mem_limit`, CPU/PID ceiling hay concurrency env. OOM có thể giết cả service thay vì từ chối có kiểm soát.
> **Builds on:** `services/pdf-renderer/server.mjs`, `docker-compose.pdf.yml`, `scripts/test-pdf-integration.mjs`, W27 PDF artifact contract.
> **Sources:** review tổng thể 2026-07-19 + source verification hiện tại.

---

## 1. Micro-task Target

Đặt **capacity envelope hữu hạn** cho renderer: tối đa một số page được đo và cấu hình (mặc định `2`), từ chối nhanh khi bão hòa, tự relaunch Chromium sau disconnect, và để orchestrator phân biệt process sống với renderer sẵn sàng.

- **S1 — Admission control.** Thêm semaphore/admission controller dùng chung toàn process. `PDF_MAX_CONCURRENCY` mặc định `2`, giới hạn hợp lệ `1..4`; khi đủ slot thì trả `503` + `Retry-After`, **không** tạo queue vô hạn và không đọc/buffer body lớn rồi mới từ chối.
- **S2 — Browser lifecycle manager.** Thay instance bất biến bằng manager có `launchPromise`, trạng thái `starting/ready/disconnected/draining`; chỉ một relaunch được chạy; request gặp browser chết được retry **tối đa một lần trước khi bắt đầu render**, không retry mù sau khi đã sinh PDF.
- **S3 — Health/readiness.** `/health` (liveness) xác nhận process; `/ready` chỉ `200` khi browser connected và service không draining, còn lại `503`. Không báo ready giả.
- **S4 — Resource envelope.** Compose khai báo memory/PID/CPU limit có default được review; tmpfs không lớn hơn memory envelope; shutdown ngừng nhận request mới, đợi job đang chạy trong khoảng grace hữu hạn rồi đóng browser.

> 🔒 Không log HTML, PDF bytes, token hoặc URL chứa dữ liệu người dùng. Chỉ log aggregate: active slots, reject count, render duration, relaunch count, outcome.
> 🔒 Không tăng concurrency để “chữa” latency trước khi có burst/heap evidence. Default bảo thủ `2`.

## 2. Scope

### In scope
- [services/pdf-renderer/server.mjs](services/pdf-renderer/server.mjs) (MODIFY): admission controller, browser manager, ready/drain lifecycle, aggregate metrics/log.
- [docker-compose.pdf.yml](docker-compose.pdf.yml) (MODIFY): concurrency env + memory/CPU/PID limit + healthcheck readiness.
- [scripts/test-pdf-integration.mjs](scripts/test-pdf-integration.mjs) (MODIFY): burst test, saturation, disconnect/relaunch, no page leak.
- `services/pdf-renderer/*.test.mjs` (NEW nếu tách được): unit cho semaphore/browser manager không cần Chromium thật.

### Out of scope
- ❌ Scale nhiều replica/queue ngoài process.
- ❌ Thay Puppeteer/Chromium hoặc đổi chất lượng/layout PDF.
- ❌ Gateway timeout/cancel/status mapping — thuộc [[w24_perf_pdf_gateway_backpressure_cancellation]].

## 3. Checklist
- [ ] Request vượt capacity bị từ chối **trước** `readBody`/`newPage`, status `503`, có `Retry-After`.
- [ ] `activePages` không vượt `PDF_MAX_CONCURRENCY` trong burst 10 request; mọi page đóng ở success/error/abort.
- [ ] Chromium disconnect làm readiness đỏ; một browser mới được launch; readiness xanh lại; không launch storm.
- [ ] Compose có resource limit và healthcheck; graceful shutdown không nhận job mới.
- [ ] PDF output/parity/security isolation giữ nguyên. Gate unit + Docker integration + burst xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `services/pdf-renderer/server.mjs` | MODIFY | `createAdmissionController`, `getBrowser`, readiness/drain |
| `docker-compose.pdf.yml` | MODIFY | `PDF_MAX_CONCURRENCY`, resource/health limits |
| `scripts/test-pdf-integration.mjs` | MODIFY | saturation + recovery proof |
| `services/pdf-renderer/server.test.mjs` | NEW (ưu tiên) | lifecycle logic không phụ thuộc network |

> **Import boundary:** ưu tiên Node primitives; không thêm queue library.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Cap thấp làm tăng 503 | Med | Client nhận `Retry-After`; đo burst rồi mới chỉnh env; không queue vô hạn. |
| Hai request cùng relaunch tạo hai Chromium | High | Single-flight `launchPromise` + state machine test. |
| Retry render tạo artifact trùng | Med | Chỉ retry khi page chưa bắt đầu `setContent/pdf`; không retry sau response/body. |
| Memory limit quá thấp làm crash | Med | Soak với HTML có ảnh lớn; chọn limit từ peak RSS + headroom, ghi evidence. |

## 6. Verification Plan
- Chạy 10 request đồng thời với `PDF_MAX_CONCURRENCY=2`: active page peak = 2; phần dư nhận 503 nhanh; service không OOM; request được nhận sinh `%PDF-` hợp lệ.
- Kill/disconnect browser giữa hai lượt: `/ready` → 503, manager relaunch đúng một lần, `/ready` → 200, lượt sau render thành công.
- Gây lỗi `setContent`/timeout: slot được release, page count về 0; request kế tiếp không bị kẹt.
- Chạy container với resource limits và thu peak RSS/PID/render P95 vào artifact CI; không có nội dung báo cáo trong log.

## 7. Status

`PROPOSED — chờ Approve; chưa chạm src/service runtime.`

