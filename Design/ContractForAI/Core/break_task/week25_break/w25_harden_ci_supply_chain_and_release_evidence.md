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

- [ ] Mọi third-party Action pin full SHA + version comment; workflow permissions least-privilege.
- [ ] Root và renderer clean-install audits chạy, artifacts có timestamp/commit; không bỏ service vì “0 hiện tại”.
- [ ] Root SBOM + renderer image SBOM/scan gắn exact image digest; OS/Chrome/native packages xuất hiện.
- [ ] SheetJS URL/integrity drift bị gate; update/source risk có owner/process.
- [ ] Waiver schema owner+expiry và expired waiver làm CI đỏ; artifacts được retention đủ release audit.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `.github/workflows/ci.yml` | MODIFY | SHA pins, permissions, audit/SBOM/scan |
| `.github/dependabot.yml` hoặc Renovate config | NEW/UPDATE | controlled update PRs |
| `scripts/check-supply-chain.mjs` | NEW | external URL/integrity/waiver policy |
| security waiver/evidence schema docs | NEW | machine-readable owner/expiry |
| package/service lockfiles | READ/UPDATE qua A/F | exact inputs |

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

`PROPOSED — CI hiện dùng major tags và chưa có unified supply-chain evidence.`

