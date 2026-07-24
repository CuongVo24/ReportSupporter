# ADR-028 — Optional IndexedDB encryption at rest

Status: **Deferred** (2026-07-24)

## Context

`Design/Security/ThreatModel.md` T4 documents that project content, metadata, and assets are stored **plaintext** in IndexedDB. This is readable by any code running in-origin (same-origin XSS if sanitize ever fails), a browser extension in the same profile, or anyone with access to the user's device/browser profile files. ReportSupporter's "local-first" posture only means *no cloud sync by default* — it does not mean *encrypted* or *unreadable by the device owner's environment*. Contract W25-M requires this ambiguity resolved with an explicit decision, not left implicit.

## Decision

**Deferred — not implemented now.** No client-side at-rest encryption (e.g. WebCrypto-wrapped IndexedDB, passphrase-derived key) ships in this release.

Rationale:
- The primary realistic threat for this product's actual users (students/teachers preparing reports on their own device) is XSS via pasted content, not device-level plaintext access — and XSS already defeats most practical client-side encryption schemes, since the decrypted plaintext must be in memory/DOM to render the report anyway. Encryption would raise the bar against a narrower threat (offline forensic read of the IndexedDB file, or another local account/profile on a shared machine) while adding real cost.
- No passphrase/recovery UX exists today. A lost passphrase with no server-side recovery path (by design — no accounts) means **permanent data loss**, which is a worse outcome for most users than the plaintext-at-rest risk it mitigates.
- Adding a passphrase-derived key changes performance (materially slows autosave/read paths) and requires a project schema migration (`ADR-025`) plus a UX flow for key entry per session — non-trivial scope, not something to bundle into a docs-alignment contract.

## Criteria to revisit (become "Required")

Re-open this decision if any of the following becomes true:
1. Product adds a shared-device or multi-user-on-one-profile use case as a supported scenario (today it is explicitly out of scope).
2. A real incident or user report surfaces plaintext IndexedDB read as an actual exploited vector (not just theoretical).
3. Product requirements add compliance obligations (e.g. institutional data-handling policy) that require at-rest encryption regardless of threat likelihood.

If revisited, the follow-up ADR must specify: key derivation (e.g. PBKDF2/Argon2 from a user passphrase), recovery UX (explicitly no recovery, or a recovery-code export flow), performance budget for encrypt/decrypt on autosave, and a schema-version migration path for existing unencrypted projects (opt-in re-encrypt, not silent).

## Consequences

- `ThreatModel.md` T4 residual risk stands as documented: plaintext at rest is accepted risk, mitigated only by (a) no cloud sync reducing blast radius, (b) user-initiated delete/clear controls, (c) XSS defenses in `Security.md` §1 remaining the actual primary control.
- Docs/UI must not claim "encrypted" or "private" in an absolute sense anywhere — `AiSettingsPanel.tsx` and marketing/README copy should be checked for this phrasing during the same pass (see contract M checklist item on user-facing privacy copy).
- No code change required by this ADR itself (decision-only, per contract M out-of-scope: "Tự triển khai encryption trong docs contract" is explicitly excluded).
