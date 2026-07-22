# Contract For AI — W25 Test (K): Coverage Có Ngưỡng · Security Fuzz Thật · Loại Test Flaky/False-Green

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Test/CI evidence — keystone nghiệm thu A–J.
> **Findings:**
> - **S1** (🟠) — Nhiều test nhưng Vitest chưa bật coverage provider/threshold; không đủ căn cứ nói “coverage xuất sắc” hoặc “test ~1:1”.
> - **S2** (🟠) — Full `npm test` từng timeout `pipeline-client.test.ts` ở 30s; isolated rerun pass nhưng ~11.6s, cho thấy load-sensitive fallback/dynamic import trong test.
> - **S3** (🔴) — PDF integration test mô tả JS/network blocked nhưng chỉ assert `%PDF-` và size; artifact có thể vẫn chạy script/call network mà test xanh.
> - **S4** (🟠) — Parser/stream/import/sanitizer limits mới cần fuzz/adversarial fixtures và memory/time assertions, không chỉ happy-path unit.
> **Builds on:** W24-O truthful performance gate; A–J security contracts.
> **Sources:** test/config/run evidence 2026-07-22.

---

## 1. Micro-task Target

Security claims phải được chứng minh ở boundary thật; coverage được đo với ngưỡng có rationale; flaky test được làm deterministic bằng dependency injection/mocks đúng lớp, không tăng timeout; adversarial tests nhỏ nhưng chứng minh cap kích hoạt trước allocation/side effect.

- **S1 — Coverage baseline/gate.** Bật `@vitest/coverage-v8`; báo statements/branches/functions/lines tổng + critical-module thresholds riêng (routes, rate-limit, config, sanitizer, import resource policy). Baseline rồi ratchet, không đặt số giả.
- **S2 — Pipeline determinism.** Mock/inject main-thread fallback/dynamic import/worker clock; fake timers có kiểm soát; test circuit breaker không phụ thuộc máy/load. Giữ production actual-worker proof ở E2E.
- **S3 — PDF isolation proof.** Local canary HTTP/DNS where feasible; inject script marker vào rendered text/DOM and inspect PDF text/renderer metrics; assert canary 0 hit, SCRIPT_RAN absent, JS off/interception/egress behavior.
- **S4 — Security corpus.** Fuzz bounded AI chunks, ZIP/import metadata, Markdown/DOM IDs/URLs, config values, abort races; seed cố định + minimized regression cases.

> 🔒 Không tăng timeout/retry để che flaky assertion. Không gọi mock-only test là runtime isolation proof. Coverage không thay threat-based cases.

## 2. Scope

### In scope
- Vitest config/package/CI coverage artifact + thresholds (MODIFY).
- `pipeline-client.test.ts` refactor deterministic (MODIFY), actual Worker E2E giữ riêng.
- PDF integration/unit security assertions/canary (MODIFY/NEW).
- Fuzz/property/adversarial suites cho B/D/E/H/I/J (NEW).

### Out of scope
- ❌ Đòi 100% coverage toàn repo ngay lập tức.
- ❌ Performance soak dài trên mọi PR (scheduled/release lane).
- ❌ Sửa production bug phát hiện bởi test trong cùng commit K; mở/ghi owner contract tương ứng.

## 3. Checklist

- [ ] Coverage artifact có baseline và thresholds; critical modules có branch coverage riêng; CI fail khi giảm dưới ngưỡng.
- [ ] Pipeline suite pass ổn định dưới full load, không tăng timeout; 20 repeated runs không flake.
- [ ] PDF test chứng minh script marker không chạy và canary nhận 0 outbound, không chỉ `%PDF-`.
- [ ] Fuzz suites deterministic, bounded runtime/memory, lưu minimized seed khi fail.
- [ ] CI phân biệt unit/mock, production browser, Docker isolation và scheduled soak evidence.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `vitest.config.*`, `package.json` | MODIFY | v8 coverage/scripts/thresholds |
| `src/modules/pipeline/pipeline-client.test.ts` | MODIFY | deterministic dependencies/time |
| `scripts/test-pdf-integration.mjs` | MODIFY | canary + PDF text/metric assertions |
| `src/**/__security__/*` / fixture generators | NEW | bounded adversarial corpus |
| `.github/workflows/ci.yml` | MODIFY | lanes/artifacts/repeat smoke |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Coverage threshold tạo busywork | Med | Critical-module thresholds + ratchet from measured baseline; exclusions reviewed. |
| Fuzz CI không deterministic | High | Fixed seeds/time budgets; randomized scheduled lane; persist seed/corpus on failure. |
| Canary test có network race | Med | Local listener with explicit lifecycle/count; Docker network namespace; no internet dependency. |
| Mock làm mất production behavior | High | Label mock unit scope; canonical browser/Docker test bắt actual boundary. |

## 6. Verification Plan

- Generate coverage clean checkout; cố xóa một critical error branch để xác nhận gate đỏ.
- Chạy full test suite lặp 20 lần/constrained CPU; pipeline test không timeout, không open handles.
- Cố tình bật JS hoặc bỏ interception trong test mutation: PDF isolation test phải đỏ; restore code rồi xanh.
- Run fuzz seeds cho oversized/no-newline/ZIP/clobber/config; mỗi case fail sớm đúng code và cleanup.

## 7. Status

`PROPOSED — số lượng test hiện tốt nhưng coverage/isolation claim chưa đủ canonical evidence.`

