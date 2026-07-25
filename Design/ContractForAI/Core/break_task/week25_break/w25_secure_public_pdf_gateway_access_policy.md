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

`DONE (2026-07-25):`
- **S1 Render Capability Ticket**: Triển khai `src/lib/server/pdf-access.ts` tạo ticket capability ngắn hạn (5 phút) băm HMAC-SHA256 kèm `jobId`, `exp` và `htmlHash`.
- **S2 Ticket Issuer Endpoint**: Xây dựng `/api/pdf/ticket` phát ticket cho cùng origin (`Sec-Fetch-Site: same-origin`), áp rate limit độc lập `consumeTicketRateLimit`.
- **S3 Admission Order**: `/api/pdf` bắt buộc kiểm tra ticket trước khi đọc full body lớn hoặc tiêu tốn slot renderer/rate limit. Từ chối HTTP 403 nếu thiếu, hết hạn, hoặc bị replayed (anti-replay violation).
- **S4 Client Flow & Fallback**: Client `export-pdf.ts` tự động xin ticket từ `/api/pdf/ticket` trước khi gọi `/api/pdf`, đồng thời tự động đề xuất Print Preview nếu dịch vụ remote không khả dụng.
- Bổ sung bộ kiểm thử tự động `src/app/api/pdf/__security__/pdf-access.fuzz.test.ts`.

