# Contract For AI — W24 Perf (N): AI Stream Thật Từ Provider Đến UI · Backpressure · Abort Xuyên Suốt

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Perceived performance / serverless reliability; không phải blocker PDF.
> **Findings:**
> - **S1** (🟠) — `/api/ai` gọi endpoint non-streaming, `await response.json()` toàn output (timeout 60s), rồi cắt suggestion thành event `delta` 512 ký tự. NDJSON hiện tại là **giả stream**: first token chỉ tới sau khi provider hoàn tất.
> - **S2** (🟠) — `HttpAiAdapter` lại `await response.text()` rồi mới split dòng; kể cả server stream thật, UI vẫn buffer toàn response và `onEvent` không chạy sớm.
> - **S3** (🟠) — timeout 60s có thể chạm/vượt serverless function limit; client AbortController có nhưng cancellation cần được chứng minh tới provider body reader. Sau khi headers đã gửi, lỗi phải đi qua event chứ không thể đổi HTTP status.
> **Builds on:** AI client-key route, `AiStreamEvent` protocol, `AiAssistBar` stale-request/AbortController.
> **Sources:** review tổng thể 2026-07-19 + route/adapter source verification.

---

## 1. Micro-task Target

Giữ public NDJSON `meta/delta/done/error` nhưng phát `delta` ngay khi provider có token, đọc incremental ở browser, tôn trọng backpressure/cancel và không giữ full suggestion ở server.

- **S1 — Provider stream adapters.** OpenAI/Anthropic/Gemini dùng streaming API chính thức; parser riêng xử lý SSE/JSON fragments, keepalive, usage/final event. Không ràng model name vào parser.
- **S2 — NDJSON bridge.** Route trả `ReadableStream`; encode từng event với requestId; no-cache/no-transform; khi provider lỗi sau headers gửi `error` rồi close. API key/provider body không log.
- **S3 — Incremental client reader.** `HttpAiAdapter` dùng `response.body.getReader()` + `TextDecoder(stream:true)`, giữ tail line giữa chunks, gọi `onEvent` ngay; `response.text()` chỉ fallback cho runtime không có body.
- **S4 — Abort/backpressure/timeouts.** Client signal cancel reader/fetch/provider; route không đọc nhanh vô hạn khi downstream chậm. Dùng connect/idle/total deadline phân biệt thay một timeout mù.

> 🔒 Stale response/requestId protection giữ nguyên; event của request cũ không ghi vào editor.
> 🔒 Không đổi client-key security, quota/rate limit hoặc log prompt/output.

## 2. Scope

### In scope
- [src/app/api/ai/route.ts](src/app/api/ai/route.ts) (MODIFY/refactor): provider streaming adapters + NDJSON stream.
- [src/modules/write/ai/adapters/http-adapter.ts](src/modules/write/ai/adapters/http-adapter.ts) (MODIFY): incremental decoder/cancel.
- `src/types/ai.ts` (MODIFY nếu cần): protocol error/usage semantics nhưng backward compatible.
- Route/adapter/UI tests (UPDATE): fragmented chunks, mid-stream error, usage, abort, stale request.

### Out of scope
- ❌ Đổi prompt/action/model catalog hoặc provider key storage.
- ❌ Streaming trực tiếp từ browser tới provider (vẫn qua same-origin proxy).
- ❌ Persist prompt/output ở server.

## 3. Checklist
- [ ] `delta` đầu tới client trước provider stream kết thúc; UI hiển thị tiến dần, không `response.text()` hot path.
- [ ] Parser đúng khi JSON/SSE/UTF-8 bị cắt ở mọi ranh giới chunk; usage ở `done` đúng/estimated fallback.
- [ ] Abort từ UI đóng provider fetch/reader nhanh; không tiếp tục tính/buffer event.
- [ ] Mid-stream provider error thành một `error` event actionable rồi close; requestId luôn đúng.
- [ ] First-token latency + peak server heap cải thiện; rate-limit/security tests giữ xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/api/ai/route.ts` | MODIFY | streaming provider bridge |
| `src/app/api/ai/providers/*.ts` | NEW (khuyến nghị) | parser per provider, giới hạn file |
| `src/modules/write/ai/adapters/http-adapter.ts` | MODIFY | incremental NDJSON reader |
| `src/app/api/ai/route.test.ts` | UPDATE | stream timing/chunk/error/abort |
| `src/modules/write/ai/adapters/http-adapter.test.ts` | UPDATE | fragmented line decoder |

> **Import boundary:** Web Streams primitives; không thêm SSE package nếu parser nhỏ/test đủ.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Provider stream formats khác nhau/drift | High | Adapter per provider + recorded synthetic fixtures; fail closed generic error. |
| Error sau headers không có HTTP status | Med | `AiStreamEvent.error` canonical + client throws sau event. |
| Proxy/CDN buffer response | High | `no-transform`, platform staging time-to-first-delta smoke; docs hosting constraint. |
| UI apply partial suggestion khi abort | Med | Chỉ commit qua explicit Apply; stale/requestId guard giữ nguyên. |

## 6. Verification Plan
- Mock provider phát 3 delta cách nhau 200ms: client nhận/onEvent từng delta trước `done`; first delta < provider completion.
- Chunk mỗi byte/giữa multibyte tiếng Việt/giữa hai JSON line: decoder không mất hoặc nhân ký tự.
- Abort sau delta 1: provider signal aborted, không delta 2/3, UI không ghi request stale.
- Staging qua hosting thật: đo TTFD, total duration, function duration, heap; xác nhận proxy không buffer.

## 7. Status

`DONE — true streaming provider→NDJSON→client, backpressure + abort xuyên suốt đã thi công (commit 16bdca0 "feat(ai): implement true streaming with backpressure and abort cancellation").`

