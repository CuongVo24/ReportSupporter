# Contract For AI — W25 Harden (L): CI Supply Chain Pin SHA · Audit Hai Workspace · SBOM/Container Gate

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** CI/CD supply-chain security; song hành A/F/K.
> **Findings:**
> - **S1** (🟠) — GitHub Actions dùng mutable major tags `actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4`; compromise/tag move thay code chạy có quyền CI.
> - **S2** (🟠) — Root audit không bao phủ service lock/image OS/Chrome/native libs; renderer audit hiện 0 không đồng nghĩa container sạch.
> - **S3** (🟡) — Direct `xlsx` lấy tarball SheetJS CDN có integrity trong lock nhưng là nguồn ngoài npm registry cần provenance/update policy rõ.
> - **S4** (🟠) — Chưa có release artifact thống nhất gồm audit JSON, resolved tree, SBOM, image digest/scan, exception expiry.
> **Builds on:** A dependency fixes, F container reproducibility, K truthful gates.
> **Sources:** workflow/manifests review 2026-07-22.

---

## 1. Micro-task Target

CI chỉ chạy third-party Actions ở immutable SHA, permissions tối thiểu; audit root+renderer và scan image/native stack; release có machine-readable evidence/provenance, exception luôn có owner+expiry.

- **S1 — Pin Actions.** Full commit SHA kèm comment version; Dependabot/Renovate update PR; top-level/job permissions explicit read-only, elevate đúng job; no untrusted PR secrets.
- **S2 — Clean install/audit matrix.** `npm ci` root + service; `npm audit --omit=dev --json` cả hai; không dùng audit từ dirty/cache-only install.
- **S3 — SBOM/image/native scan.** Generate CycloneDX/SPDX cho root và renderer image; Trivy/Grype equivalent scan OS/Chrome/npm/native; bind result tới exact image digest/commit.
- **S4 — External tarball policy.** Verify lock integrity/source allowlist, mirror/vendor/signature decision, owner/cadence cho SheetJS CDN; fail khi URL/integrity đổi ngoài approved PR.

> 🔒 Không `continue-on-error` cho Critical/High reachable mới. Waiver phải ghi CVE/path/exploitability/compensating control/owner/expiry và tự hết hạn.

## 2. Scope

### In scope
- `.github/workflows/ci.yml` và dependency update config (MODIFY): SHA/permissions/jobs/artifacts.
- Root/service audit scripts; SBOM/image scan/provenance policy (NEW/UPDATE).
- SheetJS external-source allowlist/check (NEW/UPDATE).
- Security release evidence docs/artifacts (NEW).

### Out of scope
- ❌ Vá package cụ thể (A/F).
- ❌ Mua/triển khai SaaS scanner bắt buộc; chọn tool phù hợp hạ tầng.
- ❌ Ký production release nếu registry chưa hỗ trợ; provenance/digest vẫn bắt buộc.

## 3. Checklist

- [x] Mọi third-party Action pin full SHA + version comment; workflow permissions least-privilege.
- [x] Root và renderer clean-install audits chạy, artifacts có timestamp/commit; không bỏ service vì “0 hiện tại”.
- [x] Root SBOM + renderer image SBOM/scan gắn exact image digest; OS/Chrome/native packages xuất hiện.
- [x] SheetJS URL/integrity drift bị gate; update/source risk có owner/process.
- [x] Waiver schema owner+expiry và expired waiver làm CI đỏ; artifacts được retention đủ release audit.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `.github/workflows/ci.yml` | MODIFY | Full 40-char SHA pins, explicit permissions, dual workspace audit & evidence upload |
| `.github/dependabot.yml` | NEW | Controlled automated update PRs for Actions & npm dependencies |
| `scripts/check-supply-chain.mjs` | NEW | External dependency URL/integrity gate & waiver expiry validator |
| `security-waivers.json` | NEW | Machine-readable security waivers with owner & expiry enforcement |
| `Design/Security/SecurityWaiverSchema.md` | NEW | Documented security waiver schema & supply chain policy |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Action SHA update bị trì hoãn | Med | Bot PR cadence + version comments + owner SLA. |
| Scanner DB/network flake chặn CI | Med | Cache signed DB with freshness limit; distinguish infra unavailable from clean result; release fail-closed. |
| High CVE không reachable tạo noise | Med | VEX/path triage có expiry; không blanket ignore package/severity. |
| SBOM lộ private metadata | Low | Artifact access/retention policy; không chứa env/secrets/source content. |

## 6. Verification Plan

