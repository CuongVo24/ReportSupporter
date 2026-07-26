# Contract For AI — W25 Fix (B): Rate-Limit Identity Không Bị Xoay Header · Trusted Ingress Không Spoof

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Abuse prevention / network trust boundary — **P0**.
> **Findings:**
> - **S1** (🔴) — `/api/pdf` gọi `rateLimitIdentity(request, x-api-key || "pdf-render")`; client có thể đổi header tùy ý để tạo bucket mới và né quota.
> - **S2** (🔴) — `/api/ai` ghép address+API-key thành một identity; attacker đổi một vế có thể phân tán quota. BYO key giảm chi phí operator nhưng không loại gateway/CPU/bandwidth abuse.
> - **S3** (🔴) — `forwarded`/`x-real-ip`/Cloudflare headers chỉ đáng tin khi ingress strip/overwrite và direct origin bị chặn; config mode một mình không tạo trust.
> **Builds on:** `src/lib/server/rate-limit.ts`, `/api/ai`, `/api/pdf`, production-config W24-H.
> **Sources:** source review 2026-07-22.

---

## 1. Micro-task Target

Thiết kế identity theo **tín hiệu không do caller tự chọn** và áp nhiều quota độc lập: PDF không dùng `x-api-key`; AI chịu cả per-client-address và per-provider-key fingerprint. Forwarded address chỉ dùng sau một trusted-ingress contract có test.

- **S1 — Identity primitives tách biệt.** Helper trả trusted client address và HMAC fingerprint key riêng; không có helper “concat mọi thứ thành một bucket”. HMAC dùng secret server, truncate hợp lý, không lưu raw key.
- **S2 — PDF policy.** Quota theo trusted address + access/session principal từ C; header `x-api-key` client gửi không ảnh hưởng bucket.
- **S3 — AI dual limiter.** Consume **cả** per-address và per-key-fingerprint; request chỉ chạy khi cả hai cho phép. Missing/unavailable Redis fail-closed production.
- **S4 — Trusted ingress.** Chốt mode theo platform, số hop/format, strip headers, firewall direct origin; unknown/malformed chain fail về direct/shared-safe identity chứ không lấy phần attacker chọn.

> 🔒 Không log raw API key/IP đầy đủ. Không dùng User-Agent/requestId làm identity. Không cho phép client “mang quota riêng” chỉ bằng header tùy ý.

## 2. Scope

### In scope
- `src/lib/server/rate-limit.ts` (MODIFY): trusted address parser, HMAC fingerprint, independent limiter composition.
- `src/app/api/ai/route.ts`, `src/app/api/pdf/route.ts` (MODIFY): policy mới.
- `src/lib/server/production-config.ts`, deployment docs/edge config (MODIFY): ingress mode/hops/origin lock.
- Unit + staging integration tests spoof/rotation/multi-client (NEW/UPDATE).

### Out of scope
- ❌ PDF authorization/session issuance (C).
- ❌ Thay Upstash hoặc quota values cuối cùng; contract này sở hữu identity/composition.
- ❌ Account system tổng quát.

## 3. Checklist

