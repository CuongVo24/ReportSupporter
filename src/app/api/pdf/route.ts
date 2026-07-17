import { NextResponse } from "next/server";
import { createRateLimiter, rateLimitIdentity } from "@/lib/server/rate-limit";
import { sanitizePdfHtml } from "./sanitize-pdf-html";

const MAX_BODY_BYTES = 25 * 1024 * 1024;
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const consumePdfRateLimit = createRateLimiter({ namespace: "pdf", requests: 5, windowSeconds: 60 });

function isPdf(bytes: Uint8Array): boolean {
  return bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "HTML tạo PDF vượt quá giới hạn 25 MiB." }, { status: 413 });
  }

  const limit = await consumePdfRateLimit(rateLimitIdentity(
    request,
    request.headers.get("x-api-key")?.trim() || "pdf-render",
  ));
  if (!limit.available) {
    return NextResponse.json({ error: "PDF rate limiter is unavailable." }, { status: 503 });
  }
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many PDF requests. Please retry shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const rawHtml = await request.text();
  if (new TextEncoder().encode(rawHtml).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "HTML tạo PDF vượt quá giới hạn 25 MiB." }, { status: 413 });
  }
  if (!/^\s*<!doctype html>/iu.test(rawHtml)) {
    return NextResponse.json({ error: "PDF renderer requires a complete HTML document." }, { status: 400 });
  }

  const rendererUrl = process.env.PDF_RENDERER_URL?.trim();
  if (!rendererUrl) {
    return NextResponse.json({
      error: "Dịch vụ tạo PDF hiện không khả dụng. Hãy dùng Print Preview cục bộ hoặc thử lại sau.",
    }, { status: 503 });
  }

  try {
    const response = await fetch(`${rendererUrl.replace(/\/$/u, "")}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        ...(process.env.PDF_RENDERER_TOKEN
          ? { "x-render-token": process.env.PDF_RENDERER_TOKEN }
          : {}),
      },
      body: sanitizePdfHtml(rawHtml),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: "PDF renderer rejected the document." }, { status: 502 });
    }
    const declaredPdfLength = Number(response.headers.get("content-length") || "0");
    if (Number.isFinite(declaredPdfLength) && declaredPdfLength > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF renderer returned an oversized document." }, { status: 502 });
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_PDF_BYTES || !isPdf(bytes)) {
      return NextResponse.json({ error: "PDF renderer returned an invalid PDF binary." }, { status: 502 });
    }
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    const timedOut = error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({
      error: timedOut ? "PDF renderer timed out after 30 seconds." : "PDF renderer is unavailable.",
    }, { status: timedOut ? 504 : 503 });
  }
}
