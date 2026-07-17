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
});
