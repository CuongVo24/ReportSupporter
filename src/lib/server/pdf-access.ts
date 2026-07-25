// W25-C: PDF Render Capability Ticket Issuer & Verifier
//
// Flow (see w25_fix-all-bugs.md §4.3): the gateway route MUST call
// verifyTicketEnvelope() first (signature + static claims, no side effect),
// run rate-limit/body checks, THEN call claimTicketNonce() atomically right
// before invoking the renderer. Never combine verify+claim into one call —
// that burns the single-use nonce even when a later phase (rate limit,
// oversized body) rejects the request, letting one legitimate ticket get
// invalidated by an unrelated failure.
import crypto from "node:crypto";
import { Redis } from "@upstash/redis";

const DEV_FALLBACK_SECRET = "dev-only-pdf-ticket-secret-DO-NOT-USE-IN-PRODUCTION";
const TICKET_ISSUER = "report-supporter-pdf-ticket-issuer";
const TICKET_AUDIENCE = "report-supporter-pdf-gateway";
const TICKET_VERSION = 1;
const MAX_TTL_SECONDS = 600; // reject tickets minted with an unreasonably long TTL
const CLOCK_SKEW_SECONDS = 10;

function ticketSigningSecret(): { secret: string; version: string } {
  const secret = process.env.PDF_TICKET_SECRET?.trim();
  const version = process.env.PDF_TICKET_SECRET_VERSION?.trim() || "v1";
  if (secret) return { secret, version };
  if (process.env.NODE_ENV === "production") {
    // production-config.ts / predeploy should already block boot without this.
    // Fail closed here too rather than silently signing with a guessable secret.
    throw new Error(
      "PDF_TICKET_SECRET missing in production — refusing to sign/verify with an insecure fallback.",
    );
  }
  return { secret: DEV_FALLBACK_SECRET, version: "dev" };
}

export type PdfTicketPayload = {
  ver: number;
  iss: string;
  aud: string;
  jobId: string;
  sub: string; // bound upstream identity, or "anonymous" only when issuer allows it (dev/test)
  htmlHash: string;
  sizeClass: "default";
  iat: number; // Unix epoch seconds
  nbf: number; // Unix epoch seconds
  exp: number; // Unix epoch seconds
};

/**
 * Computes a SHA-256 hex digest of the raw HTML payload string.
 */
export function hashHtmlPayload(html: string): string {
  return crypto.createHash("sha256").update(html, "utf8").digest("hex");
}

/**
 * Issues a signed, short-lived PDF render capability ticket (TTL default 5 minutes).
 * `sub` must be a real upstream-verified identity in production (see §4.2); the
 * issuer route is responsible for refusing to call this with an untrusted subject.
 */
export function issuePdfTicket(htmlHash: string, sub: string, ttlSeconds = 300): string {
  // Only clamp the upper bound — the real caller (ticket/route.ts) always
  // passes the hardcoded default, but tests intentionally pass a negative
  // ttlSeconds to mint an already-expired ticket.
  const boundedTtl = Math.min(ttlSeconds, MAX_TTL_SECONDS);
  const now = Math.floor(Date.now() / 1000);
  const payload: PdfTicketPayload = {
    ver: TICKET_VERSION,
    iss: TICKET_ISSUER,
    aud: TICKET_AUDIENCE,
    jobId: crypto.randomUUID(),
    sub,
    htmlHash,
    sizeClass: "default",
    iat: now,
    nbf: now - CLOCK_SKEW_SECONDS,
    exp: now + boundedTtl,
  };

  const { secret, version } = ticketSigningSecret();
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const hmac = crypto.createHmac("sha256", secret).update(`${version}.${payloadB64}`).digest("base64url");

  return `${version}.${payloadB64}.${hmac}`;
}

export type TicketEnvelopeError =
  | "MISSING_TICKET"
  | "INVALID_SIGNATURE"
  | "SECRET_VERSION_MISMATCH"
  | "MALFORMED_PAYLOAD"
  | "EXPIRED_TICKET"
  | "NOT_YET_VALID"
  | "TTL_TOO_LONG"
  | "AUDIENCE_MISMATCH"
  | "ISSUER_MISMATCH"
  | "VERSION_MISMATCH";

export type TicketEnvelopeResult =
  | { valid: true; payload: PdfTicketPayload }
  | { valid: false; code: TicketEnvelopeError; reason: string };

/**
 * Verifies ticket signature and static claims (ver/iss/aud/exp/nbf/TTL) ONLY.
 * Deliberately does NOT check htmlHash (the body has not been read yet at
 * this point in the gateway flow — see §4.3) and does NOT claim the
 * anti-replay nonce. Callers must separately compare payload.htmlHash against
 * the actual body hash once the body has been read, then call
 * claimTicketNonce() right before invoking the renderer.
 */
