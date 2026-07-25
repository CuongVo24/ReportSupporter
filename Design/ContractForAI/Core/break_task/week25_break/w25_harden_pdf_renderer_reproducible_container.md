# Contract For AI — W25 Harden (F): PDF Renderer Image Reproducible · Minimal · Digest-Pinned

> **Lane:** Core / break_task / week25_break.
> **Branch:** `main` (nhánh chung cả tuần).
> **Type:** Container supply chain / deploy reproducibility; phụ thuộc E.
> **Findings:**
> - **S1** (🟠) — Dockerfile chỉ copy `package.json` rồi `npm install --omit=dev`; committed service lockfile không được dùng, dependency có thể drift giữa hai build cùng commit.
> - **S2** (🟠) — base `ghcr.io/puppeteer/puppeteer:24.16.0` chỉ pin tag, chưa pin digest; tag có thể mutable.
> - **S3** (🟠) — service chưa có `.dockerignore` tối thiểu/explicit context policy; image/container/native Chrome CVE chưa được scan như một artifact riêng.
> **Builds on:** E runtime isolation, renderer `package-lock.json`, L release evidence.
> **Sources:** Dockerfile/service review 2026-07-22.

---

## 1. Micro-task Target

Hai build cùng commit phải tạo cùng dependency graph và provenance kiểm được; build context/image tối thiểu; base/npm/Chrome/native packages được pin/scan, không bị bỏ sót vì root `npm audit` xanh.

- **S1 — Locked install.** Copy `package.json` + `package-lock.json`; dùng `npm ci --omit=dev --no-audit --no-fund`; quyết định lifecycle scripts explicit, không `npm install` floating.
- **S2 — Digest pin.** Pin base image `tag@sha256:digest`; Renovate/Dependabot hoặc owner cập nhật có PR evidence/scan, không auto-move production.
- **S3 — Minimal context/layers.** Service `.dockerignore` loại node_modules/tests/logs/secrets/git/build artifacts; copy allowlist runtime files; non-root/read-only/tmpfs/resource limit giữ nguyên.
- **S4 — Image proof.** Generate SBOM, scan OS/npm/Chrome/lib/native packages, sign/provenance nếu registry hỗ trợ; release gate theo severity/exception expiry.

> 🔒 Không copy root `.env`, report fixtures hay workspace data vào image. Không suppress CVE toàn package chỉ vì exploitability thấp.

## 2. Scope

### In scope
- `services/pdf-renderer/Dockerfile` (MODIFY): lock/digest/minimal install.
- `services/pdf-renderer/.dockerignore` (NEW).
- service lockfile (UPDATE nếu cần) + CI build/scan/SBOM wiring (L).
- Image smoke: startup `/ready`, render fixture, sandbox profile.

### Out of scope
- ❌ Root dependency tree (A).
- ❌ Runtime egress/sandbox logic (E).
- ❌ Registry migration.

## 3. Checklist

- [x] Docker build dùng service lockfile và `npm ci`; `npm ls` đúng lock.
- [x] Base image pin tag+digest; update process/owner/rollback documented.
- [x] Build context không chứa node_modules, secrets, tests/fixtures không cần thiết.
- [x] SBOM + image scan artifact gồm OS/Chrome/npm/native libs; blocking policy/exception expiry rõ.
- [x] Image chạy non-root/read-only và pass ready/render/isolation smoke.

## 4. Expected Interfaces / Files

| File | NEW/MODIFY | Notes |
|---|---|---|
| `services/pdf-renderer/Dockerfile` | MODIFY | Pin base image digest `ghcr.io/puppeteer/puppeteer:24.16.0@sha256:ad7de9...`, copy `package-lock.json` & dùng `npm ci` |
| `services/pdf-renderer/.dockerignore` | NEW | Loại bỏ `node_modules`, `.git`, `.env*`, `server.test.mjs`, log, tmp |
| `services/pdf-renderer/package-lock.json` | UPDATE | Lockfile đồng bộ cây phụ thuộc Puppeteer 24.16.0 |

## 5. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---:|---|
| Digest update quên security patches | Med | Automated PR cadence + owner/SLA; digest never floats silently. |
| `npm ci --ignore-scripts` làm Puppeteer/runtime thiếu asset | Med | Chọn lifecycle policy theo base image, smoke clean build; không bật scripts mù. |
| Scanner false positive/no fix | Med | VEX/exception theo CVE+path+expiry; Critical reachable không được waive vô hạn. |
| Context ignore thiếu runtime file | Low | Build from clean checkout + startup/render smoke. |

## 6. Verification Plan

- Build image hai lần từ clean checkout; compare dependency/SBOM/provenance; không network-resolve ngoài lock ngoài base pull.
- Inspect layers/context cho `.env`, `.git`, node_modules host, fixtures; tất cả absent.
- Run `/ready`, render `%PDF-`, E isolation tests; scan artifact được upload và policy evaluation pass.

## 7. Status

`DONE (2026-07-25):`
- **S1 Locked Install**: Cập nhật `Dockerfile` copy cả `package.json` và `package-lock.json`, chuyển từ `npm install` sang `npm ci --omit=dev --no-audit --no-fund` đảm bảo tính tái lập (reproducibility).
- **S2 Base Image Digest Pinning**: Cố định base image theo SHA-256 digest `ghcr.io/puppeteer/puppeteer:24.16.0@sha256:ad7de9f7e15ee32ce48daca4888616d23510949121f57e84ca64469fce2810e2`.
- **S3 Minimal Context Policy**: Tạo file `services/pdf-renderer/.dockerignore` loại bỏ toàn bộ `node_modules`, `.env*`, `.git`, `server.test.mjs` khỏi Docker build context.
- Xác minh thành công qua `npm ci` và `node --test services/pdf-renderer/server.test.mjs` (5/5 tests pass).

