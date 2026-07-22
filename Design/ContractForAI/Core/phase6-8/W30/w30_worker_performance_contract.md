# W30 Worker and Bundle Performance Contract

Status: DONE

History: READY_TO_IMPLEMENT → IN_PROGRESS (2026-07-17) → DONE (2026-07-17).

Scope: common revision-aware worker/cache/stale discard, no main-thread preview AST parse, lazy feature chunks and route-level loader.

Acceptance: Library ≤200 KiB gzip, Workspace ≤450 KiB gzip, reducer P95 <16 ms and 40-page caller-thread P95 <200 ms.

DONE evidence: production build and performance artifacts in W36 QA report.

Evidence: `Design/ContractForAI/Core/phase6-8/W36/w36_qa_report.md` — 2026-07-17 full local gate run (encoding/lint/typecheck/tests/perf/build/bundle/E2E/PDF/audit) with Playwright production report.

> **Scope-of-evidence note (W24-O, 2026-07-21).** The 2026-07-17 gates that
> produced this DONE measured a **fake worker returning an empty AST**
> (`pipeline-performance.test.ts`), a **reducer microbench** in jsdom
> (`workspace-performance.test.ts`), and the **initial route slice only**
> (`check-bundle-budget.mjs` summed `app-build-manifest.pages[route]`, reporting
> ~104.7 KiB for the Workspace). Those are valid *structural* checks but are
> **not** user-path performance evidence: the fake worker cannot reproduce
> `document is not defined` in the real worker graph, and the bundle number
> undercounted the editor-ready transitive graph (`WorkspaceLoader ->
> import("./Workspace")`), which the production trace measures at ~596.9 KiB gzip.
> The canonical user-path gate is now `e2e/workspace-performance.spec.ts`
> (production build, actual Chromium, actual Worker) with the truthful transitive
> budget in `check-bundle-budget.mjs`. Treat this W30 DONE as **build/structural
> parity**, not as a proven editor-ready/preview latency claim. See
> `Design/ContractForAI/Core/break_task/week24_break/w24_perf_truthful_browser_and_bundle_gates.md`.
