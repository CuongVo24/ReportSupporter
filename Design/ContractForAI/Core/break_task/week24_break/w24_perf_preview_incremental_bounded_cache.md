# Contract For AI — W24 Perf (J): Preview Incremental · Coalesce Stale Work · Cache Hữu Hạn · Không Clone Toàn Asset Mỗi Lần Gõ

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Runtime performance/memory; phụ thuộc I.
> **Findings:**
> - **S1** (🔴) — `pipeline-client.ts` có `cache = new Map()` không eviction. Mỗi edit tạo `revisionHash/cacheKey` mới; response giữ AST của nhiều section nên phiên soạn dài có thể tăng heap không giới hạn.
> - **S2** (🟠) — mỗi debounce, `PreviewPane` hash toàn `previewSections`, gửi toàn `sections` + toàn `assets` base64 qua `postMessage`; structured clone 5 MiB assets lặp lại dù chỉ đổi vài ký tự.
> - **S3** (🟠) — pipeline parse active content trong `parsedParts` rồi lại parse active section trong `parsedSections`; mọi section được parse lại để tính heading/caption toàn cục. Stale discard chỉ bỏ **response**, không ngăn worker tính hàng loạt request cũ đã queue.
> - **S4** (🟠) — main thread `JSON.parse(JSON.stringify(part.ast))` rồi inject/normalize/render HTML. Worker đã parse nhưng phần clone+render nặng vẫn ở UI thread.
> **Builds on:** I, W22 preview perf, W30 worker contract. Contract này **mở rộng** W30 từ “caller-thread fake gate” sang pipeline dữ liệu thật.
> **Sources:** production profiling 2026-07-18 + `PreviewPane.tsx:103-326` + `pipeline-client/core` hiện tại.

---

## 1. Micro-task Target

Sau một lần gõ, chỉ dữ liệu thay đổi được truyền/parse/render; request stale chưa bắt đầu không được tiêu CPU; cache có budget rõ; main thread nhận output gần render-ready thay vì deep-clone AST lớn.

- **S0 — Profile protocol trước.** Ghi riêng transfer/clone, worker queue, parse, main-thread transform/render và cache heap trên fixture 40 section + 5 MiB assets. Không đổi protocol nếu profiler bác bỏ bottleneck.
- **S1 — Coalesce latest.** Mỗi `projectId:operation` tối đa một in-flight + một latest queued; request queued cũ bị reject stale trước `postMessage`. Check/format explicit không bị preview spam làm starvation; ưu tiên được định nghĩa.
- **S2 — Revision/delta protocol.** Worker giữ section AST theo `{sectionId, revision, assetVersion}`; client gửi changed sections và asset manifest/delta thay vì full base64 mỗi edit. Asset bytes chỉ gửi khi asset thêm/đổi và chỉ asset được tham chiếu.
- **S3 — Bounded cache.** Cache LRU theo count + estimated bytes hoặc đơn giản “last successful per project/operation”; clear khi đóng project/reset/circuit. Không giữ mọi revision lịch sử.
- **S4 — Render-ready response.** Chuyển clone/inject/normalize/render có lợi sang worker và trả HTML/Mermaid parts + TOC/caption metadata; nếu parity buộc AST ở main, dùng immutable transform/targeted clone và chứng minh main-thread cost dưới budget.

> 🔒 Preview/HTML/PDF phải parity về heading, caption, TOC/LOF/LOT, KaTeX, missing-image placeholder và QR.
> 🔒 Không cache mutable AST rồi mutate xuyên request; cache key phải gồm mọi input ảnh/format/evidence ảnh hưởng output.

## 2. Scope

### In scope
- `src/types/pipeline.ts` hoặc canonical pipeline types (MODIFY): protocol revision/delta/render result.
- [src/modules/pipeline/pipeline-client.ts](src/modules/pipeline/pipeline-client.ts) (MODIFY): coalescing, LRU/budget, asset delta lifecycle.
- [src/modules/pipeline/pipeline.worker.ts](src/modules/pipeline/pipeline.worker.ts), `pipeline-core.ts` (MODIFY): per-section cache + render-ready work.
- [src/components/PreviewPane.tsx](src/components/PreviewPane.tsx) (MODIFY): không hash/send/clone toàn report/asset ở hot path.
- Perf/parity tests (NEW/UPDATE): actual worker, cache growth, transfer bytes, stale queue.

### Out of scope
- ❌ Virtualize trang preview (backlog nếu render DOM vẫn là bottleneck sau contract).
- ❌ Đổi UI/layout hoặc rules checker/export.
- ❌ Persistence IndexedDB (L/M).

## 3. Checklist
- [ ] 100 edit nhanh tạo ≤1 in-flight + 1 queued/operation; request bị supersede không vào worker.
- [ ] Edit section A không structured-clone toàn 5 MiB assets và không parse lại section B..N không đổi.
- [ ] Active section không parse hai lần cho parts/sections; main thread không JSON stringify/parse AST lớn.
- [ ] Cache giữ trong declared budget và giảm khi project unmount/reset; heap plateau qua 1.000 edits.
- [ ] Pixel/semantic parity preview-export + heading/caption/QR/missing-image tests xanh.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/types/pipeline.ts` | MODIFY | init/update/delta + render-ready result |
| `src/modules/pipeline/pipeline-client.ts` | MODIFY | scheduler + bounded cache |
| `src/modules/pipeline/pipeline-core.ts` | MODIFY | revision cache + single parse |
| `src/components/PreviewPane.tsx` | MODIFY | consume render-ready data |
| `src/modules/pipeline/pipeline-performance.test.ts` | REPLACE/UPDATE | real work, not empty fake AST |

> **Import boundary:** không thêm state/cache library; protocol serializable, worker-safe.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Incremental cache trả stale khi format/evidence/assets đổi | High | Explicit version vector + invalidation matrix tests. |
| Worker AST mutation làm drift request sau | High | Immutable/clone-on-write ở boundary; parity property tests. |
| Scheduler làm explicit Check/Export đói | High | Priority/fairness contract; preview coalesce, command jobs không bị thay thế. |
| Protocol phức tạp khó rollback | Med | Feature flag/protocol version; giữ full-request fallback một release. |

## 6. Verification Plan
- Fixture 40 section/5 MiB assets: gõ 100 ký tự nhanh; thu postMessage bytes, parse count/section, worker queue depth, long tasks, heap trước/sau.
- 1.000 edit luân phiên 2 section: cache/heap phải plateau trong budget; đóng project clear cache.
- Đổi format/evidence/asset cùng độ dài: invalidation đúng, không stale hình/TOC/caption.
- So sánh HTML normalized + screenshot preview trước/sau và artifact HTML/PDF trên fixture Mermaid/math/table/image/QR.

## 7. Status

`PROPOSED — phụ thuộc I và baseline O; chưa thi công.`