export function verifyTicketEnvelope(ticket: string | undefined | null): TicketEnvelopeResult {
  if (!ticket || typeof ticket !== "string") {
    return { valid: false, code: "MISSING_TICKET", reason: "Missing PDF render capability ticket." };
  }

  const parts = ticket.split(".");
  if (parts.length !== 3) {
    return { valid: false, code: "INVALID_SIGNATURE", reason: "Malformed ticket format." };
  }
  const [tokenVersion, payloadB64, signature] = parts;
  if (!tokenVersion || !payloadB64 || !signature) {
    return { valid: false, code: "INVALID_SIGNATURE", reason: "Malformed ticket format." };
  }

  const { secret, version: activeVersion } = ticketSigningSecret();
  if (tokenVersion !== activeVersion) {
    return {
      valid: false,
      code: "SECRET_VERSION_MISMATCH",
      reason: "Ticket was signed with a different secret version.",
    };
  }

  const expectedHmac = crypto.createHmac("sha256", secret).update(`${tokenVersion}.${payloadB64}`).digest("base64url");
  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedHmac, "utf8");
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, code: "INVALID_SIGNATURE", reason: "Ticket HMAC signature verification failed." };
  }

  let payload: PdfTicketPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { valid: false, code: "MALFORMED_PAYLOAD", reason: "Failed to parse ticket payload JSON." };
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.jobId !== "string" ||
    !payload.jobId ||
    typeof payload.htmlHash !== "string" ||
    typeof payload.sub !== "string" ||
    !Number.isFinite(payload.exp) ||
    !Number.isFinite(payload.nbf) ||
    !Number.isFinite(payload.iat)
  ) {
    return { valid: false, code: "MALFORMED_PAYLOAD", reason: "Ticket payload failed schema validation." };
  }

  if (payload.ver !== TICKET_VERSION) {
    return { valid: false, code: "VERSION_MISMATCH", reason: "Unsupported ticket version." };
  }
  if (payload.iss !== TICKET_ISSUER) {
    return { valid: false, code: "ISSUER_MISMATCH", reason: "Unexpected ticket issuer." };
  }
  if (payload.aud !== TICKET_AUDIENCE) {
    return { valid: false, code: "AUDIENCE_MISMATCH", reason: "Ticket audience does not match this gateway." };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp - payload.iat > MAX_TTL_SECONDS) {
    return { valid: false, code: "TTL_TOO_LONG", reason: "Ticket TTL exceeds the maximum allowed window." };
  }
  if (payload.exp <= now) {
    return { valid: false, code: "EXPIRED_TICKET", reason: "PDF render ticket has expired." };
  }
  if (payload.nbf - CLOCK_SKEW_SECONDS > now) {
    return { valid: false, code: "NOT_YET_VALID", reason: "PDF render ticket is not yet valid (nbf in the future)." };
  }

  return { valid: true, payload };
}

// ---------------------------------------------------------------------------
// Anti-replay nonce claim (W25-C)
//
// Production MUST use the shared Redis store (atomic SET NX EX) so replay
// protection holds across multiple app instances. A process-local Map is
// only acceptable as a dev/test convenience when Redis credentials are not
// configured and NODE_ENV !== production; production with no Redis fails
// closed instead of silently falling back to an unsafe in-memory store.
// ---------------------------------------------------------------------------

const devMemoryNonceStore = new Map<string, number>();

function cleanupDevMemoryNonces(now: number): void {
  for (const [jobId, exp] of devMemoryNonceStore) {
    if (exp <= now) devMemoryNonceStore.delete(jobId);
  }
}

export type NonceClaimResult = { claimed: true } | { claimed: false; available: boolean };

/**
 * Atomically claims a ticket's jobId so it can never be used again. Call
 * exactly once, immediately before invoking the renderer, after all other
 * checks (rate limit, body validation, hash match) have passed.
 */
export async function claimTicketNonce(payload: PdfTicketPayload): Promise<NonceClaimResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const ttlSeconds = Math.max(1, payload.exp - Math.floor(Date.now() / 1000));

  if (url && token) {
    try {
      const redis = new Redis({ url, token });
      const result = await redis.set(`pdf-ticket-nonce:${payload.jobId}`, "1", {
        nx: true,
        ex: ttlSeconds,
      });
      return result === "OK" ? { claimed: true } : { claimed: false, available: true };
    } catch {
      return { claimed: false, available: false };
    }
  }

  if (process.env.NODE_ENV === "production") {
    // No Redis in production: fail closed rather than using a per-instance
    // Map that a load-balanced deployment could bypass by retrying against
    // a different instance.
    return { claimed: false, available: false };
  }

  const now = Math.floor(Date.now() / 1000);
  cleanupDevMemoryNonces(now);
  if (devMemoryNonceStore.has(payload.jobId)) {
    return { claimed: false, available: true };
  }
  devMemoryNonceStore.set(payload.jobId, now + ttlSeconds);
  return { claimed: true };
}
