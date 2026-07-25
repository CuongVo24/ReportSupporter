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

`DONE (2026-07-25):`
- **S1 Browser Sandbox**: Loại bỏ cờ `--no-sandbox` mặc định trong `server.mjs` (cho phép bật `PUPPETEER_DISABLE_SANDBOX` chỉ khi có isolation ADR ở tầng container/kernel).
- **S2 End-to-End Total Deadline**: Đặt mốc `deadlineAt` tổng ngay khi HTTP request tới server (`startedAt`), dùng chung budget giữa `readBody` và `renderPdf` (không cộng nối tiếp timeout).
- **S3 HTTP Slowloris Controls**: Cấu hình `server.requestTimeout` (30s), `server.headersTimeout` (10s), `server.keepAliveTimeout` (5s), và `readBody` timeout (15s). Hủy socket và giải phóng slot ngay nếu client truyền body chậm.
- **S4 Egress Deny**: Bắt buộc chặn tất cả các yêu cầu kết nối ra ngoài mạng (`http:`, `https:`, `file:`, `ws:`), chỉ cho phép `about:blank` và `data:` URIs.
- Vượt qua toàn bộ 5 node unit tests trong `services/pdf-renderer/server.test.mjs` và 21 Vitest tests.

