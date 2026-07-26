import { NextResponse } from "next/server";
import { createRateLimiter, pdfAddressIdentity } from "@/lib/server/rate-limit";
import { verifyTicketEnvelope, claimTicketNonce, hashHtmlPayload } from "@/lib/server/pdf-access";
import { readBoundedBody } from "@/lib/server/bounded-body";
import { stripKnownPdfHazardsBestEffort } from "./sanitize-pdf-html";

const MAX_BODY_BYTES = 25 * 1024 * 1024;
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const BODY_READ_IDLE_MS = 10_000;
const BODY_READ_TOTAL_MS = 20_000;

// W24-G deadline hierarchy: renderer operation < gateway < browser client.
const GATEWAY_DEADLINE_MS = Number(process.env.PDF_GATEWAY_DEADLINE_MS || "45000");

const consumePdfRateLimit = createRateLimiter({ namespace: "pdf", requests: 5, windowSeconds: 60 });

// Stable, generic public messages — never echo ticketResult.reason, cause
// codes, token fragments, or renderer topology to the client.
const DENIED_MESSAGE = "Yêu cầu tạo PDF bị từ chối.";
const GENERIC_ERROR = "Không thể xử lý yêu cầu tạo PDF.";

function jsonError(message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers });
}

function remoteEnabled(): boolean {
  return process.env.PDF_REMOTE_ENABLED?.trim().toLowerCase() === "true";
}

function extractTicket(request: Request): string | null {
  // Header only — a capability ticket in the query string leaks into logs,
  // browser history, and Referer headers. Keep exactly one canonical header
  // so proxies/log filters have one secret-bearing surface to protect.
  return request.headers.get("x-pdf-ticket");
}

