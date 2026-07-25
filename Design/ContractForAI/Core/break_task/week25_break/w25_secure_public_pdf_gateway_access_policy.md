# Contract For AI — W25 Secure (C): PDF Gateway Có Access Policy · Không Chỉ Dựa Rate Limit

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Authorization / abuse-cost containment — **P0 trước public beta**; phụ thuộc B.
> **Findings:**
> - **S1** (🔴) — `/api/pdf` nhận HTML và tiêu tốn Chromium nhưng không có user/session authorization; rate limit chỉ giảm tốc, không chứng minh caller được phép dùng compute.
> - **S2** (🟠) — Route chưa biến `Content-Type`, Fetch Metadata/Origin và body contract thành defense-in-depth nhất quán.
> - **S3** (🟠) — Nếu origin renderer/gateway lộ trực tiếp, token nội bộ hoặc quota app không bảo vệ toàn đường.
> **Builds on:** B identity, W24 F/G capacity/cancellation, renderer token.
> **Sources:** source/deployment review 2026-07-22.

---

## 1. Micro-task Target

PDF remote render chỉ nhận job có **proof do server phát** và ngắn hạn; deployment không bật public route ngoài ý muốn. Chọn một policy phù hợp local-first: signed one-time render ticket/session capability; nếu chưa có issuer an toàn thì **disable remote PDF mặc định** và giữ Print Preview fallback.

- **S1 — Capability.** Server phát ticket gắn audience, expiry ngắn, nonce/job digest/size class; renderer endpoint chỉ nhận qua same-origin gateway. Verify timing-safe; chống replay theo TTL.
- **S2 — Admission order.** Kiểm method/content-type/access/rate/capacity **trước** đọc body lớn hoặc gọi renderer.
- **S3 — Browser defenses.** Enforce `application/json` hoặc media type canonical; same-origin Fetch Metadata/Origin cho browser flows. Đây không thay capability.
- **S4 — Network topology.** Renderer private network, gateway origin protected; remote PDF feature flag default off khi access dependencies chưa ready.

> 🔒 Không đưa `PDF_RENDERER_TOKEN` xuống browser. Không dùng CSRF header/Origin làm authentication. Print Preview vẫn là fallback local rõ ràng.

## 2. Scope

### In scope
- `/api/pdf` + endpoint/flow phát render capability (NEW/MODIFY).
- `src/modules/export/export-pdf.ts` (MODIFY): xin/gửi ticket, fallback có feedback.
- production config/deployment topology (MODIFY): feature flag, private renderer, origin deny.
- Replay/expiry/origin/content-type/disabled-mode tests.

### Out of scope
- ❌ Account/role system đầy đủ nếu sản phẩm chưa có.
- ❌ Thay renderer token service-to-service.
- ❌ Auto-upload/lưu HTML/PDF server-side.

## 3. Checklist