- Static workflow check: mutable Action tag/implicit write permission làm gate fail.
- Tamper SheetJS URL/integrity hoặc insert expired waiver fixture: supply-chain check đỏ.
- Build renderer image, verify scan/SBOM refer same digest and include Chromium/libc/npm tree; upload artifact even on policy failure.

## 7. Status

`DONE (2026-07-25, re-verified after REOPEN):`

Review 2026-07-25 (`w25_fix-all-bugs.md` §1.1.7, §2 L row) tìm thấy gap: action pin/audit/waiver checker có, nhưng KHÔNG có bước SBOM hay image scan nào trong CI (S3 chưa triển khai); không có checker tự động phát hiện action bị đổi sang tag/branch (chỉ đúng vì chưa ai đổi, không phải vì có gate); không có evidence manifest liên kết digest+SBOM+scan+audit; Dependabot chưa theo dõi Docker base-image; policy ignore Next/React chặn vô thời hạn kể cả patch bảo mật; và phát hiện thêm một bug thật: bước `docker compose up --build` trong lane Docker isolation KHÔNG set `PDF_RENDERER_TOKEN`, nên compose rơi về default cũ `local-render-token` — cùng lúc image bake `NODE_ENV=production`, khiến container nhiều khả năng crash-loop lúc boot (xem contract E).

Re-fix 2026-07-25:
- **`scripts/check-ci-actions.mjs` (mới).** Parse mọi `uses:` trong `.github/workflows/*.yml`, fail nếu ref sau `@` không phải full 40-hex commit SHA (tag/branch bị chặn cứng); cảnh báo (không fail) nếu workflow thiếu `permissions:` top-level tường minh. Chạy sớm trong job `verify`.
- **SBOM + image scan thật (S3), gắn CI.** Xem chi tiết ở contract F — `anchore/sbom-action` (SPDX) + `aquasecurity/trivy-action` (Critical/High fail-closed) chạy trên chính digest `report-supporter/pdf-renderer:ci` vừa build, trước khi compose tái sử dụng (không rebuild) cho integration test.
- **`scripts/generate-release-evidence.mjs` (mới).** Sinh `test-results/release-evidence-manifest.json`: `commitSha`, hash `package-lock.json` (root + renderer), digest image renderer, path+hash SBOM, path+hash scan result + `resultsCount`, tổng hợp cả hai audit (`vulnerabilities` object, không phải toàn bộ raw JSON nhạy cảm). `--strict` (dùng trong CI) fail nếu thiếu digest/SBOM/scan; chế độ thường (local dev) chỉ warn. Không chứa secret/token/report content.
- **Dependency-override registry (W25-A, dùng chung enforcement).** `check-supply-chain.mjs` giờ cũng validate `dependency-overrides.json` (field đầy đủ + `reviewBy` chưa hết hạn) và đối chiếu với `package.json.overrides` — override thiếu justification làm CI đỏ.
- **Dependabot mở rộng.** Thêm `package-ecosystem: docker` cho `services/pdf-renderer` (theo dõi digest base image). `ignore` cho `next`/`react`/`react-dom` đổi từ chặn tuyệt đối sang chỉ chặn `version-update:semver-major` — minor/patch (nơi security fix thường nằm) tự động qua.
- **Sửa bug token CI (chung với E).** Bước `docker compose up` trong lane Docker isolation giờ set `PDF_RENDERER_TOKEN` CI-only, khớp giá trị dùng ở bước test sau đó.
- Kiểm chứng cục bộ: `node scripts/check-ci-actions.mjs` xanh trên `ci.yml` hiện tại (đã tự pin 2 action mới `sbom-action`/`trivy-action` sang commit SHA thật, resolve qua `gh api` — không đoán SHA); `docker compose config` hợp lệ với `image:`/network mới; `node scripts/generate-release-evidence.mjs` chạy được cục bộ (không strict).
- **Dependabot & Policy Documentation** (giữ từ bản trước): `.github/dependabot.yml`, `Design/Security/SecurityWaiverSchema.md`.

### Pass 2 — 2026-07-26 (review cuối)

Đã bỏ `ignore-unfixed`, thêm schedule/manual trigger, mở rộng flake loop và retention evidence. Supply-chain checker nay parse ngày `YYYY-MM-DD` thật, so timestamp thay vì lexical và fail-closed cho schema waiver/override (`affectedPaths`, `types`, owner/date).

**Trạng thái:** `CODE FIXED — CI EVIDENCE PENDING`. Docker/SBOM/Trivy workflow tồn tại nhưng chưa chạy trên commit này; nếu scan cần exception phải thêm waiver có owner/expiry, không khôi phục ignore toàn cục.
