# Contract For AI — W24 Perf (H): Production Config Readiness — Redis/Proxy/PDF Bắt Buộc, Fail Trước Khi Người Dùng Gặp 503

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Deployment readiness / availability; blocker public beta.
> **Findings:**
> - **S1** (🔴) — production thiếu `UPSTASH_REDIS_REST_URL/TOKEN` làm limiter `available:false`; cả `/api/ai` và `/api/pdf` trả 503. Đây là fail-closed đúng security nhưng hiện chỉ lộ sau deploy khi user gọi route.
> - **S2** (🔴) — `.env.example` không liệt kê các env production. `Deployment.md` đầu file nói Redis/proxy/PDF bắt buộc nhưng §3 vẫn nói “MVP không cần biến môi trường bắt buộc”, tạo contract vận hành mâu thuẫn.
> - **S3** (🟠) — renderer cho phép mọi request nếu `PDF_RENDERER_TOKEN` rỗng (`tokenMatches` trả true); app route cũng chỉ gửi token nếu có. Cấu hình sai có thể vừa mở renderer, vừa làm availability/security không xác định.
> - **S4** (🟠) — `TRUSTED_PROXY_MODE=none` khiến PDF identity dùng `direct + pdf-render`, nên quota 5/phút có thể thành quota chung cho toàn beta; trust sai mode lại cho phép header spoofing.
> **Builds on:** `rate-limit.ts`, `/api/ai`, `/api/pdf`, `services/pdf-renderer`, `Deployment.md`.
> **Sources:** review tổng thể 2026-07-19 + W36 rate-limit evidence.

---

## 1. Micro-task Target

Biến các env hiện đang là “kiến thức ngầm” thành **deployment contract kiểm được**: validation chạy trước release, readiness smoke không lộ secret, và tài liệu/env example thống nhất với code.

- **S1 — Typed production config.** Một server-only validator kiểm presence/format/pairing: Upstash URL+token phải đi cặp; `TRUSTED_PROXY_MODE` thuộc allowlist và được chọn theo host; PDF URL+token phải đi cặp khi PDF feature bật; renderer production không được token rỗng/default.
- **S2 — Predeploy gate.** Thêm `check:production-config` nhận env của target deployment và fail CI/deploy trước traffic. Không ép env production trong `next build` dùng cho local/test nếu target không bật surface; feature flag phải được xét rõ.
- **S3 — Readiness smoke.** Probe xác nhận limiter backend reachable và PDF renderer `/ready` authenticated, nhưng chỉ trả trạng thái/cause code an toàn; không in secret/API key.
- **S4 — Docs parity.** `.env.example`, `Deployment.md`, README deploy checklist và hosting matrix (Vercel/Cloudflare/Node) ghi giá trị hợp lệ, ownership, rotation, rollback.

> 🔒 Fail-closed production giữ nguyên. Contract này làm lỗi **sớm và quan sát được**, không thêm memory fallback production.
> 🔒 Không tự tin `x-forwarded-for` nếu platform contract chưa xác nhận. Không log/hash token làm fingerprint công khai.

## 2. Scope

### In scope
- `src/lib/server/production-config.ts` (NEW): parse/validate config server-only.
- [src/lib/server/rate-limit.ts](src/lib/server/rate-limit.ts), `/api/ai`, `/api/pdf` (MODIFY nhẹ): dùng validated config/cause codes.
- `scripts/check-production-config.mjs` + package/CI/deploy config (NEW/UPDATE).
- [.env.example](.env.example), [Design/Modules/Other/Deployment.md](Design/Modules/Other/Deployment.md), README (UPDATE): single truth.
- Renderer startup (MODIFY): production token rỗng/default → fail start; local compose default chỉ dùng local profile rõ ràng.

### Out of scope
- ❌ Thay Upstash hoặc đổi rate-limit algorithm/quota.
- ❌ Thêm auth account/server DB.
- ❌ Lưu provider API key ở server.

