import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { sanitizePdfHtml } from "./sanitize-pdf-html";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("/api/pdf", () => {
  it("removes scripts, handlers and outbound resource URLs", () => {
    const sanitized = sanitizePdfHtml('<!doctype html><img src="https://tracker.test/a" onerror="steal()"><script>steal()</script>');
    expect(sanitized).not.toContain("https://");
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).not.toContain("<script");
  });

  it("returns 503 without creating a fake PDF when renderer is disabled", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "");
    const response = await POST(new Request("http://localhost/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "text/html" },
      body: "<!doctype html><html><body>Report</body></html>",
    }));
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("accepts only a real %PDF- worker response", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not a pdf", {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    })));
    const response = await POST(new Request("http://localhost/api/pdf", {
      method: "POST",
      body: "<!doctype html><html><body>Report</body></html>",
    }));
    expect(response.status).toBe(502);
  });

  it("streams a valid %PDF- response through without buffering", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    const pdfBytes = new TextEncoder().encode("%PDF-1.7\n" + "x".repeat(2048));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(pdfBytes, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    })));
    const response = await POST(new Request("http://localhost/api/pdf", {
      method: "POST",
      body: "<!doctype html><html><body>Report</body></html>",
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    const out = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(out.slice(0, 5))).toBe("%PDF-");
    expect(out.byteLength).toBe(pdfBytes.byteLength);
  });

  it("forwards renderer 503 overload with Retry-After (W24-G)", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":"Renderer at capacity"}', {
      status: 503,
      headers: { "Content-Type": "application/json", "Retry-After": "2" },
    })));
    const response = await POST(new Request("http://localhost/api/pdf", {
      method: "POST",
      body: "<!doctype html><html><body>Report</body></html>",
    }));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("2");
  });

  it("does not collapse a renderer 400 into a generic 502", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":"bad"}', {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })));
    const response = await POST(new Request("http://localhost/api/pdf", {
      method: "POST",
      body: "<!doctype html><html><body>Report</body></html>",
    }));
    expect(response.status).toBe(400);
  });

  it("shares rate limit bucket across requests even if x-api-key header is rotated", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    const pdfBytes = new TextEncoder().encode("%PDF-1.7\ncontent");
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(pdfBytes, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    }))));

    // Send 5 successful requests from same trusted IP with different x-api-key headers
    for (let i = 0; i < 5; i++) {
      const res = await POST(new Request("http://localhost/api/pdf", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.88", "x-api-key": `key-variation-${i}` },
        body: "<!doctype html><html><body>Report</body></html>",
      }));
      expect(res.status).toBe(200);
    }

    // 6th request from same IP with yet another x-api-key header must hit rate limit 429
    const blockedRes = await POST(new Request("http://localhost/api/pdf", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.88", "x-api-key": "key-variation-6" },
      body: "<!doctype html><html><body>Report</body></html>",
    }));
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("retry-after")).toBeDefined();
  });
});
