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

- [x] Coverage artifact có baseline và thresholds; critical modules có branch coverage riêng; CI fail khi giảm dưới ngưỡng. (Đã có từ trước; W25-K bổ sung threshold cho các file mới/sửa đổi trong đợt REOPEN A-I.)
- [x] Pipeline suite pass ổn định (đã có `vi.useFakeTimers()` + flake lane x20 trong `ci.yml` từ trước — không đổi trong đợt này).
- [x] PDF test chứng minh script marker không chạy và canary nhận 0 outbound, không chỉ `%PDF-` (đã có từ trước trong `scripts/test-pdf-integration.mjs` — xác nhận lại, không đổi).
- [x] Fuzz suites deterministic, bounded runtime/memory — các suite mới trong đợt A-I (`zip-central-directory.test.ts`, `resource-policy-bombs.fuzz.test.ts` mở rộng, `markdown-pipeline.fuzz.test.ts` mở rộng, `ai-stream-bounds.fuzz.test.ts` mở rộng, `remote-image-privacy.fuzz.test.ts` mở rộng, `middleware.test.ts` mới) đều dùng input cố định/seed, không random không kiểm soát.
- [ ] CI phân biệt unit/mock, production browser, Docker isolation và scheduled soak evidence — CHƯA làm trong đợt này (không có thời gian chỉnh sửa `ci.yml` thêm lane phân loại rõ hơn ngoài các lane đã có).

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

`KEEP OPEN — PARTIAL (2026-07-25).`

Nhiều phần của contract này (coverage v8 bật + threshold, PDF canary/script-marker proof, pipeline fake-timer determinism, flake lane x20) hoá ra ĐÃ được triển khai bởi các commit trước (`c82139b`, `f336e3f`, và các commit "W25 Harden" khác) trước khi review 2026-07-25 chạy — file trạng thái `PROPOSED` chỉ đơn thuần chưa được cập nhật để phản ánh việc đó, không phải các control không tồn tại. Trong đợt REOPEN A-I của phiên này:

- Phát hiện **một gap thật**: `src/middleware.ts` (mới, W25-G) có 6 unit test (`src/middleware.test.ts`) nhưng **không nằm trong danh sách file của `test:coverage`/`test:subsystems`** trong `package.json` (script chỉ liệt kê `src/lib src/components src/app src/modules src/smoke.test.ts`, không có `src/middleware.test.ts` — file này nằm ở `src/` root, ngoài mọi thư mục được liệt kê). Kết quả: coverage báo `0/0/0/0` cho một file bảo mật quan trọng (sinh CSP nonce) dù có test pass. Đã sửa: thêm `src/middleware.test.ts` vào cả hai script; coverage thật đo được sau khi sửa là 100/100/100/100.
- Thêm per-file threshold cho 8 file mới/sửa đổi nặng trong đợt A-I: `resource-policy.ts`, `zip-central-directory.ts` (mới — parser Central Directory nhị phân tự viết), `sink-style-narrowing.ts` (mới), `toc-renderer.ts`, `src/app/api/ai/route.ts`, `src/app/api/pdf/route.ts`, `src/app/api/pdf/ticket/route.ts`, `src/middleware.ts` — tất cả set vài điểm dưới số đo thật (`npm run test:coverage` full run), không phải số bịa.
- Mở rộng test suite hiện có (không viết lại từ đầu) cho `zip-central-directory.ts`: thêm test trực tiếp cho buffer quá nhỏ, không có EOCD, ZIP64-sentinel-không-có-locator (fail closed), Central Directory offset ngoài phạm vi, sai chữ ký header, tên UTF-8. Thêm test cho `resource-policy.ts`: duplicate-name THẬT (không phải placeholder như bản trước — JSZip không dedupe hai entry khác case), unsupported compression method, absolute path.
- **Chưa làm trong đợt này:** không sửa `ci.yml` để thêm lane phân loại unit/mock vs production-browser vs Docker-isolation vs soak rõ ràng hơn (các lane đã tồn tại nhưng ranh giới nhãn chưa tường minh); không audit toàn bộ repo tìm thêm các "known bypass test" khác ngoài `sanitize-pdf-html.fuzz.test.ts` (file đó đã tự document đúng cách, không phải false-green).

### Pass 2 — 2026-07-26 (review cuối)

Đã thay các regression false-green ở AI oversize và middleware nonce bằng assertion bắt buộc fail trên code cũ; flake loop CI bao phủ AI adapter/route, worker và renderer, chạy `maxWorkers=1`; workflow có schedule/manual trigger và retention rõ ràng.

**Vẫn mở:** chưa tách rõ browser/Docker/soak lane và chưa có run evidence trên commit này. Trạng thái giữ `KEEP OPEN — PARTIAL`.

Test mới trong đợt K: `zip-central-directory.test.ts` (7 test, mới), `middleware.test.ts` (6 test, mới), +4 test trong `resource-policy-bombs.fuzz.test.ts`. `npm run test:coverage` full run: **PASS** (global 65.68%/58.56%/54.56%/68.04%, tất cả per-file threshold mới đều xanh), `npm run typecheck`/`npm run lint` xanh.
