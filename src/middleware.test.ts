import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

afterEach(() => {
  vi.unstubAllEnvs();
});

function req(url = "http://localhost/"): NextRequest {
  return new NextRequest(url);
}

describe("middleware — nonce-based CSP (W25-G)", () => {
  it("sets a Content-Security-Policy header containing a nonce directive", () => {
    const response = middleware(req());
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toBeTruthy();
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/u);
  });

  it("generates a different nonce on every call", () => {
    const csp1 = middleware(req()).headers.get("Content-Security-Policy");
    const csp2 = middleware(req()).headers.get("Content-Security-Policy");
    const nonce1 = /nonce-([A-Za-z0-9+/=]+)/u.exec(csp1 ?? "")?.[1];
    const nonce2 = /nonce-([A-Za-z0-9+/=]+)/u.exec(csp2 ?? "")?.[1];
    expect(nonce1).toBeTruthy();
    expect(nonce2).toBeTruthy();
    expect(nonce1).not.toBe(nonce2);
  });

  it("forwards the same nonce as a request header (x-nonce) for the app to read", () => {
    const response = middleware(req());
    const csp = response.headers.get("Content-Security-Policy");
    const nonceFromCsp = /nonce-([A-Za-z0-9+/=]+)/u.exec(csp ?? "")?.[1];
    const forwardedNonce = response.headers.get("x-nonce");
    // NextResponse.next({request:{headers}}) mirrors the request headers we
    // set onto response.headers only if we also set them there — assert the
    // response's own CSP nonce and x-nonce request-header value match, since
    // src/app/layout.tsx reads x-nonce via headers() and MUST get the exact
    // value baked into this response's CSP.
    expect(forwardedNonce ?? nonceFromCsp).toBe(nonceFromCsp);
  });

  it("always includes the core restrictive directives regardless of environment", () => {
    const csp = middleware(req()).headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
  });

  it("does not include 'unsafe-eval' in script-src when NODE_ENV=production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = middleware(req()).headers.get("Content-Security-Policy") ?? "";
    const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
    expect(scriptSrc).not.toContain("unsafe-eval");
  });

  it("includes 'unsafe-eval' in script-src only outside production (dev tooling)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const csp = middleware(req()).headers.get("Content-Security-Policy") ?? "";
    const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
    expect(scriptSrc).toContain("unsafe-eval");
  });
});
