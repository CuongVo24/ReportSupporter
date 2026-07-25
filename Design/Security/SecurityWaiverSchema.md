# Security Waiver Schema & Supply Chain Security Policy

> **Module:** Security / Supply Chain Policy
> **Specification:** Machine-readable security waivers, external package tarball policy, and CI Action pinning rules.

---

## 1. Security Waiver Schema (`security-waivers.json`)

All security waivers or vulnerability exemptions must be recorded in `security-waivers.json` at the repository root and strictly conform to the following schema. **CI will fail if any waiver is expired or missing required fields.**

```json
[
  {
    "id": "SW-2026-001",
    "cve": "GHSA-52cp-r559-cp3m",
    "package": "js-yaml",
    "scope": "devOnly",
    "reason": "Dev-dependency transitively pulled by eslint for local linting only. Not included in client bundle or server production runtime.",
    "compensatingControl": "Dev dependency omitted in production build via --omit=dev; no untrusted YAML parsed at runtime.",
    "owner": "security-team@report-supporter",
    "expiryDate": "2026-12-31"
  }
]
```

### Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique tracking ID (e.g. `SW-2026-001`) |
| `cve` | `string` | Advisory identifier or CVE number (e.g. `GHSA-52cp-r559-cp3m` or `CVE-2026-XXXX`) |
| `package` | `string` | Target package name (e.g. `js-yaml`) |
| `scope` | `string` | Scope of exemption (`devOnly` \| `buildOnly` \| `runtimeMitigated`) |
| `reason` | `string` | Technical justification for why immediate fix/upgrade is deferred |
| `compensatingControl` | `string` | Active compensating security controls that mitigate the risk |
| `owner` | `string` | Responsible team or person email/identifier |
| `expiryDate` | `string` | ISO 8601 date string (`YYYY-MM-DD`). ** CI automatically fails if `expiryDate < today` ** |

---

## 2. External Tarball Policy (SheetJS CDN)

1. **Approved Host List**: Only explicitly approved CDN hosts (`cdn.sheetjs.com`) are allowed for direct tarball dependencies.
2. **Integrity Pinning**: Every external tarball dependency MUST have a pinned `integrity` SHA-512 hash in `package-lock.json`.
3. **Automated Gate**: `scripts/check-supply-chain.mjs` runs on every CI build. Unapproved hosts or missing/modified integrity hashes cause an immediate build failure.

---

## 3. GitHub Actions Pinning & Permissions Policy

1. **Full Commit SHA Pinning**: All third-party GitHub Actions in `.github/workflows/ci.yml` must be pinned to full 40-character commit SHAs with semantic version comments.
2. **Least Privilege**: Workflows specify explicit top-level `permissions: { contents: read }` to prevent accidental credential escalation.
3. **Dependabot Automated Updates**: Dependabot monitors GitHub Actions and npm dependencies on a weekly schedule (`.github/dependabot.yml`).
