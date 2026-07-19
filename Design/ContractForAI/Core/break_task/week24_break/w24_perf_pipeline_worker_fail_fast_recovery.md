# Contract For AI — W24 Perf (I): Pipeline Worker Fail-Fast · Reject Pending · Tự Phục Hồi Không Treo Preview

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Performance/reliability runtime — sửa “treo” bị hiểu nhầm là “chậm”.
> **Findings:**
> - **S1** (🔴) — `pipeline-client.ts` chỉ lắng nghe `message`; không có `error`, `messageerror` hay timeout. Worker crash làm Promise trong `pending` không resolve/reject, UI có thể ở trạng thái đang render vô hạn.
> - **S2** (🔴) — production profiling đã tái hiện `ReferenceError: document is not defined` từ dependency browser-DOM trong worker graph (`decode-named-character-reference/index.dom.js`). “Có Worker” không đồng nghĩa worker chạy được.
> - **S3** (🟠) — worker top-level import/khởi tạo fail trước khi handler chạy nên `executePipelineRequest` không thể đóng gói lỗi thành `ok:false`; `resetPipelineClientForTests` cũng chỉ `pending.clear()` mà không reject caller đang đợi.
> **Builds on:** W30 worker performance contract (DONE nhưng gate dùng fake worker), `pipeline-client.ts`, `pipeline.worker.ts`, `pipeline-core.ts`.
> **Sources:** production profiling 2026-07-18 + CodeGraph callers (`PreviewPane`, `Workspace`) + source verification 2026-07-19.

---

## 1. Micro-task Target

Mọi request pipeline phải kết thúc bằng success, stale, timeout hoặc lỗi có thể phục hồi — **không có Promise treo**. Worker graph phải thật sự chạy trong Chromium production; crash được cô lập, pending được reject, và client phục hồi có kiểm soát.

- **S1 — Worker manager.** Gom create/listeners/terminate vào manager; attach `message/error/messageerror`; mỗi failure atomically đánh dấu generation chết, reject toàn pending của generation đó, clear timers, terminate worker.
- **S2 — Bounded timeout.** Timeout theo operation/payload class (preview ngắn hơn check/format), có error type riêng; timeout cleanup pending/latest và đưa UI về trạng thái có retry.
- **S3 — Recovery/circuit breaker.** Cho phép một worker generation mới ở request kế; nếu crash lặp lại thì circuit-open trong phiên và dùng fallback main-thread **có yield + cảnh báo** hoặc fail nhanh tùy payload. Không respawn loop trên mỗi keystroke.
- **S4 — Worker-safe graph.** Loại browser-DOM/barrel import khỏi đường `pipeline.worker -> pipeline-core`; production browser test phải import và xử lý markdown thật, không chỉ mock Worker.

> 🔒 Không nuốt lỗi thành preview rỗng mà không báo. UI giữ nội dung cuối thành công và hiện trạng thái “Xem trước tạm gián đoạn · Thử lại”.
> 🔒 Fallback không được đóng băng main thread với report lớn; payload vượt ngưỡng thì fail-fast/retry worker thay vì chạy đồng bộ mù.

## 2. Scope

### In scope
- [src/modules/pipeline/pipeline-client.ts](src/modules/pipeline/pipeline-client.ts) (MODIFY): manager/generation, listeners, timeout, reject/cleanup, circuit breaker.
- [src/modules/pipeline/pipeline.worker.ts](src/modules/pipeline/pipeline.worker.ts), `pipeline-core.ts` và imports trực tiếp (MODIFY): worker-safe dependency boundary.
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx), [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY nhẹ): visible recoverable state/retry; giữ last-known-good.
- Unit + Playwright production test actual Worker (NEW/UPDATE): error/messageerror/timeout/top-level crash/recovery.

### Out of scope
- ❌ Incremental payload/cache/coalescing (J).
- ❌ Đổi checker/export rules.
- ❌ Giấu lỗi bằng cách luôn chạy pipeline trên main thread.

## 3. Checklist
- [ ] `error`, `messageerror`, timeout và reset đều reject mọi affected pending đúng một lần; `pending.size` về 0.
- [ ] Worker crash không xóa last-known-good preview và không để spinner vô hạn; retry có feedback.
- [ ] Một recovery attempt; crash lặp mở circuit, không tạo worker storm.
- [ ] Production Chromium worker parse markdown thật không có `document is not defined`.
- [ ] Check/format/preview caller đều xử lý error type; stale discard giữ nguyên. Unit + browser gate xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/pipeline/pipeline-client.ts` | MODIFY | `PipelineWorkerManager`, timeout/error types |
| `src/modules/pipeline/pipeline.worker.ts` | MODIFY | safe bootstrap/error envelope nếu khả thi |
| `src/modules/pipeline/pipeline-core.ts` | MODIFY nhẹ | import worker-safe trực tiếp |
| `src/components/PreviewPane.tsx` | MODIFY | last-good + recoverable state |
| `e2e/pipeline-worker.spec.ts` | NEW | actual production worker proof |

> **Import boundary:** worker path không import module có DOM side effect/barrel rộng.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Reject toàn pending làm stale request hiện toast dồn | Med | Phân biệt stale/cancel/fatal; một UI notice theo generation. |
| Fallback main-thread gây long task | High | Payload threshold + scheduler yield; browser perf gate bắt long task. |
| Timeout quá ngắn trên máy yếu | Med | Dựa P95/P99 production fixture; timeout cấu hình/test được. |
| Respawn che lỗi dependency | Med | Metric generation/crash cause; browser gate phải fail nếu worker không bao giờ thành công. |

## 6. Verification Plan
- Fake Worker phát `error` trước message: Promise reject trong deadline, pending=0, last preview giữ nguyên, UI có Retry.
- Fake Worker phát `messageerror`, không trả message, reset trong lúc pending: từng nhánh cleanup đúng, không unhandled rejection.
- Production build + Chromium: 40 trang Markdown/GFM/math qua **actual worker**, response `ok:true`, console không có `document` error.
- Ép crash hai lần: chỉ một respawn, circuit mở; gõ tiếp không tạo thêm worker/Promise treo.

## 7. Status

`PROPOSED — ưu tiên ngay sau PDF blocker; chưa thi công.`

