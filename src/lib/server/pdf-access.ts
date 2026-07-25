// W25-C: PDF Render Capability Ticket Issuer & Verifier
import crypto from "node:crypto";

const DEFAULT_SECRET = "pdf-ticket-dev-secret-key-32-chars-minimum";

function getTicketSecret(): string {
  return (
    process.env.PDF_TICKET_SECRET?.trim() ||
    process.env.RATE_LIMIT_SECRET?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    DEFAULT_SECRET
  );
}

// In-memory used ticket set to prevent replay attacks within expiry window
const usedJobIds = new Map<string, number>();

function cleanupUsedJobIds() {
  const now = Math.floor(Date.now() / 1000);
  for (const [jobId, exp] of usedJobIds.entries()) {
    if (exp <= now) {
      usedJobIds.delete(jobId);
    }
  }
}

export type PdfTicketPayload = {
  jobId: string;
  exp: number; // Unix epoch in seconds
  nbf: number; // Unix epoch in seconds
  htmlHash: string;
};

/**
 * Computes a SHA-256 hex digest of the raw HTML payload string.
 */
export function hashHtmlPayload(html: string): string {
  return crypto.createHash("sha256").update(html, "utf8").digest("hex");
}

/**
 * Issues a signed, short-lived PDF render capability ticket (TTL default 5 minutes).
 */
export function issuePdfTicket(htmlHash: string, ttlSeconds = 300): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: PdfTicketPayload = {
    jobId: crypto.randomUUID(),
    nbf: now - 5,
    exp: now + ttlSeconds,
    htmlHash,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const hmac = crypto.createHmac("sha256", getTicketSecret()).update(payloadB64).digest("base64url");

  return `${payloadB64}.${hmac}`;
}

export type TicketVerificationResult =
  | { valid: true; payload: PdfTicketPayload }
  | { valid: false; code: "MISSING_TICKET" | "INVALID_SIGNATURE" | "EXPIRED_TICKET" | "REPLAYED_TICKET" | "HASH_MISMATCH"; reason: string };

/**
 * Verifies a PDF render ticket signature, expiration, replay status, and HTML hash match.
 */
export function verifyPdfTicket(ticket: string | undefined | null, htmlHash: string): TicketVerificationResult {
  if (!ticket || typeof ticket !== "string" || !ticket.includes(".")) {
    return {
      valid: false,
      code: "MISSING_TICKET",
      reason: "Missing or malformed PDF render capability ticket.",
    };
  }

  const parts = ticket.split(".");
  if (parts.length !== 2) {
    return {
      valid: false,
      code: "INVALID_SIGNATURE",
      reason: "Malformed ticket format.",
    };
  }

  const [payloadB64, signature] = parts;

  // 1. Verify HMAC signature (timing-safe)
  const expectedHmac = crypto.createHmac("sha256", getTicketSecret()).update(payloadB64).digest("base64url");
  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedHmac, "utf8");

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return {
      valid: false,
      code: "INVALID_SIGNATURE",
      reason: "Ticket HMAC signature verification failed.",
    };
  }

  // 2. Parse payload
  let payload: PdfTicketPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return {
      valid: false,
      code: "INVALID_SIGNATURE",
      reason: "Failed to parse ticket payload JSON.",
    };
  }

  const now = Math.floor(Date.now() / 1000);

  // 3. Expiration check
  if (!payload.exp || payload.exp <= now) {
    return {
      valid: false,
      code: "EXPIRED_TICKET",
      reason: "PDF render ticket has expired.",
    };
  }

  // 4. HTML Hash match check
  if (payload.htmlHash !== htmlHash) {
    return {
      valid: false,
      code: "HASH_MISMATCH",
      reason: "Ticket htmlHash does not match the provided document content.",
    };
  }

  // 5. Anti-Replay check
  cleanupUsedJobIds();
  if (usedJobIds.has(payload.jobId)) {
    return {
      valid: false,
      code: "REPLAYED_TICKET",
      reason: "PDF render ticket has already been used (anti-replay violation).",
    };
  }

  // Record jobId in used set
  usedJobIds.set(payload.jobId, payload.exp);

  return {
    valid: true,
    payload,
  };
}
