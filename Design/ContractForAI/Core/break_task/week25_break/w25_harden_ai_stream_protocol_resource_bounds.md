# Contract For AI — W25 Harden (D): AI Stream Có Giới Hạn RequestId · Parser Buffer · Event/Output · Error Redaction

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** API security / streaming reliability — **P0**.
> **Findings:**
> - **S1** (🔴) — `requestId` client gửi chưa cap đáng kể và được lặp trong nhiều NDJSON events; input gần body cap có thể gây response amplification.
> - **S2** (🔴) — OpenAI/Anthropic line tail và Gemini incomplete JSON có thể tăng không giới hạn; parse lặp trên buffer lớn tạo CPU/memory amplification.
> - **S3** (🔴) — Stream producer async có thể đọc provider nhanh hơn downstream; chưa có hard cap upstream bytes, event count, delta bytes, suggestion bytes và buffered bytes.
> - **S4** (🟠) — Một số nhánh trả `error.message` ra public event/response, có thể lộ chi tiết provider/nội bộ.
> **Builds on:** W24-N true streaming, `AiStreamEvent`, `HttpAiAdapter`, BYO-key route.
> **Sources:** source review 2026-07-22.

---

## 1. Micro-task Target

Biến AI streaming thành protocol hữu hạn và cancelable ở mọi chiều: server sở hữu correlation ID, parser có maximum frame/tail/depth, output/event có budget, downstream backpressure điều khiển upstream read, lỗi public luôn generic.

- **S1 — Correlation ID.** Server sinh UUID canonical. Client ID nếu còn dùng chỉ là bounded token `<=64` ký tự theo allowlist và không được echo mỗi delta; `meta` mang ID, các event sau có thể ngầm thuộc stream hoặc giữ ID fixed-size.
- **S2 — Parser limits.** Per-provider adapter có max line/frame/tail/nesting/total bytes; no-newline/incomplete JSON vượt cap abort ngay; tránh parse toàn buffer O(n²).
- **S3 — Stream budgets.** Cap upstream bytes, decoded chars, events, single delta, total suggestion/usage metadata, pending queue; slow downstream dùng pull/backpressure và cancel reader/provider khi vượt idle/total deadline.
- **S4 — Safe errors/observability.** Public error code+copy generic; server log structured cause/provider/status/duration/bytes với redaction. Không raw body/message/key/prompt/output.

> 🔒 Stale-request guard và explicit Apply giữ nguyên. Partial output không tự ghi editor. Mid-stream error chỉ phát tối đa một terminal event rồi cleanup.

## 2. Scope

### In scope
- `src/app/api/ai/route.ts` + provider parsers (MODIFY): IDs, budgets, backpressure, redaction.
- `src/types/ai.ts`, `HttpAiAdapter` (MODIFY backward-compatible): event correlation/error codes.
- Config validator (MODIFY): positive/ranged AI limits/deadline hierarchy.
- Unit/fuzz/stream tests (NEW/UPDATE): fragmentation, no newline, huge ID, huge frame, slow reader, abort.

### Out of scope
- ❌ Prompt/model catalog, key persistence or provider selection UX.
- ❌ Account billing/quota policy (B).
- ❌ Persist AI output server-side.

## 3. Checklist

- [x] Client cannot make response scale with arbitrary `requestId`; server ID fixed-size.
- [x] Every provider parser rejects boundedly on oversized/incomplete/no-newline input; tail memory stays under declared cap.
- [x] Slow/aborted client stops provider reader; queue/buffer/event/output budgets are enforced and measured.
- [x] Public errors contain allowlisted code/copy only; raw `Error.message` absent from response/events.
- [x] Fragmented UTF-8/SSE/JSON happy path and usage semantics remain correct.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/app/api/ai/route.ts` | MODIFY | bounded pull/cancel bridge, generic errors, stream budgets |
| `src/app/api/ai/providers/*.ts` | MODIFY | per-provider incremental parser limits (64 KiB line / 128 KiB buffer / 32 depth) |
| `src/types/ai.ts` | MODIFY | fixed ID/error code contract |
| `src/modules/write/ai/adapters/http-adapter.ts` | MODIFY | bounded tail/event validation/cancel (128 KiB client line buffer) |
| `src/app/api/ai/__security__/ai-stream-bounds.fuzz.test.ts` | NEW | stream budgets, parser fuzzing, error redaction tests |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Budget cắt output hợp lệ | Med | Baseline real providers/models; terminal `output_limit` actionable; configurable within validated range. |
| Provider format drift | High | Adapter-specific fixtures + unknown-field tolerance trong cap; fail generic, log safe cause. |
| Backpressure implementation deadlock | High | Pull-based deterministic tests với slow reader/abort tại mọi stage; total deadline safety net. |
| Protocol change phá stale guard | High | Server/client compatibility tests; meta ID canonical; UI never applies stale/partial output. |

## 6. Verification Plan

- Gửi requestId ~body cap: response overhead vẫn fixed/bounded; schema reject hoặc ignore client ID.
- Feed provider chunks từng byte, UTF-8 split, 1 MiB no-newline, Gemini JSON không đóng, event storm; assert bounded reject/time/heap.
- Downstream đọc rất chậm rồi abort: upstream reader signal aborted, no extra events, pending buffers về 0.
- Inject errors chứa secret-like marker: marker không xuất hiện response/log artifact đã redact.

## 7. Status

`DONE (2026-07-25):`
- **S1 Canonical correlation ID**: Client `requestId` được chuẩn hóa `<=64` ký tự theo allowlist; rơi về UUID server-side khi không hợp lệ để chống amplification.
- **S2 Provider parser limits**: Enforce `MAX_OPENAI_LINE_BYTES` (64 KiB), `MAX_ANTHROPIC_LINE_BYTES` (64 KiB), `MAX_GEMINI_BUFFER_BYTES` (128 KiB) và `MAX_GEMINI_BRACE_DEPTH` (32).
- **S3 Stream budgets & client buffer**: Giới hạn `MAX_UPSTREAM_BYTES` (2 MiB), `MAX_TOTAL_DELTA_CHARS` (50,000 chars), `MAX_EVENTS` (2,000), `MAX_SINGLE_DELTA_CHARS` (16,000 chars), và client-side line buffer cap (`MAX_CLIENT_BUFFER_BYTES` 128 KiB). Tự động ngắt provider controller khi client cancel/abort.
- **S4 Public error redaction**: Redact toàn bộ `Error.message` thô/secrets; chỉ xuất bản các mã lỗi chuẩn (`AI_PROVIDER_ERROR`, `AI_STREAM_EXCEEDED`, v.v.).
- Bổ sung bộ fuzzing & security test suite `src/app/api/ai/__security__/ai-stream-bounds.fuzz.test.ts`.

