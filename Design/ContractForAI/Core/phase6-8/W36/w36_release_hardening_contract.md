# W36 Release Hardening Contract

Status: IN_PROGRESS

History: READY_TO_IMPLEMENT → IN_PROGRESS (2026-07-17).

Scope: Playwright controls/offline/a11y/keyboard/responsive/theme, PDF Docker, Redis multi-instance, bundle/perf/security regression, staging aggregate telemetry without report/API-key logs.

Acceptance: complete CI sequence and attached QA report/artifacts. Any unavailable external integration keeps this and dependent roadmap items `IN_PROGRESS`.

DONE evidence: final W36 QA report, Playwright report, build/bundle output and PDF/Redis integration logs.

Progress: 2026-07-17 — full local gate sequence green (see `w36_qa_report.md`): unit/perf tests, build, bundle budget, Playwright 4/4 on production build, PDF integration, `npm audit` clean. Remaining for DONE: GitHub Actions CI artifact on push and staging beta observation.
