import { NextResponse, type NextRequest } from "next/server";

// W25-G: per-request nonce-based CSP. next.config.ts's `headers()` is
// evaluated once at build time and cannot mint a fresh nonce per request,
// so the CSP (and only the CSP — the other static security headers stay in
// next.config.ts) moves here. Next.js automatically applies the nonce it
// finds on the CSP response header to its own RSC/hydration inline
// scripts; app code reads the same nonce via `headers()` (see
// src/app/layout.tsx) to apply it to the theme-bootstrap inline script.
function buildCsp(nonce: string): string {
  // Read per-call (not module-scope) so tests can stub NODE_ENV and so a
  // long-lived process never gets stuck with a stale value.
  const isDevelopment = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets nonce'd scripts load further scripts they
    // insert (Next's own chunking) without allowlisting each URL.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com${isDevelopment ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Apply to every route except static assets / Next internals, which
    // don't render HTML and don't need a CSP header.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
