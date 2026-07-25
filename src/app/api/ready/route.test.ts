import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

describe("/api/ready Public vs Diagnostics Readiness (W25-J)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns generic { ready: true } body to public callers without internal cause codes", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TRUSTED_PROXY_MODE", "none");

    const response = await GET(new Request("http://localhost/api/ready"));
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.ready).toBe(true);
    expect(data.causes).toBeUndefined();
  });

  it("returns detailed causes to authorized operator with x-operator-token header", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_DIAGNOSTICS_TOKEN", "secret-operator-token-123");
    vi.stubEnv("TRUSTED_PROXY_MODE", "none");

    const req = new Request("http://localhost/api/ready", {
      headers: { "x-operator-token": "secret-operator-token-123" },
    });

    const response = await GET(req);
    expect(response.status).toBe(503);
    const data = await response.json();

    expect(data.ready).toBe(false);
    expect(data.causes).toBeDefined();
    expect(data.causes).toContain("config_missing");
    expect(data.causes).toContain("proxy_mode_shared_bucket");
  });

  it("rejects renderer redirects and marks renderer_unready when probe receives HTTP 302", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PDF_RENDERER_URL", "http://renderer.internal");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, {
      status: 302,
      headers: { Location: "http://attacker.com/canary" },
    })));

    const req = new Request("http://localhost/api/ready?diagnostics=1");
    const response = await GET(req);
    expect(response.status).toBe(503);
    const data = await response.json();

    expect(data.causes).toBeDefined();
    expect(data.causes).toContain("renderer_unready");
  });
});
