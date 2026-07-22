# W36 QA Report — Phase 6–8 (W25–W36) verification evidence

Date: 2026-07-17
Environment: Windows 11, Node 24.11.1, npm workspace at `E:\ReportSupporter`, Chromium via Playwright 1.61.1.
Scope: full local execution of the CI gate sequence defined in `.github/workflows/ci.yml` (encoding → lint → typecheck → unit/integration by subsystem → performance → build → bundle budget → Playwright E2E on the production build → PDF renderer integration → `npm audit --omit=dev`).

## Gate results

| Gate | Command | Result |
|---|---|---|
| Encoding scan | `npm run check:encoding` | PASS — 779 text files, no mojibake |
| Lint | `npm run lint` | PASS — no findings |
| Typecheck | `npm run typecheck` | PASS |
| Unit/integration (subsystem batches) | `npm run test:subsystems` | PASS — all 5 batches, exit 0 (lib/workspace/pipeline; write/check; import/export; components/app/present/evidence/a11y; format/smoke) |
| Performance | `npm run test:performance` | PASS — pipeline transfer-smoke and workspace reducer microbench (⚠️ W24-O: **structural only**, fake worker + reducer; NOT user-path perf — canonical gate = `npm run test:perf:e2e`) |
| Production build | `npm run build` | PASS — 10 routes, Serwist service worker bundled at `/sw.js` |
| Bundle budget | `npm run check:bundle` | PASS — Project Library 167.6 KiB / 200 KiB gzip, Workspace 104.7 KiB / 450 KiB gzip (⚠️ W24-O: this 104.7 KiB is the **initial route slice only**; it undercounts the editor-ready transitive graph `WorkspaceLoader -> import("./Workspace")` measured at ~596.9 KiB gzip by the production trace. Truthful transitive budget now enforced via the perf artifact.) |
| Playwright E2E (production build) | `PLAYWRIGHT_USE_BUILD=1 npm run test:e2e` | PASS — 4/4 (library CRUD 23.7s, keyboard/axe 21.6s, template catalog 6.6s, offline reload 1.5m), no retries |
| PDF renderer integration | `npm run test:pdf-integration` | PASS — `%PDF-` signature, 19,143 bytes; JS disabled and outbound network aborted in worker (see notes) |
| Security audit | `npm audit --omit=dev` | PASS — 0 vulnerabilities |

## Browser QA (Playwright, production server)

Specs: `e2e/project-library.spec.ts` (library CRUD: create, search, duplicate, trash, restore; keyboard/responsive/axe serious+critical = 0) and `e2e/templates-and-offline.spec.ts` (offline template catalog search + create; service-worker offline reload of Project Library and workspace navigation with network disabled).

Artifacts: `playwright-report/` (HTML report), `test-results/playwright/` (traces/videos on failure).

Fix applied during this verification run: duplicating a project from the library now stays in the library and refreshes the list (`src/components/ProjectLibrary.tsx`) instead of navigating into the copy, matching the library-management contract behaviour exercised by the CRUD spec.

## PDF renderer isolation evidence

`services/pdf-renderer/server.mjs` verified via `scripts/test-pdf-integration.mjs`: response begins with `%PDF-`, byte length above minimum, request carrying `<script>` and an external `<img>` renders with JavaScript disabled (`page.setJavaScriptEnabled(false)`) and all non-`data:` requests aborted through request interception. Body size limit 25 MiB (413) and 30 s timeouts are enforced in the worker; the worker logs no request body.

Runner note: the local run executed the worker directly with Node against the pinned Puppeteer 24.16.0 using the Playwright-managed Chromium binary because the Docker daemon was not running on this machine at verification time. The container definition (`services/pdf-renderer/Dockerfile`, `docker-compose.pdf.yml` — read-only FS, tmpfs `/tmp`, `no-new-privileges`) is exercised by the CI workflow.

## Rate limiting evidence

`src/lib/server/rate-limit.test.ts`: bounded in-memory sliding window with hard cap and pre-insert cleanup (dev); spoofed `x-forwarded-for` ignored unless `TRUSTED_PROXY_MODE` enables proxy trust; production limiter fails closed (503) when Redis credentials are missing or the distributed backend throws; a shared distributed window is enforced across two app instances.

## Outstanding items (keep W36 IN_PROGRESS)

1. GitHub Actions run of `.github/workflows/ci.yml` on push — produces the canonical CI artifact (including the Docker-isolated PDF integration job).
2. Staging beta observation with aggregate error/latency metrics (no report content or API keys logged).

All other W25–W35 acceptance criteria are covered by the gates above.