- [x] Request PDF không capability/expired/replayed bị chặn trước body/render slot.
- [x] Browser không bao giờ thấy renderer service token.
- [x] Content-Type/size/method/Fetch Metadata sai fail nhanh bằng generic response.
- [x] Renderer chỉ reachable từ gateway/private network; direct external probe fail.
- [x] Feature chưa configured → remote PDF off + Print Preview hoạt động, không fail-open.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/lib/server/pdf-access.ts` | NEW | Issuer capability ticket ngắn hạn, HMAC signature & anti-replay tracker |
| `src/app/api/pdf/ticket/route.ts` | NEW | Endpoint phát ticket ngắn hạn dựa trên htmlHash & same-origin Fetch Metadata |
| `src/app/api/pdf/route.ts` | MODIFY | Admission order: kiểm tra ticket capability trước khi đọc body hay gọi renderer |
| `src/modules/export/export-pdf.ts` | MODIFY | Client xin ticket trước khi tạo PDF, có Print Preview fallback |
| `src/app/api/pdf/__security__/pdf-access.fuzz.test.ts` | NEW | Test suite cho ticket verification, hash mismatch, expiration & anti-replay |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Ticket issuer công khai vô điều kiện chỉ thêm bước hình thức | High | Issuer phải gắn trusted session/attestation; nếu chưa có, default-off remote PDF. |
| Replay store tăng dependency | Med | Nonce TTL trong Redis hiện có; job digest + short expiry; fail-closed production. |
| Local-first UX bị phụ thuộc mạng hơn | Med | Capability chỉ cho remote export; preview/HTML/Print Preview local giữ nguyên. |
| CSRF checks phá non-browser clients | Low | Surface này browser-only; media/Fetch Metadata contract được test/document. |

## 6. Verification Plan

- Matrix no/invalid/expired/replayed/wrong-audience ticket; assert renderer mock không được gọi.
- Oversized/wrong content-type/cross-site request fail trước body consumption/admission.
- External network probe tới renderer/direct origin bị từ chối; same-origin happy path tạo `%PDF-` và không lưu nội dung.

## 7. Status

`DONE (2026-07-25, re-verified after REOPEN):`

Review 2026-07-25 (`w25_fix-all-bugs.md` §1.1.6, §1.2) tìm thấy gap trong bản DONE trước: issuer `/api/pdf/ticket` là public anonymous endpoint — "có signed ticket" không tạo ra authorization boundary thật vì bất kỳ ai cũng issue được; ticket được chấp nhận cả từ query string (`?ticket=`), lộ vào log/history/Referer; `verifyPdfTicket` gộp verify+claim-nonce trong MỘT lần gọi và chạy TRƯỚC rate-limit, khiến probe/replay traffic né được quota; replay cache là `Map` in-process (không an toàn multi-instance); secret ký ticket fallback `PDF_TICKET_SECRET -> RATE_LIMIT_SECRET -> UPSTASH_REDIS_REST_TOKEN -> hardcoded string`; `nbf` có trong payload nhưng không verify; thiếu `aud`/`iss`/`ver`; route đọc toàn bộ `request.text()` trước khi verify.

Re-fix 2026-07-25:
- **Public issuer đóng theo mặc định.** `PDF_REMOTE_ENABLED=false` mặc định (J); `/api/pdf/ticket` trả `404` khi tắt. Khi bật, issuer yêu cầu `PDF_TICKET_TRUSTED_ISSUER_MODE=upstream-identity` + header `X-Verified-Identity` do trusted reverse-proxy đặt (cùng mô hình trust như `TRUSTED_PROXY_MODE` ở B) — anonymous vẫn được phép NGOÀI production (dev/test) nhưng `sub` bị gắn `"anonymous"` để không nhầm với capability đã xác thực.
- **Tách verify khỏi claim.** `pdf-access.ts` chia `verifyTicketEnvelope()` (chữ ký + `ver`/`iss`/`aud`/`exp`/`nbf`/TTL — không đọc body, không claim nonce) và `claimTicketNonce()` (atomic, gọi async ngay trước khi forward renderer). `/api/pdf/route.ts` theo đúng thứ tự 8 bước ở §4.3: feature/method/media/origin → verify envelope → rate-limit → đọc body qua stream (byte cap 25MiB + idle 10s/total 20s deadline) → so `htmlHash`/`jobId` → claim nonce → gọi renderer → log cause code only.
- **Ticket payload đầy đủ.** Thêm `ver`, `iss`, `aud`, `sub`, `sizeClass`, `iat`; `nbf` được verify (kèm clock-skew 10s); TTL tối đa 600s (`exp - iat`); token ký `${version}.${payloadB64}.${hmac}` — `PDF_TICKET_SECRET_VERSION` mismatch bị từ chối tường minh (`SECRET_VERSION_MISMATCH`), hỗ trợ rotation.
- **Secret dedicated, fail-closed.** Bỏ toàn bộ fallback chain; production thiếu `PDF_TICKET_SECRET` → throw (không silently ký bằng secret đoán được); dev/test dùng `DEV_FALLBACK_SECRET` gắn nhãn rõ ràng.
- **Nonce claim atomic, multi-instance-safe.** `claimTicketNonce()` dùng Upstash Redis `SET NX EX` khi có credentials (cả dev lẫn prod); production không có Redis → fail-closed (`503`, không fallback Map); dev/test không Redis → in-memory Map (documented giới hạn single-instance).
- **Chỉ nhận ticket ở header.** Bỏ hẳn `searchParams.get("ticket")`; chỉ `x-pdf-ticket` hoặc `Authorization: Bearer`.
- **Fetch Metadata policy tường minh.** `Sec-Fetch-Site` vắng mặt bị từ chối trong production (trước đây ngầm coi là trusted); lenient ngoài production để không phá dev/test client không phải browser.
- **Lỗi public generic.** Không còn trả `ticketResult.reason`/cause code cho client; chỉ log cause code phía server (`console.log` structured, không log token/HTML/PDF).
- Test: `pdf-access.fuzz.test.ts` (10 test — issuer disabled/enabled/prod-anonymous-denied/trusted-identity/envelope tamper/version-rotate/expired/malformed), `route.test.ts` (11 test — bao gồm query-string-ticket-rejected, remote-disabled-503, replay dùng địa chỉ cô lập để không lẫn rate-limit bucket với test khác). 27/27 xanh.

