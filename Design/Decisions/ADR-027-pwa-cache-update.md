# ADR-027 — PWA cache and update safety

Status: Accepted (2026-07-17)

Decision: Serwist precaches application shell, local fonts/workers/catalog. `/api/ai`, `/api/pdf` and report content are never cached. A waiting service worker activates only after autosave flush and explicit user reload confirmation.

Consequences: offline navigation and existing IndexedDB projects work without network; AI/PDF fail with clear online-only states. Production browser QA is mandatory before release.
