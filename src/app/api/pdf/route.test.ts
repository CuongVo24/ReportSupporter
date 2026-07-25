import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { sanitizePdfHtml } from "./sanitize-pdf-html";
import { issuePdfTicket, hashHtmlPayload } from "@/lib/server/pdf-access";

beforeEach(() => {
  vi.stubEnv("PDF_REMOTE_ENABLED", "true");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function createValidPdfRequest(html: string, extraHeaders?: Record<string, string>): Request {
  const htmlHash = hashHtmlPayload(html);
  const ticket = issuePdfTicket(htmlHash, "anonymous");

  return new Request("http://localhost/api/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "x-pdf-ticket": ticket,
      ...extraHeaders,
    },
    body: html,
  });
}

describe("/api/pdf Access Policy & Render Tickets (W25-C)", () => {
  it("returns 503 when remote PDF rendering is disabled (default OFF)", async () => {
    vi.stubEnv("PDF_REMOTE_ENABLED", "false");
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    const response = await POST(createValidPdfRequest("<!doctype html><html><body>Report</body></html>"));
    expect(response.status).toBe(503);
  });

  it("rejects a ticket supplied via query string instead of a header", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    const html = "<!doctype html><html><body>Report</body></html>";
    const htmlHash = hashHtmlPayload(html);
    const ticket = issuePdfTicket(htmlHash, "anonymous");
    const response = await POST(new Request(`http://localhost/api/pdf?ticket=${encodeURIComponent(ticket)}`, {
      method: "POST",
      headers: { "Content-Type": "text/html;charset=utf-8" },
      body: html,
    }));
    expect(response.status).toBe(403);
  });

  it("removes scripts, handlers and outbound resource URLs", () => {
    const sanitized = sanitizePdfHtml('<!doctype html><img src="https://tracker.test/a" onerror="steal()"><script>steal()</script>');
    expect(sanitized).not.toContain("https://");
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).not.toContain("<script");
  });

  it("rejects requests missing a render capability ticket with 403", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    const response = await POST(new Request("http://localhost/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "text/html" },
      body: "<!doctype html><html><body>Report</body></html>",
    }));
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("bị từ chối");
  });

  it("rejects requests with forged/tampered tickets with 403", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    const response = await POST(new Request("http://localhost/api/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "text/html",
        "x-pdf-ticket": "forged.signature123",
      },
      body: "<!doctype html><html><body>Report</body></html>",
    }));
    expect(response.status).toBe(403);
  });

  it("rejects ticket reuse / replayed tickets with 403", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    // Isolated trusted address so this test's 2nd (rate-limit-consuming, see
    // §4.3: nonce is claimed AFTER rate limit) request doesn't share the
    // default "direct" bucket with other tests in this file.
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const isolatedAddress = { "x-forwarded-for": "dummy-hop, 203.0.113.201" };
    const html = "<!doctype html><html><body>Replay Test</body></html>";
    const pdfBytes = new TextEncoder().encode("%PDF-1.7\ncontent");
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(pdfBytes, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    }))));

    const htmlHash = hashHtmlPayload(html);
    const replayedTicket = issuePdfTicket(htmlHash, "anonymous");

    // 1st request with ticket succeeds
    const req1 = new Request("http://localhost/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "text/html", "x-pdf-ticket": replayedTicket, ...isolatedAddress },
      body: html,
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);

    // 2nd request with SAME ticket fails with 403 replayed ticket error
    const req2 = new Request("http://localhost/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "text/html", "x-pdf-ticket": replayedTicket, ...isolatedAddress },
      body: html,
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(403);
    const data = await res2.json();
    expect(data.error).toContain("anti-replay");
  });

  it("returns 503 without creating a fake PDF when renderer is disabled", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "");
    const response = await POST(createValidPdfRequest("<!doctype html><html><body>Report</body></html>"));
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("accepts only a real %PDF- worker response", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not a pdf", {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    })));
    const response = await POST(createValidPdfRequest("<!doctype html><html><body>Report</body></html>"));
    expect(response.status).toBe(502);
  });

  it("streams a valid %PDF- response through without buffering", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    const pdfBytes = new TextEncoder().encode("%PDF-1.7\n" + "x".repeat(2048));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(pdfBytes, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    })));
    const response = await POST(createValidPdfRequest("<!doctype html><html><body>Report</body></html>"));
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
    const response = await POST(createValidPdfRequest("<!doctype html><html><body>Report</body></html>"));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("2");
  });

  it("shares rate limit bucket across requests even if x-api-key header is rotated", async () => {
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    const html = "<!doctype html><html><body>Report</body></html>";
    const pdfBytes = new TextEncoder().encode("%PDF-1.7\ncontent");
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(pdfBytes, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    }))));

    // Send 5 successful requests from same trusted IP with different x-api-key headers
    for (let i = 0; i < 5; i++) {
      const res = await POST(createValidPdfRequest(html, {
        "x-forwarded-for": "203.0.113.88",
        "x-api-key": `key-variation-${i}`,
      }));
      expect(res.status).toBe(200);
    }

    // 6th request from same IP with yet another x-api-key header must hit rate limit 429
    const blockedRes = await POST(createValidPdfRequest(html, {
      "x-forwarded-for": "203.0.113.88",
      "x-api-key": "key-variation-6",
    }));
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("retry-after")).toBeDefined();
  });
});