function rendererConfig(): { url: string; token: string } | null {
  const rawUrl = process.env.PDF_RENDERER_URL?.trim();
  const token = process.env.PDF_RENDERER_TOKEN?.trim();
  if (!rawUrl || !token) return null;
  try {
    const parsed = new URL(rawUrl);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return { url: parsed.toString().replace(/\/$/u, ""), token };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Step 1: feature flag, method/media type, Fetch Metadata/Origin, header sizes.
  if (!remoteEnabled()) {
    return jsonError(
      "Dịch vụ tạo PDF từ xa hiện không bật trên triển khai này. Hãy dùng Print Preview cục bộ.",
      503,
    );
  }

  // Validate every non-consuming dependency before inspecting/claiming a
  // one-time capability. A deployment fault must never burn a valid ticket.
  const renderer = rendererConfig();
  if (!renderer) {
    return jsonError(
      "Dịch vụ tạo PDF hiện không khả dụng. Hãy dùng Print Preview cục bộ hoặc thử lại sau.",
      503,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonError("HTML tạo PDF vượt quá giới hạn 25 MiB.", 413);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) {
    return jsonError(GENERIC_ERROR, 400);
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return jsonError("Cross-site PDF render requests denied.", 403);
  }
  // Explicit policy for a MISSING Fetch Metadata header — this endpoint is
  // only ever called from same-origin browser JS (export-pdf.ts), so in
  // production the header's absence (not "same-origin"/"none", which real
  // browsers always send) is itself suspicious rather than implicitly
  // trusted. Left lenient outside production so non-browser dev/test clients
  // keep working.
  if (!fetchSite && process.env.NODE_ENV === "production") {
    return jsonError("Cross-site PDF render requests denied.", 403);
  }

  // Step 2: verify ticket signature + static claims (ver/iss/aud/exp/nbf/TTL).
  // Deliberately does NOT read the body or claim the nonce yet.
  const ticket = extractTicket(request);
  const envelope = verifyTicketEnvelope(ticket);
  if (!envelope.valid) {
    console.log(JSON.stringify({ evt: "pdf_gateway_denied", phase: "envelope", cause: envelope.code }));
    return jsonError(DENIED_MESSAGE, 403);
  }

  // Step 3: rate limit (backend availability, then quota).
  const limit = await consumePdfRateLimit(pdfAddressIdentity(request));
  if (!limit.available) {
    return jsonError("PDF rate limiter is unavailable.", 503);
  }
  if (!limit.allowed) {
    return jsonError("Too many PDF requests. Please retry shortly.", 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  // Step 4: read body via bounded stream (byte cap + idle/total deadline).
  const bodyResult = await readBoundedBody(request, MAX_BODY_BYTES, BODY_READ_IDLE_MS, BODY_READ_TOTAL_MS);
  if (!bodyResult.ok) {
    console.log(JSON.stringify({ evt: "pdf_gateway_denied", phase: "body_read", status: bodyResult.status }));
    return jsonError(
      bodyResult.status === 413 ? "HTML tạo PDF vượt quá giới hạn 25 MiB." : GENERIC_ERROR,
      bodyResult.status,
    );
  }
  const rawHtml = bodyResult.text;
  if (!/^\s*<!doctype html>/iu.test(rawHtml)) {
    return jsonError("PDF renderer requires a complete HTML document.", 400);
  }

  // Step 5: compare htmlHash / jobId / sizeClass against the verified envelope.
  const htmlHash = hashHtmlPayload(rawHtml);
  if (envelope.payload.htmlHash !== htmlHash || !envelope.payload.jobId) {
    console.log(JSON.stringify({ evt: "pdf_gateway_denied", phase: "hash_match" }));
    return jsonError(DENIED_MESSAGE, 403);
  }

  // Step 6: atomically claim the single-use nonce — only now, after renderer
  // configuration is known to be usable and immediately before the call.
  // the renderer call, so an earlier failure (rate limit, oversized body)
  // never burns a still-valid ticket.
  const claim = await claimTicketNonce(envelope.payload);
  if (!claim.claimed) {
    if (!claim.available) {
      return jsonError("PDF gateway anti-replay store is unavailable.", 503);
    }
    console.log(JSON.stringify({ evt: "pdf_gateway_denied", phase: "replay" }));
    return jsonError(DENIED_MESSAGE, 403);
  }

  // Step 7: call the internal renderer service with a bounded request.
  const deadline = AbortSignal.timeout(GATEWAY_DEADLINE_MS);
  const combined = AbortSignal.any([request.signal, deadline]);

  let response: globalThis.Response;
  try {
    response = await fetch(`${renderer.url}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        "x-render-token": renderer.token,
      },
      body: stripKnownPdfHazardsBestEffort(rawHtml),
      redirect: "manual",
      signal: combined,
    });
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel().catch(() => undefined);
      return jsonError("PDF renderer redirected unexpectedly.", 502);
    }
  } catch (error: unknown) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    const timedOut = error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
    return jsonError(
      timedOut ? "PDF renderer timed out." : "PDF renderer is unavailable.",
      timedOut ? 504 : 503,
    );
  }

  if (response.status === 503 || response.status === 429) {
    const retryAfter = response.headers.get("retry-after") ?? "5";
    await response.body?.cancel().catch(() => undefined);
    return jsonError("Dịch vụ tạo PDF đang bận. Vui lòng thử lại sau ít giây.", response.status, {
      "Retry-After": retryAfter,
    });
  }
  if (response.status === 401 || response.status === 400 || response.status === 413) {
    await response.body?.cancel().catch(() => undefined);
    return jsonError(
      response.status === 413 ? "Tài liệu vượt giới hạn kích thước." : "Yêu cầu tạo PDF không hợp lệ.",
      response.status,
    );
  }
  if (!response.ok || !response.body) {
    await response.body?.cancel().catch(() => undefined);
    return jsonError("PDF renderer rejected the document.", 502);
  }

  const rendererContentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (rendererContentType !== "application/pdf") {
    await response.body.cancel().catch(() => undefined);
    return jsonError("PDF renderer returned an invalid content type.", 502);
  }

  const declaredPdfLength = Number(response.headers.get("content-length") || "0");
  if (Number.isFinite(declaredPdfLength) && declaredPdfLength > MAX_PDF_BYTES) {
    await response.body.cancel().catch(() => undefined);
    return jsonError("PDF renderer returned an oversized document.", 502);
  }

  const reader = response.body.getReader();
  const prefix: Uint8Array[] = [];
  let prefixLen = 0;
  let firstDone = false;

  while (prefixLen < 5) {
    const { value, done } = await reader.read();
    if (done) {
      firstDone = true;
      break;
    }
    if (value) {
      prefix.push(value);
      prefixLen += value.byteLength;
    }
  }
  const head = new Uint8Array(prefixLen);
  {
    let offset = 0;
    for (const chunk of prefix) {
      head.set(chunk, offset);
      offset += chunk.byteLength;
    }
  }
  const signatureOk = head.length >= 5 && new TextDecoder().decode(head.slice(0, 5)) === "%PDF-";
  if (!signatureOk) {
    await reader.cancel().catch(() => undefined);
    return jsonError("PDF renderer returned an invalid PDF binary.", 502);
  }

  let forwarded = prefixLen;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (head.length > 0) controller.enqueue(head);
      if (firstDone) controller.close();
    },
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        if (value) {
          forwarded += value.byteLength;
          if (forwarded > MAX_PDF_BYTES) {
            await reader.cancel().catch(() => undefined);
            controller.error(new Error("oversized-pdf"));
            return;
          }
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) {
      void reader.cancel(reason).catch(() => undefined);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
