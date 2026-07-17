# W30 Worker and Bundle Performance Contract

Status: DONE

History: READY_TO_IMPLEMENT → IN_PROGRESS (2026-07-17) → DONE (2026-07-17).

Scope: common revision-aware worker/cache/stale discard, no main-thread preview AST parse, lazy feature chunks and route-level loader.

Acceptance: Library ≤200 KiB gzip, Workspace ≤450 KiB gzip, reducer P95 <16 ms and 40-page caller-thread P95 <200 ms.

DONE evidence: production build and performance artifacts in W36 QA report.

Evidence: `Design/ContractForAI/Core/phase6-8/W36/w36_qa_report.md` — 2026-07-17 full local gate run (encoding/lint/typecheck/tests/perf/build/bundle/E2E/PDF/audit) with Playwright production report.
