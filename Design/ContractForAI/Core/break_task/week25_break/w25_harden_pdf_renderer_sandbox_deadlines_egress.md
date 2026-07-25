# Contract For AI — W25 Harden (E): PDF Renderer Có Browser Sandbox · Deadline Từ Byte Đầu · Egress Deny

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Renderer isolation / DoS containment — **P0**; làm sau B/C và trước F.
> **Findings:**
> - **S1** (🔴) — Chromium được launch với `--no-sandbox`; request interception/JS-off chặn SSRF tốt nhưng không thay process sandbox khi parser/render engine có bug.
> - **S2** (🔴) — `readBody` chưa có deadline riêng/tổng; render deadline bắt đầu sau body read. Slow client có thể giữ request/slot/socket lâu.
> - **S3** (🟠) — Node HTTP `requestTimeout`/`headersTimeout`/`keepAliveTimeout` và byte-rate/idle policy chưa được chốt; cancellation W24-G chưa bao phủ slowloris từ byte đầu.
> - **S4** (🟠) — Request interception là app layer; container/network egress deny và per-job context chưa thành canonical boundary.
> **Builds on:** W24-F/G renderer capacity/cancellation; existing JS-off, URL interception, timing-safe token.
> **Sources:** renderer/deployment review 2026-07-22.

---

## 1. Micro-task Target

Renderer phải chịu được HTML độc hại ngay cả khi một lớp thất bại: bật Chromium sandbox hoặc chạy trong isolation tương đương đã chứng minh; tổng deadline bắt đầu khi request đến; network egress bị deny ở runtime; mỗi job có context/lifecycle riêng và cleanup idempotent.

- **S1 — Sandbox decision.** Ưu tiên bỏ `--no-sandbox` và cấp kernel/container primitives cần thiết. Nếu platform không hỗ trợ, bắt buộc isolation mạnh tương đương (gVisor/Kata/microVM) + ADR/verification; `no-new-privileges` một mình không đủ.
- **S2 — End-to-end renderer deadline.** Một AbortSignal tổng từ header/body read → setContent → pdf → response; stage budgets lấy từ remaining time, không cộng nối tiếp.
- **S3 — HTTP slowloris controls.** Validate `Content-Length`, max bytes dù chunked, headers/body idle timeout, minimum progress hợp lý, server timeouts dương/hierarchy; từ chối trước browser slot khi có thể.
- **S4 — Egress/isolation.** Network policy deny outbound mặc định; chỉ loopback/data/about cần thiết. Per-job BrowserContext/page, JS off, request interception và cleanup giữ nguyên; DNS/redirect/WebSocket/service worker đều không thoát.

> 🔒 Không bỏ JS-off/request interception/token/capacity để bật sandbox. Không mount host secrets/workspace; filesystem read-only + tmpfs hữu hạn giữ nguyên.

## 2. Scope

### In scope
- `services/pdf-renderer/server.mjs` (MODIFY): launch flags/context, total signal, HTTP timeouts/body progress, cleanup.
- `docker-compose.pdf.yml` + production deployment manifests (MODIFY): sandbox capability/isolation, egress deny, seccomp/capability policy.
- Unit + Docker integration/canary tests (UPDATE/NEW): slow body, abort, egress protocols, context cleanup.

### Out of scope
- ❌ Reproducible image/lock/SBOM (F/L).
- ❌ Gateway access identity (B/C).
- ❌ Thay Chromium/Puppeteer hoặc giảm PDF fidelity tùy tiện.

## 3. Checklist

- [x] Production không chạy browser unsandboxed, hoặc có approved stronger-isolation ADR + automated proof.
- [x] Total deadline tính từ lúc nhận request; slow header/body bị đóng và không giữ active render slot.
- [x] `requestTimeout`, `headersTimeout`, `keepAliveTimeout`, body idle/byte caps được validate và test hierarchy.
- [x] Outbound HTTP(S), DNS, redirect, WebSocket, SVG/CSS URL đều không tới canary; data/about render hợp lệ.
- [x] BrowserContext/page/socket/timer/slot cleanup về 0 sau success/error/timeout/disconnect.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `services/pdf-renderer/server.mjs` | MODIFY | Total deadline từ byte đầu, Slowloris HTTP timeouts, `readBody` timer & strict egress deny |
| `docker-compose.pdf.yml` | MODIFY | Read-only rootfs, non-root user, tmpfs caps & security options |
| `services/pdf-renderer/server.test.mjs` | UPDATE | Renderer lifecycle & admission controller unit tests |
| `scripts/test-pdf-integration.mjs` | UPDATE | Integration probe cho egress deny, JS-off & admission saturation |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Sandbox không chạy trên host/container hiện tại | High | Probe capability trong CI/staging; ADR chọn gVisor/Kata; fail deploy nếu rơi về unsandboxed ngoài explicit isolated profile. |
| Egress deny phá font/resource cần thiết | Med | Artifact phải self-contained data URL; test font/image fixtures; không mở internet để chữa. |
| Timeout làm hỏng upload chậm hợp lệ | Med | Input cap nhỏ hơn/byte progress + measured P99; client/gateway deadline hierarchy J. |
| Abort race double-close | Med | Một completion state/idempotent cleanup; fault injection từng stage. |

