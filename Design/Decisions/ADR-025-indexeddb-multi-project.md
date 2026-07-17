# ADR-025 — IndexedDB v4 multi-project persistence

Status: Accepted (2026-07-17)

Decision: use `project-bundles`, `project-summaries`, `settings` and `recovery-items`; bundle+summary save in one transaction. Migrate `drafts/current` atomically and retain it for one release rollback. Trash never auto-purges. No backend DB or cloud sync.

Consequences: `/` becomes Project Library, workspace routes require project ID, migrations need seeded/idempotent tests, and recovery becomes a first-class user surface.
