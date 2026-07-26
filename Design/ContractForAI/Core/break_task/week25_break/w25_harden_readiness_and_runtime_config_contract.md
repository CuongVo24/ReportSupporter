# Contract For AI — W25 Harden (J): Readiness Public Tối Giản · Diagnostics Nội Bộ · Config Có Range/Hierarchy

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Operational security / configuration correctness.
> **Findings:**
> - **S1** (🟠) — `/api/ready` public trả cause như Redis/proxy/renderer status, giúp fingerprint topology/failure dù không lộ secret trực tiếp.
> - **S2** (🟠) — Validation hiện tập trung presence/pairing; numeric env (timeout, deadline, concurrency, bytes, retry) có thể NaN/âm/out-of-range hoặc vi phạm hierarchy.
> - **S3** (🔴) — PDF renderer URL/token cần allowlist scheme/host/private topology/redirect policy; redirect có thể làm token service-to-service đi sai destination nếu fetch mặc định follow.
> - **S4** (🟡) — Liveness/readiness/diagnostics có audience khác nhau nhưng chưa tách public vs operator rõ.
> **Builds on:** W24-H production-config/readiness, W24-F/G deadlines, B/C access topology.
> **Sources:** route/config review 2026-07-22.

---

## 1. Micro-task Target

Public health chỉ tiết lộ `ok/unavailable` tối thiểu; nguyên nhân chi tiết đi log/metrics hoặc endpoint operator-authenticated. Mọi env được parse typed, bounded và kiểm cross-field; renderer URL không redirect/leak token ra ngoài allowlist.

- **S1 — Audience split.** `/api/ready` public body/status ổn định, generic; internal diagnostics yêu cầu operator auth/network, trả cause codes allowlisted, không values/secrets.
- **S2 — Numeric schema.** Parse integer finite; min/max cho bytes, concurrency, queue, timeouts; enforce `renderer < gateway < client`, headers/body/keepalive hợp lý, retry nonnegative.
- **S3 — URL/redirect safety.** Production renderer URL HTTPS/private allowlist (HTTP only explicit local profile); no credentials/query secret; `redirect:"manual"` và reject any redirect; resolve DNS/topology ở deployment, không user input.
- **S4 — Startup/predeploy parity.** Route/renderer/scripts dùng cùng canonical schema hoặc generated constants; invalid config fail before bind/traffic, safe error names only.

> 🔒 Readiness không trả env values, URLs nội bộ, tokens, Redis detail hay stack. Public generic status không làm mất internal observability.

## 2. Scope

### In scope
- `src/app/api/ready/route.ts` (MODIFY): public generic response.
- `src/lib/server/production-config.ts` + renderer config parser (MODIFY): range/hierarchy/URL policy.
- Internal diagnostics/log/metrics endpoint or adapter (NEW/MODIFY) có auth/network boundary.
- Config matrix/unit/staging smoke docs (UPDATE).

### Out of scope
- ❌ Monitoring vendor/dashboard cụ thể.
- ❌ Rate identity/access policy logic (B/C).
- ❌ Thay Redis/renderer hosting.

## 3. Checklist

