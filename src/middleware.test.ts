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
    // NextResponse.next({request:{headers}}) does NOT copy overridden request
    // headers onto response.headers directly — Next encodes them as
    // `x-middleware-request-<name>` (+ `x-middleware-override-headers` listing
    // the overridden names), which the Next server reads to reconstruct the
    // forwarded request. Assert against that real mechanism, not a
    // response.headers.get("x-nonce") read that would silently be null.
    const overrideList = response.headers.get("x-middleware-override-headers");
    const forwardedNonce = response.headers.get("x-middleware-request-x-nonce");
    expect(nonceFromCsp).toBeTruthy();
    expect(overrideList).toContain("x-nonce");
    expect(forwardedNonce).toBe(nonceFromCsp);
  });

  it("forwards a different nonce to the request on each call, matching that call's CSP", () => {
    const response1 = middleware(req());
    const response2 = middleware(req());
    const forwarded1 = response1.headers.get("x-middleware-request-x-nonce");
    const forwarded2 = response2.headers.get("x-middleware-request-x-nonce");
    expect(forwarded1).toBeTruthy();
    expect(forwarded2).toBeTruthy();
    expect(forwarded1).not.toBe(forwarded2);
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
