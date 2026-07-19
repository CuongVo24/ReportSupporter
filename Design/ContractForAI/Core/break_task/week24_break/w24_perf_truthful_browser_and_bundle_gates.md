# Contract For AI — W24 Perf (O): Performance Gate Đo Đường Chạy Thật · Bundle Budget Tính Cả Dynamic Transitive Chunks

> **Lane:** Core / break_task / week24_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Test/CI observability — **keystone cho mọi contract perf F–P**.
> **Findings:**
> - **S1** (🔴) — `pipeline-performance.test.ts` dùng `PerformanceWorker` giả, trả AST rỗng; mốc `<200ms` chỉ đo structuredClone/microtask, không chạy worker bundle/parse/render thật và không thể bắt `document is not defined`.
> - **S2** (🔴) — `workspace-performance.test.ts` chỉ dispatch reducer `active-section-changed`; không mount Workspace, load IDB, autosave, preview, stats/health hay xử lý keystroke thật.
> - **S3** (🔴) — `check-bundle-budget.mjs` cộng file trong `app-build-manifest.pages[route]`, bỏ đường dynamic `WorkspaceLoader -> Workspace`; CI báo 104.7 KiB trong khi critical transitive đo ~596.9 KiB gzip.
> - **S4** (🟠) — W30/W36 được đánh dấu DONE/PASS từ các gate trên; đây là green check hợp lệ theo implementation cũ nhưng **không phải bằng chứng user-path performance**.
> **Builds on:** W30 worker/bundle contract, W36 QA report. O không xóa evidence cũ; ghi rõ phạm vi bằng chứng và thay gate đại diện hơn.
> **Sources:** production profiling 2026-07-18 + source verification 2026-07-19.

---

## 1. Micro-task Target

CI phải thất bại khi các lỗi người dùng thật tái xuất: worker crash, editor-ready waterfall, long task khi gõ report lớn, cache/heap tăng, hoặc critical dynamic chunks vượt budget. Mọi số liệu có artifact để so trước/sau.

- **S1 — Production browser perf suite.** Build/start production; seed IndexedDB bằng fixture small và large (`40 sections + 5 MiB assets + 10 snapshots`); dùng actual Chromium/actual Worker. Đo navigation→editor-ready, input→preview committed, long tasks, worker errors, transferred payload/cache counters và heap trend.
- **S2 — Stable thresholds.** Warmup + nhiều sample; gate theo median/P75/P95 phù hợp, cùng fixed CPU/network profile. Tách absolute safety ceiling và regression delta so baseline; không dùng một timing jsdom dễ flake.
- **S3 — Transitive bundle accounting.** Tính ba tập không double-count: initial route, editor-ready critical dynamic graph, optional feature chunks. Theo build manifest/module graph hoặc production resource trace; fail nếu Workspace path vượt budget, không cộng chunk chưa tải.
- **S4 — Evidence/status repair.** JSON/trace artifact chứa commit/env/fixture/KPI. Cập nhật W30/W36 nói rõ gate cũ đo caller/reducer/route manifest; chỉ đánh performance DONE khi gate mới xanh trên CI/staging.
- **S5 — Service stress hooks.** F/G thêm burst/cancel/RSS evidence vào cùng report nhưng không chạy Chromium soak nặng trong unit job.

> 🔒 Không làm gate xanh bằng fake worker, empty AST, tăng budget hoặc bỏ large fixture.
> 🔒 Heap/timing chỉ so khi environment profile tương đương; artifact phải phân biệt local advisory và canonical CI.

## 2. Scope

### In scope
- [src/modules/pipeline/pipeline-performance.test.ts](src/modules/pipeline/pipeline-performance.test.ts) (REPLACE/giữ unit nhỏ nhưng bỏ claim user perf).
- [src/modules/workspace/workspace-performance.test.ts](src/modules/workspace/workspace-performance.test.ts) (RECLASSIFY reducer microbench).
- `e2e/workspace-performance.spec.ts`, fixtures/seed helper (NEW): production actual-worker scenarios.
- [scripts/check-bundle-budget.mjs](scripts/check-bundle-budget.mjs) (MODIFY): transitive critical/optional accounting.
- `scripts/collect-performance-artifact.mjs`, package/CI workflow, W30/W36 docs (NEW/UPDATE).

### Out of scope
- ❌ Sửa bottleneck runtime (F–N/P làm).
- ❌ Dùng Lighthouse score chung thay KPI product-specific.
- ❌ Bắt canonical gate chạy trên dev server.

## 3. Checklist
- [ ] Actual worker parse/render fixture thật; browser console worker error làm test fail.
- [ ] Small/large project đo editor-ready, input-preview, long tasks, heap trend; fixture được version hóa.
- [ ] Bundle report thấy `WorkspaceLoader -> Workspace` và optional chunks; số gần resource trace, không 104.7 KiB giả.
- [ ] CI upload JSON + trace khi fail; threshold có baseline/rationale/owner.
- [ ] W30/W36 evidence wording không còn suy rộng gate cũ thành user-path proof.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `e2e/workspace-performance.spec.ts` | NEW | production actual-user path |
| `e2e/fixtures/performance-project.ts` | NEW | deterministic small/large seed |
| `scripts/check-bundle-budget.mjs` | MODIFY | transitive sets/budgets |
| `scripts/collect-performance-artifact.mjs` | NEW | KPI JSON/metadata |
| `package.json`, `.github/workflows/ci.yml` | MODIFY | canonical perf jobs/artifacts |
| `W30/w30_worker_performance_contract.md`, `W36/w36_qa_report.md` | UPDATE | evidence scope/status parity |

> **Import boundary:** dùng Playwright/build artifacts đã có; không thêm SaaS monitoring để chạy gate.

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Browser timing CI flake | High | Dedicated job, fixed profile, warmup, percentile/median, retry chỉ infra—not assertion. |
| Manifest graph double-count shared chunks | Med | Set semantics + unit fixture manifest + compare resource trace. |
| Heap metric không portable | Med | Chromium-only canonical; trend/budget có tolerance, không claim cross-browser absolute. |
| Gate quá nặng kéo CI lâu | Med | PR smoke small + scheduled/release large/soak; blocker set vẫn gồm actual worker. |

## 6. Verification Plan
- Chạy gate trên code hiện tại: phải bắt ít nhất transitive budget mismatch và actual worker crash/hang (đỏ có chủ đích để chứng minh sensitivity).
- Áp fixture fake regression (delay worker/unbounded cache/import optional chunk critical): từng KPI/budget test fail đúng lý do.
- Rerun 5 lần canonical runner: variance/flake trong tolerance; artifact có commit, Node/Chromium, CPU/network profile.
- Đối chiếu resource trace với bundle script; tổng critical không lệch đáng kể và optional không tính trước click.

## 7. Status

`PROPOSED — keystone đo lường; nên làm baseline trước các tối ưu còn lại.`