- [x] Public ready response không phân biệt Redis/proxy/renderer cause; internal operator vẫn thấy cause code cần thiết.
- [x] NaN, float, âm, zero, quá lớn, missing-half và deadline hierarchy sai đều fail predeploy/startup.
- [x] Renderer URL ngoài allowlist, có credentials/query, insecure production hoặc redirect đều bị reject; token không forward qua redirect.
- [x] Code/runtime/script/docs dùng cùng defaults/ranges; không drift.
- [x] Errors/logs không echo secret/config values.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/api/ready/route.ts` | MODIFY | Generic public health `{ ready: boolean }` & operator diagnostics split |
| `src/lib/server/production-config.ts` | MODIFY | Range checks, deadline hierarchy (`render < gateway < client`) & URL credentials check |
| `src/app/api/pdf/route.ts` | MODIFY | `redirect: "manual"` policy & redirect rejection |
| `scripts/check-production-config.mjs` | MODIFY | Full matrix predeploy contract check |
| `src/lib/server/__tests__/production-config-ranges.test.ts` | NEW | Range, hierarchy & credentials unit tests |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Generic ready làm operator khó debug | Med | Structured internal metrics/log + authenticated diagnostic; correlation ID safe. |
| Range quá chặt phá deployment hiện tại | Med | Inventory current env/P99, migration warning một release nếu cần; invalid unsafe values vẫn hard fail. |
| DNS/private allowlist brittle ở serverless | Med | Hostname allowlist + infrastructure egress/private link; do not implement fragile IP-only SSRF check. |
| Duplicated validators drift | High | Shared schema/data file hoặc parity tests snapshot defaults/ranges. |

## 6. Verification Plan

- Table-driven env matrix cho mọi numeric/URL/pairing/hierarchy case; assert message chỉ chứa key/cause.
- Public requests trong từng failure mode có body generic giống nhau; operator channel nhận đúng cause sau auth.
- Mock renderer 30x redirect tới public canary: gateway không follow và canary không nhận token/request.

## 7. Status

`DONE (2026-07-25, re-verified after same-day REOPEN):`

Review cuối ngày 2026-07-25 (`w25_fix-all-bugs.md` §1.1.3, §1.2) tìm thấy gap trong bản DONE buổi sáng: operator-token so sánh bằng `===` (không constant-time); thiếu validate cho `PDF_REMOTE_ENABLED`, `RATE_LIMIT_SECRET`/`PDF_TICKET_SECRET` (+ version, + cross-purpose reuse), `TRUSTED_PROXY_HOPS`, renderer numeric envs (`PDF_MAX_CONCURRENCY`/`PDF_SHUTDOWN_GRACE_MS`/`PDF_BODY_READ_TIMEOUT_MS`) và hierarchy của chúng với `PDF_RENDER_DEADLINE_MS`; `PDF_RENDERER_URL` chỉ check format bằng regex thay vì `new URL()` (không chặn query/fragment/host-not-in-allowlist); readiness probe forward `PDF_RENDERER_TOKEN` tới endpoint `/ready` của renderer dù endpoint đó không yêu cầu auth (rò token tới host nếu `PDF_RENDERER_URL` bị cấu hình sai).

Re-fix 2026-07-25 (cùng ngày, bản thứ hai):
- `timingSafeTokenMatch()` mới trong `production-config.ts` (constant-time, so cả khi length lệch để tránh timing signal); `/api/ready` dùng hàm này thay `===`.
- `validateProductionConfig` mở rộng: `PDF_REMOTE_ENABLED` + `PDF_TICKET_TRUSTED_ISSUER_MODE=upstream-identity` bắt buộc khi bật ở production (§4.2 — public issuer không tự tạo authorization boundary); `RATE_LIMIT_SECRET`/`RATE_LIMIT_SECRET_VERSION`/`PDF_TICKET_SECRET`/`PDF_TICKET_SECRET_VERSION`/`OPERATOR_DIAGNOSTICS_TOKEN` bắt buộc + min-length + cross-purpose-reuse check (không được trùng nhau hoặc trùng `UPSTASH_REDIS_REST_TOKEN`); `TRUSTED_PROXY_HOPS` bắt buộc+range khi mode cần hop count; `PDF_RENDERER_URL` parse bằng `new URL()` — reject userinfo/fragment/query, non-https trong production phải nằm trong `PDF_RENDERER_ALLOWED_HOSTS`; renderer numeric envs (`PDF_MAX_CONCURRENCY`, `PDF_SHUTDOWN_GRACE_MS`, `PDF_BODY_READ_TIMEOUT_MS`) validated + hierarchy `PDF_BODY_READ_TIMEOUT_MS < PDF_RENDER_DEADLINE_MS`.
- `/api/ready` không còn gửi `PDF_RENDERER_TOKEN` trong probe `/ready` (endpoint renderer không auth cho `/ready`, chỉ `/render`).
- `.env.example` cập nhật đầy đủ biến mới kèm giải thích; `production-config.test.ts` +18 test case mới, `production-config.fuzz.test.ts` cập nhật baseline env để không false-fail do secret mới bắt buộc.

### Pass 2 — 2026-07-26 (review cuối)

CI nay chạy production-config checker bằng fixture hợp lệ và một negative fixture bắt buộc fail, nên không còn false-green do thiếu `NODE_ENV=production`. Parser hop được dùng chung giữa validator và runtime.

**Trạng thái:** `CODE FIXED — TARGET ENV EVIDENCE PENDING`; fixture CI không thay thế kiểm tra secret/URL/topology của môi trường triển khai thật.
