import { NextResponse } from "next/server";
import { createRateLimiter, pdfAddressIdentity } from "@/lib/server/rate-limit";
import { issuePdfTicket, hashHtmlPayload } from "@/lib/server/pdf-access";

const consumeTicketRateLimit = createRateLimiter({ namespace: "pdf-ticket", requests: 10, windowSeconds: 60 });

function remoteEnabled(): boolean {
  return process.env.PDF_REMOTE_ENABLED?.trim().toLowerCase() === "true";
}

/**
 * This product has no account/session system, so a public anonymous issuer
 * cannot create a real authorization boundary by signing a token (see
 * w25_fix-all-bugs.md §4.2). PDF_TICKET_TRUSTED_ISSUER_MODE=upstream-identity
 * declares that this deployment sits behind a trusted reverse proxy which
 * authenticates the caller and sets X-Verified-Identity itself — the same
 * trust model already required for TRUSTED_PROXY_MODE in rate-limit.ts.
 * Outside that mode (local dev / anonymous-by-design deployments), issuance
 * stays available but the ticket is bound to an "anonymous" subject so it
 * never gets confused with an authenticated capability.
 */
function resolveTrustedSubject(req: Request): { sub: string; trusted: boolean } {
  const mode = process.env.PDF_TICKET_TRUSTED_ISSUER_MODE?.trim().toLowerCase();
  if (mode === "upstream-identity") {
    const identity = req.headers.get("x-verified-identity")?.trim();
    return identity ? { sub: identity, trusted: true } : { sub: "", trusted: false };
  }
  return { sub: "anonymous", trusted: process.env.NODE_ENV !== "production" };
}

export async function POST(req: Request) {
  if (!remoteEnabled()) {
    return NextResponse.json({ error: "Remote PDF rendering is disabled on this deployment." }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 400 });
  }

  // Sec-Fetch-Site check for browser clients. A MISSING header is only
  // trusted outside production (see /api/pdf/route.ts for the same policy).
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return NextResponse.json({ error: "Cross-site ticket issuance denied." }, { status: 403 });
  }
  if (!fetchSite && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Cross-site ticket issuance denied." }, { status: 403 });
  }

  const { sub, trusted } = resolveTrustedSubject(req);
  if (!trusted) {
    return NextResponse.json(
      { error: "PDF ticket issuance requires a trusted upstream identity on this deployment." },
      { status: 403 },
    );
  }

  const limit = await consumeTicketRateLimit(pdfAddressIdentity(req));
  if (!limit.available) {
    return NextResponse.json({ error: "PDF ticket rate limiter is unavailable." }, { status: 503 });
  }
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many ticket requests. Please retry shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const body = await req.json();
    let htmlHash = typeof body.htmlHash === "string" ? body.htmlHash.trim() : "";
    if (!htmlHash && typeof body.html === "string") {
      htmlHash = hashHtmlPayload(body.html);
    }

    if (!htmlHash || !/^[a-f0-9]{64}$/i.test(htmlHash)) {
      return NextResponse.json({ error: "Valid SHA-256 htmlHash or html content required." }, { status: 400 });
    }

    const ticket = issuePdfTicket(htmlHash, sub);
    const expiresAt = Date.now() + 300_000; // 5 minutes

    return NextResponse.json({
      ticket,
      expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
}
