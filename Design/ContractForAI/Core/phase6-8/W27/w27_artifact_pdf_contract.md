# W27 Reliable Artifact and PDF Contract

Status: DONE

History: READY_TO_IMPLEMENT → IN_PROGRESS (2026-07-17) → DONE (2026-07-17).

Scope: async offline HTML, separate Print Preview, verified PDF via isolated first-party Docker/Puppeteer worker, CSP/no-network/no-script, limits and transparent unavailable state.

Acceptance: `%PDF-` opens with pdfjs; HTML offline parity for QR/math/Mermaid/image; Docker script/network blocking and no body log.

DONE evidence: PDF Docker integration artifact in W36 QA report.

Evidence: `Design/ContractForAI/Core/phase6-8/W36/w36_qa_report.md` — 2026-07-17 full local gate run (encoding/lint/typecheck/tests/perf/build/bundle/E2E/PDF/audit) with Playwright production report.
