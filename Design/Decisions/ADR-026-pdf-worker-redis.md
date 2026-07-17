# ADR-026 — First-party PDF worker and Redis rate limiting

Status: Accepted (2026-07-17)

Decision: verified PDF artifacts are rendered by an isolated Node/Docker Puppeteer worker; production limits use Upstash Redis sliding windows and fail closed. Print Preview stays local and separate.

Consequences: report HTML is sent ephemerally to a first-party renderer with transparent UI notice; 25 MiB/30-second limits, no JS/outbound network, no body logging/storage. AI is 20/minute and PDF 5/minute using hashed API-key + trusted-IP identity.
