import { NextResponse } from "next/server";
import { createRateLimiter, pdfAddressIdentity } from "@/lib/server/rate-limit";
import { issuePdfTicket, hashHtmlPayload } from "@/lib/server/pdf-access";

const consumeTicketRateLimit = createRateLimiter({ namespace: "pdf-ticket", requests: 10, windowSeconds: 60 });

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 400 });
  }

  // Sec-Fetch-Site check for browser clients
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite === "cross-site") {
    return NextResponse.json({ error: "Cross-site ticket issuance denied." }, { status: 403 });
  }

  const limit = await consumeTicketRateLimit(pdfAddressIdentity(req));
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

    const ticket = issuePdfTicket(htmlHash);
    const expiresAt = Date.now() + 300_000; // 5 minutes

    return NextResponse.json({
      ticket,
      expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
}
