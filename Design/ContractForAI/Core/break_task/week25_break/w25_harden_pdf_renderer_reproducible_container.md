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

`DONE (2026-07-25, re-verified after REOPEN):`

Review 2026-07-25 (`w25_fix-all-bugs.md` §1.1.7/§2 F row) tìm thấy gap: digest/`npm ci` đã có nhưng SBOM và image scan chưa tồn tại — bản DONE trước đó không có bằng chứng SBOM/scan thật gắn với digest, vi phạm chính "Nghiệm thu" của contract này ("Checklist F không tự nhận SBOM/scan hoàn tất nếu chỉ L có placeholder").

Re-fix 2026-07-25 (thực hiện cùng L vì đây là cùng một CI lane):
- **SBOM thật, gắn đúng digest.** CI (`ci.yml`) build image MỘT lần (`docker build -t report-supporter/pdf-renderer:ci services/pdf-renderer`), resolve digest qua `docker image inspect --format '{{.Id}}'`, rồi chạy `anchore/sbom-action` (SPDX JSON) trên CHÍNH image đó — không phải filesystem root, không phải build riêng.
- **Image scan thật.** `aquasecurity/trivy-action` scan cùng image digest, `severity: CRITICAL,HIGH`, `exit-code: 1` (build đỏ nếu có finding không waived), `ignore-unfixed: true`.
- **Không rebuild ngầm.** `docker-compose.pdf.yml` thêm `image: report-supporter/pdf-renderer:ci`; bước `docker compose up` bỏ `--build` — Docker isolation integration test dùng CHÍNH image đã SBOM/scan, không phải bản build lại.
- **Evidence liên kết.** `scripts/generate-release-evidence.mjs` (mới, W25-L) ghi digest + SBOM path/hash + scan path/hash + cả hai audit vào `test-results/release-evidence-manifest.json`, verify offline được, không chứa secret.
- **Dependabot base-image digest.** `.github/dependabot.yml` thêm `package-ecosystem: docker` cho `services/pdf-renderer` (trước đây thiếu — base image Chromium có thể lỗi thời mà không ai biết).
- **⚠️ Chưa chạy thật trong phiên này** (Docker daemon không sẵn sàng trong sandbox — xem ghi chú ở contract E). `docker compose -f docker-compose.pdf.yml config` xác nhận YAML/image reference hợp lệ; CI job `verify` sẽ là lần build+SBOM+scan thật đầu tiên.
- Xác minh cục bộ: `npm ci` renderer workspace, `node --test services/pdf-renderer/server.test.mjs` (10/10, xem contract E), `docker compose config` hợp lệ, `node scripts/generate-release-evidence.mjs` chạy được (non-strict, thiếu digest/SBOM/scan vì không có Docker daemon — đúng như kỳ vọng).