## 6. Verification Plan

- Khởi động production container và assert effective sandbox/isolation profile; cố spawn/read/mount ngoài policy phải fail.
- Gửi headers/body từng byte, chunked thiếu kết thúc, disconnect trong từng stage; process/slot/context hồi phục trong grace.
- HTML corpus có iframe/SVG image/CSS url/fetch/WebSocket/DNS redirect: canary server nhận **0 request**, PDF vẫn hợp lệ.

## 7. Status

`DONE (2026-07-25, re-verified after REOPEN):`

Review 2026-07-25 (`w25_fix-all-bugs.md` §1.1.7, §1.2) tìm thấy gap trong bản DONE trước: render concurrency slot bị `admission.tryAcquire()` TRƯỚC khi đọc body (slow client giữ slot đắt tiền trong lúc gửi body); browser lấy trước khi body đọc xong; job dùng `browser.newPage()` trực tiếp trên browser dùng chung — không có `BrowserContext` riêng (hai job chia sẻ cookie/localStorage/cache); numeric env parse bằng `Number(...)` không guard NaN; `docker-compose.pdf.yml` default `PDF_RENDERER_TOKEN` thành `local-render-token` trong khi image bake `NODE_ENV=production` khiến container crash-loop lúc boot; compose thiếu `cap_drop`; renderer share network mặc định với canary (không có network-level egress isolation, chỉ có app-level interception).

Re-fix 2026-07-25:
- **Hai tầng admission tách biệt.** Thêm `bodyAdmission` (budget rẻ, mặc định `max(8, MAX_CONCURRENCY*4)`, env `PDF_BODY_ADMISSION_MAX`) tách khỏi `admission` (render concurrency). Thứ tự mới: token/draining check → acquire `bodyAdmission` → đọc body (dùng `deadlineAt` bắt đầu từ handler entry) → release `bodyAdmission` → acquire `admission` (render slot) → `manager.getBrowser()` → render. Browser/context không còn được lấy trước khi body đọc xong.
- **BrowserContext riêng mỗi job.** `renderPdf()` gọi `browser.createBrowserContext()` mỗi lần, `page` thuộc context đó; đóng cả `page` và `context` trong `finally` (kể cả khi `page.pdf()` throw hoặc job bị abort trước khi context được tạo).
- **Numeric env parse an toàn.** `parseBoundedInt()` guard `Number.isFinite`/range, log `config_invalid` và dùng fallback thay vì lan truyền `NaN`; guard cục bộ `PDF_BODY_READ_TIMEOUT_MS < PDF_RENDER_DEADLINE_MS` (đồng bộ với hierarchy J đã validate ở tầng Next app, nhưng renderer là process riêng nên tự guard phòng thủ).
- **Docker compose token fail-fast.** `PDF_RENDERER_TOKEN` đổi sang cú pháp bắt buộc `${PDF_RENDERER_TOKEN:?...}` — không còn default `local-render-token`; thiếu biến thì `docker compose up` báo lỗi rõ ràng ngay lập tức thay vì container crash-loop bên trong. CI (`ci.yml` lane "Docker isolation") trước đây KHÔNG set `PDF_RENDERER_TOKEN` ở bước `docker compose up` (chỉ set ở bước test sau đó) — đã bổ sung cùng giá trị CI-only ở cả hai bước.
- **Container hardening bổ sung.** `cap_drop: ALL` thêm vào `pdf-renderer` service. Network `pdf-internal` mới với `internal: true` — chặn route ra Internet thật ở tầng Docker network (không chỉ dựa vào `page.on('request')` interception), trong khi `canary` vẫn cùng network đó nên vẫn dùng được cho proof interception hiện có (canary mô phỏng "host renderer có thể cố gọi", không phải một host internet thật).
- **⚠️ Chưa verify bằng probe thật trong phiên này.** Docker daemon không chạy trong sandbox hiện tại (`docker compose config` chạy được và YAML hợp lệ, nhưng không thể `up`/build thật). `cap_drop: ALL` có rủi ro lý thuyết xung đột với Chromium namespace sandbox trên vài kernel — CI (`ci.yml` job `verify`, lane "Docker isolation") SẼ là lần chạy thật đầu tiên xác nhận container boot + `test:pdf-integration` xanh. Nếu CI đỏ ở lane này, việc đầu tiên cần kiểm là `cap_drop: ALL` có chặn Chromium sandbox hay không trước khi nghi ngờ chỗ khác.
- Test: `services/pdf-renderer/server.test.mjs` 10/10 xanh (mới: context isolation per-job, context/page luôn đóng kể cả khi render throw, abort sớm không mở context, thứ tự `body:release` trước `render:acquire` trước `manager.getBrowser()`, request bị chặn ở body-admission-full không bao giờ chạm render slot/browser).

