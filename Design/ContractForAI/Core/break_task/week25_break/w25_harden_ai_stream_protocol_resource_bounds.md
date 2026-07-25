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

`DONE (2026-07-25, re-verified after REOPEN):`

Review 2026-07-25 (`w25_fix-all-bugs.md` §1.1, §1.2) tìm thấy gap trong bản DONE trước: `requestId` client-supplied (khi hợp lệ theo allowlist) vẫn được server ECHO lại làm correlation ID chính thức — không phải "server luôn tự sinh"; `requestId` bị lặp lại trên MỌI delta event thay vì chỉ meta/terminal; bridge dùng greedy `while(true)` trong `start()` đọc toàn bộ upstream bất kể downstream có đọc hay không; khi một delta vượt `MAX_SINGLE_DELTA_CHARS`, code TRUNCATE rồi vẫn emit như một delta bình thường (không phải lỗi); parser trả `null` cho JSON malformed và route SILENTLY bỏ qua (không phân biệt được "dòng trống hợp lệ" với "JSON hỏng"); không xử lý dòng cuối thiếu `\n` ở EOF; không có idle deadline riêng; decoder `fatal:false` không reject UTF-8 hỏng.

Re-fix 2026-07-25:
- **Correlation ID server-canonical tuyệt đối.** `requestId = crypto.randomUUID()` luôn luôn, không đọc `record.requestId` từ client nữa (field vẫn được client gửi nhưng bị bỏ qua hoàn toàn). `AiStreamEvent` (`src/types/ai.ts`) đổi variant `delta` bỏ hẳn field `requestId` — chỉ còn ở `meta`/`done`/`error`. Xác nhận `http-adapter.ts` (client) chưa từng đọc `event.requestId` nên đổi type không phá client.
- **Pull-aware bridge thật.** Viết lại toàn bộ stream construction: `pull()` chỉ đọc từ upstream khi runtime cần thêm dữ liệu. **Phát hiện + vá một bug ReadableStream nghiêm trọng trong lúc làm**: một `pull()` call xử lý xong một chunk upstream nhưng KHÔNG enqueue gì (vd. frame chỉ có `usage`, không có `delta`) khiến stream treo vĩnh viễn — runtime không tự gọi lại `pull()` nếu `desiredSize` không đổi kể từ lần enqueue trước (đã tái hiện bug này bằng Node thuần, không qua vitest, để xác nhận đây là hành vi ReadableStream thật chứ không phải lỗi test). Sửa bằng vòng lặp NỘI BỘ trong `pull()`: tiếp tục đọc upstream cho tới khi enqueue được ít nhất một event, gặp EOF, hoặc lỗi/limit — mới return.
- **Không truncate-rồi-tiếp-tục.** `emitDelta()` kiểm `deltaText.length > MAX_SINGLE_DELTA_CHARS` TRƯỚC khi enqueue; vượt giới hạn → `AI_STREAM_EXCEEDED` terminal error ngay, không emit delta đã cắt như thành công.
- **Malformed event là typed protocol error.** `parseOpenAiLine`/`parseAnthropicLine`/`parseGeminiChunk` đổi return type: `null` chỉ cho case hợp lệ-bỏ-qua (dòng trống, không phải `data:`, `[DONE]`); JSON.parse thất bại trả `{ malformed: true }` — route abort với `AI_PROTOCOL_ERROR` thay vì im lặng bỏ.
- **EOF salvage đúng theo từng provider.** Dòng/object cuối thiếu `\n` được thử parse một lần nữa ở `finalize()` trước khi coi là lỗi. Gemini cần xử lý riêng: `extractJsonObjects()` trả thêm `incomplete` (true chỉ khi buffer kết thúc GIỮA một object `{...}` chưa đóng) — trailing `]`/`,`/whitespace của định dạng mảng Gemini không còn bị coi nhầm là lỗi (bug phát hiện qua test suite, đã sửa).
- **Idle + total deadline tách biệt.** `pull()` race `reader.read()` với timer `STREAM_IDLE_TIMEOUT_MS` (20s, reset mỗi lần có tiến triển hợp lệ) bên cạnh `AI_TIMEOUT_MS` (60s) tổng đã có từ trước.
- **UTF-8 strict.** `TextDecoder(..., {fatal:true})`; decode lỗi giữa chừng → `AI_PROTOCOL_ERROR`; flush cuối stream (`decoder.decode()` không tham số) bắt byte thừa chưa giải mã.
- **Terminal đúng một lần.** `finishTerminal()`/`abortWithError()` đều check `terminalSent` trước khi enqueue+close; mọi exit path (limit, malformed, idle timeout, abort, EOF sạch) đi qua chung một điểm.
- Giữ nguyên S2 (parser byte/depth limits) và S4 (redact lỗi công khai) từ bản trước — không đổi.
- Test: `route.test.ts` (9/9, đã cập nhật kỳ vọng delta không có `requestId`), `ai-stream-bounds.fuzz.test.ts` (11/11 — mới: correlation ID không echo client, pull-aware không đọc hết upstream ngay từ đầu (đo số lần gọi `reader.read()` upstream so với số lần consumer đọc), malformed frame → `AI_PROTOCOL_ERROR` đúng một terminal event, no-newline trailing line được salvage, single-delta-overflow → `AI_STREAM_EXCEEDED` không truncate). `src/modules/write/ai` (48 test, client adapter) xanh không đổi.

