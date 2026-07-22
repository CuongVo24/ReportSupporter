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

- [ ] Request PDF không capability/expired/replayed bị chặn trước body/render slot.
- [ ] Browser không bao giờ thấy renderer service token.
- [ ] Content-Type/size/method/Fetch Metadata sai fail nhanh bằng generic response.
- [ ] Renderer chỉ reachable từ gateway/private network; direct external probe fail.
- [ ] Feature chưa configured → remote PDF off + Print Preview hoạt động, không fail-open.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/api/pdf/route.ts` | MODIFY | capability/admission ordering |
| `src/app/api/pdf/ticket/route.ts` hoặc server action | NEW | issuer ngắn hạn, không persist content |
| `src/lib/server/pdf-access.ts` | NEW | sign/verify/replay policy |
| `src/modules/export/export-pdf.ts` | MODIFY | ticket + fallback |
| deployment config/docs | MODIFY | private topology/default-off |

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

`PROPOSED — cần approve access model; mặc định an toàn là remote PDF disabled nếu chưa có issuer đáng tin.`