- [x] Xoay `x-api-key` trên PDF không tạo bucket mới.
- [x] AI vượt per-IP bị chặn dù đổi provider key; vượt per-key bị chặn dù đổi IP hợp lệ.
- [x] Forwarded headers giả qua direct origin không đổi identity; origin không public hoặc ingress overwrite được chứng minh.
- [x] Key fingerprint dùng keyed HMAC + rotation strategy, không raw/unsalted hash trong logs/store.
- [x] Redis lỗi production fail-closed; response có `Retry-After` nhưng không lộ bucket key.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/lib/server/rate-limit.ts` | MODIFY | trusted address + HMAC fingerprint + multi-limit |
| `src/app/api/ai/route.ts` | MODIFY | per-address AND per-key |
| `src/app/api/pdf/route.ts` | MODIFY | bỏ identity từ client `x-api-key` |
| `src/lib/server/production-config.ts` | MODIFY | trusted hop/secret validation |
| `src/lib/server/rate-limit.test.ts` | UPDATE | spoof/rotation/dual limit |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| NAT/shared campus IP gây false positive | Med | Hai tier burst/sustained; access principal ở C; metric aggregate trước khi chỉnh quota. |
| HMAC secret rotation reset bucket | Low | Versioned fingerprint secret + documented short overlap nếu cần. |
| Platform header behavior khác docs | High | Staging request capture có safe redaction + integration test từng host; direct origin deny. |
| Hai limiter tăng Redis calls | Med | Pipeline/batch nếu SDK hỗ trợ; fail semantics rõ, đo latency/quota. |

## 6. Verification Plan

- 100 PDF requests đổi `x-api-key`: quota vẫn cùng bucket và bị chặn đúng ngưỡng.
- AI matrix: same IP/many keys; same key/many trusted IPs; malformed/multiple forwarded headers; direct-origin spoof.
- Staging sau CDN/proxy thật: đối chiếu identity giữa hai client, xác nhận ingress overwrite và firewall origin.

## 7. Status

`DONE (2026-07-25, re-verified after REOPEN):`

Review 2026-07-25 (`w25_fix-all-bugs.md` §1.1.2, §1.2) tìm thấy gap trong bản `DONE (2026-07-24)`: `trustedClientAddress` chỉ lấy phần tử ĐẦU (`split(",")[0]`) của `x-forwarded-for` — client tự thêm entry giả ở đầu chain vẫn đổi được identity (S3 chưa thật sự đóng); mode `forwarded` chỉ alias sang đọc `x-forwarded-for` thay vì parse header `Forwarded` RFC 7239 thật; không dùng `node:net.isIP` nên IPv6/format lạ không được chuẩn hoá đúng; `apiKeyFingerprint` fallback chuỗi `RATE_LIMIT_SECRET -> UPSTASH_REDIS_REST_TOKEN -> hardcoded string` (secret không dedicated, có thể đụng token khác mục đích); export `rateLimitIdentity` không còn caller production (chỉ dùng trong test cũ).

Re-fix 2026-07-25:
- **Trusted-hop-counted parsing.** Thêm `TRUSTED_PROXY_HOPS` (validated bởi `production-config.ts`); `pickFromRight()` lấy đúng phần tử được proxy tin cậy đầu tiên append (`chain[length - hops]`), không bao giờ đọc phần client có thể tự thêm ở đầu chain. `mode=vercel` đọc `x-forwarded-for` theo hop count; `mode=forwarded` giờ parse thật header `Forwarded` (RFC 7239: multi-element, `for=` param, quoted value, bracketed IPv6 `for="[2001:db8::1]:1234"`, obfuscated identifier `for=unknown`/`for=_hidden` bị từ chối) — không còn alias XFF.
- **`node:net.isIP` chuẩn hoá.** Mọi giá trị qua `normalizeIp()`: kiểm `isIP()` trực tiếp, bracket-IPv6-with-port, IPv4-with-port; input không khớp → `"direct"`.
- **Dedicated versioned HMAC.** Bỏ fallback `UPSTASH_REDIS_REST_TOKEN`/hardcoded string; `apiKeyFingerprint`/address fingerprint dùng `RATE_LIMIT_SECRET` (bắt buộc production, enforced ở `production-config.ts`, ném lỗi fail-closed nếu thiếu ở production runtime) + `RATE_LIMIT_SECRET_VERSION` gắn vào output (`v1:<hex>`) để rotation không âm thầm đụng bucket cũ.
- Xoá export `rateLimitIdentity` (không còn caller production).
- `/api/ready` operator-token comparison đổi sang `timingSafeTokenMatch()` (constant-time) thay vì `===`.
- Test mới: hop-count đúng/spoofed-prefix bị bỏ qua/chain ngắn hơn hop count → `direct`, RFC 7239 quoted+bracketed IPv6, obfuscated identifier bị từ chối, `forwarded` mode không đọc XFF, versioned HMAC prefix, production throw khi thiếu secret. 23/23 test `rate-limit.test.ts` xanh; toàn bộ `src/app/api` (62 test) xanh sau khi đồng bộ 2 test fixture PDF/AI dùng hop-count formula mới.

### Pass 2 — 2026-07-26 (review cuối)

Ngoài parser hop canonical/fail-closed, review cuối còn sửa canonical IPv6, giới hạn port, giữ đúng vị trí trong proxy chain, từ chối slot rỗng và `Forwarded` có nhiều thuộc tính `for`. Regression test bao phủ malformed/missing/out-of-range hop, IPv6 tương đương, empty XFF/Forwarded position và duplicate `for`.

**Trạng thái:** `CODE FIXED — DEPLOY TOPOLOGY EVIDENCE PENDING`; cần xác nhận topology proxy thật trước khi gọi `DONE`.