## 3. Checklist
- [ ] Missing/mismatched Redis env, invalid proxy mode, PDF URL thiếu token đều fail predeploy với message actionable.
- [ ] `NODE_ENV=production` renderer không khởi động khi token rỗng/default; local compose vẫn chạy qua explicit dev profile.
- [ ] Readiness phân biệt `config_missing`, `redis_unreachable`, `renderer_unready` mà không lộ secret.
- [ ] `.env.example` + Deployment §3 không còn mâu thuẫn; có matrix Vercel/Cloudflare/Node.
- [ ] Smoke staging xác nhận nhiều client không dùng chung bucket `direct`; AI/PDF route không 503 do config.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/lib/server/production-config.ts` | NEW | schema + safe diagnostic |
| `scripts/check-production-config.mjs` | NEW | predeploy command |
| `.env.example` | MODIFY | required/conditional env matrix |
| `Design/Modules/Other/Deployment.md` | MODIFY | single source deployment truth |
| `services/pdf-renderer/server.mjs` | MODIFY | token/startup validation |
| `.github/workflows/ci.yml`, `package.json` | MODIFY | config gate/smoke wiring |

> **Import boundary:** không đưa env/secret vào client bundle; validator chỉ server/scripts.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Gate chặn preview deployment không bật PDF | Med | Điều kiện theo explicit feature/target profile; không suy diễn từ env ngẫu nhiên. |
| Readiness gọi Redis tốn quota/latency | Low | Probe nhẹ, cache ngắn, tần suất healthcheck hữu hạn. |
| Proxy mode sai platform làm chung bucket/spoof | High | Hosting matrix + integration test header thực tế ở staging. |
| Secret lộ qua lỗi CI/log | High | Chỉ in tên biến/cause; redact toàn value. |

## 6. Verification Plan
- Chạy validator với ma trận missing-half Redis, invalid proxy, PDF URL không token, token local trong production: đều fail đúng cause, không echo value.
- Chạy local/dev profile: không cần Redis production; limiter memory test vẫn xanh.
- Deploy staging đúng env: readiness xanh; gọi AI/PDF từ hai identity thấy bucket tách đúng; rotate PDF token và xác nhận old token 401/new token thành công.
- Review docs parity bằng test/snapshot env keys để code và `.env.example` không drift.

## 7. Status

`DONE (2026-07-21) — thi công:`
- `src/lib/server/production-config.ts` (NEW): `validateProductionConfig(env, {production, pdfEnabled})` — Redis URL+token đi cặp + https; `TRUSTED_PROXY_MODE` allowlist + production `none` = shared-bucket error; PDF URL+token đi cặp; token rỗng/default local trong production = error. Cause codes typed, **không echo secret**. `rendererTokenIsInsecure` cho renderer.
- `scripts/check-production-config.mjs` (NEW): predeploy gate, in tên biến+cause, exit 1 khi sai; import validator qua Node strip-types.
- `src/app/api/ready/route.ts` (NEW): readiness smoke → 200/503 với cause `config_missing`/`redis_unreachable` (Redis PING, không tốn quota)/`renderer_unready` (ping `/ready` có token). Không lộ secret.
- `services/pdf-renderer/server.mjs` (MODIFY): `assertRendererTokenSecure()` — production token rỗng/default → fail start trước khi bind port.
- `.env.example` (REWRITE): ma trận required/conditional + allowlist proxy + ràng buộc token.
- `Design/Modules/Other/Deployment.md §3` (MODIFY): gỡ mâu thuẫn "MVP không cần env", thêm bảng required/conditional + hosting matrix Vercel/Cloudflare/Node + ownership/rotation/rollback.
- `src/lib/server/production-config.test.ts` (NEW): 12 test (missing-half Redis, invalid proxy, shared bucket, PDF token missing/insecure, no-secret-leak, dev lenient) ✅.
- `package.json` (+`check:production-config`), `.github/workflows/ci.yml` (thêm bước sau typecheck).

> 🔒 Fail-closed giữ nguyên; chỉ làm lỗi sớm/quan sát được. Canonical còn lại: smoke staging đúng env xác nhận hai identity không chung bucket + rotate token 401/200 — chạy trên staging.

