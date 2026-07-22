# Contract For AI — W24 Perf (P): Writing Stats/Report Health Không Quét Toàn Báo Cáo Sau Mỗi Edit

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Runtime main-thread performance; finding bổ sung từ source review.
> **Findings:**
> - **S1** (🟠) — `reportWritingStats` phụ thuộc `bundle.project.sections`; mỗi edit tạo array mới rồi `computeWritingStats` join toàn markdown và chạy nhiều regex trên toàn report, dù chỉ một section đổi.
> - **S2** (🟠) — `computeReportHealth` chạy sau debounce 300ms trên mọi bundle change. Evidence coverage lặp `sectionHasEvidenceSignal` hai lượt và mỗi lượt là scan sections × evidence × normalize/include string.
> - **S3** (🟡) — health badge/stats không cần đồng bộ trong cùng frame với keystroke, nhưng hiện cùng cạnh tranh main thread với preview/autosave. Existing reducer P95 gate không đo các hàm này.
> **Builds on:** J preview incremental, O actual browser gate, `writing-stats.ts`, `report-health.ts`.
> **Sources:** source review 2026-07-19; cần profiler O xác nhận tỷ trọng trước khi sửa.

---

## 1. Micro-task Target

Cập nhật stats/health theo **delta section/evidence đã chuẩn hóa**, không nối/quét toàn report trên mỗi edit; kết quả phải bit-for-bit tương đương implementation hiện tại và chạy ngoài critical keystroke frame.

- **S0 — Measure before change.** Instrument duration/call count của `computeWritingStats` và `computeReportHealth` trên 40/100 section + evidence. Nếu cost không đáng kể sau J, giữ implementation và đóng finding bằng evidence, không thêm cache vô ích.
- **S1 — Per-section stats cache.** Cache `WritingStats` theo `{sectionId, revision/contentHash}`; aggregate bằng cộng delta section đổi. Không join toàn report; active-section stat dùng cùng cache.
- **S2 — Evidence index.** Normalize evidence signals một lần khi evidence đổi; tính coverage một lượt/section, tái dùng count cho score/detail. Cache theo section revision + evidenceVersion.
- **S3 — Scheduling.** Health update có deferred/idle priority và latest-only semantics; không chạy nhiều timer/job stale. UI giữ last-known value với trạng thái cập nhật nếu cần.
- **S4 — Pure parity tests.** Giữ baseline implementation làm oracle trong test cho fixtures ngẫu nhiên/edge Markdown/Unicode; không đổi công thức/score/microcopy.

> 🔒 Đây là tối ưu, không đổi meaning của words/chars/readingMinutes/health score/weakestSection.
> 🔒 Cache hữu hạn theo project hiện tại và clear khi project đổi; không thêm memory leak mới.

## 2. Scope

### In scope
- [src/modules/write/writing-stats.ts](src/modules/write/writing-stats.ts) (MODIFY): section stats + aggregate helper.
- [src/modules/check/report-health.ts](src/modules/check/report-health.ts) (MODIFY): normalized evidence index/single pass/incremental inputs.
- [src/components/Workspace.tsx](src/components/Workspace.tsx) (MODIFY): revision caches/deferred latest scheduling.
- Unit/property/performance + O browser metrics (UPDATE).

### Out of scope
- ❌ Đổi checker/readiness rules hoặc evidence requirements.
- ❌ Chuyển mọi React derive sang worker khi profiler không cần.
- ❌ Preview/pipeline protocol (J).

## 3. Checklist
- [ ] Edit một section chỉ recompute stats/coverage cho section đó; evidence unchanged không re-normalize.
- [ ] 100 edit nhanh tạo một latest health update, không 100 full scans.
- [ ] Kết quả incremental bằng baseline cho empty/Unicode/code/table/link/image + nhiều evidence.
- [ ] Cache clear project switch/unmount; memory bounded.
- [ ] Trên fixture 100 section/100 evidence, derived-metric main-thread P95 nằm dưới budget đã chốt (target ban đầu <8ms/update) và không tạo long task.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `src/modules/write/writing-stats.ts` | MODIFY | per-section + aggregate delta |
| `src/modules/check/report-health.ts` | MODIFY | pre-normalized evidence/single pass |
| `src/components/Workspace.tsx` | MODIFY | cache + deferred latest update |
| `src/modules/workspace/derived-metrics-performance.test.ts` | NEW | parity + representative cost |

> **Import boundary:** React primitives/helpers thuần; không thêm memoization library.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Cache invalidation sai làm stats/health stale | High | Revision + evidenceVersion explicit; oracle/property tests; project-scoped lifecycle. |
| Deferred health gây UI trễ khó hiểu | Low | Last-known value + subtle updating state; bounded max delay. |
| Regex behavior đổi khi tách section | Med | Baseline aggregate có `\n\n` boundary; parity fixtures tại ranh giới code/link. |
| Tối ưu không đáng cost phức tạp | Med | S0 exit path: profiler dưới threshold thì không implement S1–S3. |

## 6. Verification Plan
- Generate fixtures 1/40/100 section với Unicode tiếng Việt, code fences, links/images; so output baseline vs incremental sau chuỗi edit/add/delete/reorder.
- 100 evidence × 100 section: đổi một ký tự active section; đo call count/normalize count/duration, không scan lại evidence strings nhiều lượt.
- Gõ 100 ký tự nhanh trong production browser cùng preview: long-task/input-preview KPI không xấu; health cuối khớp bundle cuối.
- Switch project/reload: cache cũ không rò kết quả, heap trở về budget.

## 7. Status

`PARTIAL / IN PROGRESS (2026-07-21) — S0 đo xong (ROI xác nhận), S3 thi công an toàn; S1/S2 cache defer:`

**S0 Measurement (DONE)** — `src/modules/workspace/derived-metrics-performance.test.ts` (NEW): microbench advisory đo trên 40/100 section + evidence:
- `computeWritingStats`: **rẻ** — median ~4ms(40) / ~7ms(100). → **không cần** per-section cache (S1) lúc này; đóng theo exit-path "không thêm cache vô ích".
- `computeReportHealth`: **hot spot** — median ~14ms(40), **~67ms(100)**, p95 ~134ms. → vượt ngưỡng S0, **đáng tối ưu**.

**S3 Scheduling (DONE)** — `Workspace.tsx`: health chuyển từ `setTimeout(300)` chạy thẳng sang **debounce 300ms → `requestIdleCallback`** (fallback setTimeout), latest-only, giữ giá trị cũ trên màn tới khi có bản mới. Không đổi công thức → **không rủi ro parity**; chỉ dời long task 67–134ms khỏi frame keystroke/preview.

**S1/S2 algorithmic cache (DEFER)** — per-section stats cache + evidence single-pass index sẽ cắt chính chi phí 67ms của health, NHƯNG chạm công thức `report-health.ts` → rủi ro parity (lock "bit-for-bit tương đương"). Cần: (a) profiler O production xác nhận tỷ trọng health vs preview/autosave + chốt budget thật (<8ms/update), (b) oracle/property tests giữ baseline làm chân lý cho fixture Unicode/code/link/table/nhiều evidence. Chỉ thi công khi có hai điều kiện đó.

> Test regression-guard (loose ceiling) + S3 idle-defer bảo vệ frame ngay bây giờ; không đánh DONE cho tới khi S1/S2 (nếu O xác nhận) có parity tests.

