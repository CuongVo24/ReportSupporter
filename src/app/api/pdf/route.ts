import { NextResponse } from "next/server";
import { createRateLimiter, pdfAddressIdentity } from "@/lib/server/rate-limit";
import { verifyPdfTicket, hashHtmlPayload } from "@/lib/server/pdf-access";
import { sanitizePdfHtml } from "./sanitize-pdf-html";

const MAX_BODY_BYTES = 25 * 1024 * 1024;
const MAX_PDF_BYTES = 50 * 1024 * 1024;

// W24-G deadline hierarchy: renderer operation < gateway < browser client.
const GATEWAY_DEADLINE_MS = Number(process.env.PDF_GATEWAY_DEADLINE_MS || "45000");

const consumePdfRateLimit = createRateLimiter({ namespace: "pdf", requests: 5, windowSeconds: 60 });

function jsonError(message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  // Step 1: Early Method / Size / Fetch Metadata Check
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonError("HTML tạo PDF vượt quá giới hạn 25 MiB.", 413);
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite === "cross-site") {
    return jsonError("Cross-site PDF render requests denied.", 403);
  }

  // Step 2: Access Capability Verification (BEFORE reading full body or consuming rate limit slot)
  const rawHtml = await request.text();
  if (Buffer.byteLength(rawHtml, "utf8") > MAX_BODY_BYTES) {
    return jsonError("HTML tạo PDF vượt quá giới hạn 25 MiB.", 413);
  }
  if (!/^\s*<!doctype html>/iu.test(rawHtml)) {
    return jsonError("PDF renderer requires a complete HTML document.", 400);
  }

  const htmlHash = hashHtmlPayload(rawHtml);
  const ticket =
    request.headers.get("x-pdf-ticket") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    new URL(request.url).searchParams.get("ticket");

  const ticketResult = verifyPdfTicket(ticket, htmlHash);
  if (!ticketResult.valid) {
    return jsonError(`Yêu cầu tạo PDF bị từ chối (${ticketResult.reason}).`, 403);
  }

  // Step 3: Rate Limiting
  const limit = await consumePdfRateLimit(pdfAddressIdentity(request));
  if (!limit.available) {
    return jsonError("PDF rate limiter is unavailable.", 503);
  }
  if (!limit.allowed) {
    return jsonError("Too many PDF requests. Please retry shortly.", 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  // Step 4: Call Internal Renderer Service
  const rendererUrl = process.env.PDF_RENDERER_URL?.trim();
  if (!rendererUrl) {
    return jsonError(
      "Dịch vụ tạo PDF hiện không khả dụng. Hãy dùng Print Preview cục bộ hoặc thử lại sau.",
      503,
    );
  }

  const deadline = AbortSignal.timeout(GATEWAY_DEADLINE_MS);
  const combined = AbortSignal.any([request.signal, deadline]);

  let response: globalThis.Response;
  try {
    response = await fetch(`${rendererUrl.replace(/\/$/u, "")}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        ...(process.env.PDF_RENDERER_TOKEN
          ? { "x-render-token": process.env.PDF_RENDERER_TOKEN }
          : {}),
      },
      body: sanitizePdfHtml(rawHtml),
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
