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

- [ ] Public ready response không phân biệt Redis/proxy/renderer cause; internal operator vẫn thấy cause code cần thiết.
- [ ] NaN, float, âm, zero, quá lớn, missing-half và deadline hierarchy sai đều fail predeploy/startup.
- [ ] Renderer URL ngoài allowlist, có credentials/query, insecure production hoặc redirect đều bị reject; token không forward qua redirect.
- [ ] Code/runtime/script/docs dùng cùng defaults/ranges; không drift.
- [ ] Errors/logs không echo secret/config values.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/api/ready/route.ts` | MODIFY | generic public health |
| `src/lib/server/production-config.ts` | MODIFY | typed ranges/hierarchy/URL |
| `services/pdf-renderer/server.mjs` hoặc config module | MODIFY | same validated limits |
| `scripts/check-production-config.mjs` | MODIFY | full matrix |
| config/readiness tests + Deployment docs | UPDATE | audience/default/ranges |

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

`PROPOSED — mở rộng W24-H từ presence validation sang audience/range/topology contract.`

