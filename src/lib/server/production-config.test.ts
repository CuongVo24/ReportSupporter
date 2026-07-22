import { describe, expect, it } from "vitest";
import { rendererTokenIsInsecure, validateProductionConfig } from "./production-config";

const PROD_BASE = {
  NODE_ENV: "production",
  TRUSTED_PROXY_MODE: "vercel",
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
};

describe("validateProductionConfig", () => {
  it("passes for a complete production config (no PDF)", () => {
    const report = validateProductionConfig(PROD_BASE);
    expect(report.ok).toBe(true);
  });

  it("fails when Redis env is missing in production", () => {
    const report = validateProductionConfig({ ...PROD_BASE, UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" });
    expect(report.ok).toBe(false);
    expect(report.problems.map((p) => p.code)).toContain("redis_missing");
  });

  it("fails when only half the Redis pair is set", () => {
    const report = validateProductionConfig({ ...PROD_BASE, UPSTASH_REDIS_REST_TOKEN: "" });
    expect(report.problems.map((p) => p.code)).toContain("redis_incomplete");
  });

  it("flags production TRUSTED_PROXY_MODE=none as a shared bucket", () => {
    const report = validateProductionConfig({ ...PROD_BASE, TRUSTED_PROXY_MODE: "none" });
    expect(report.problems.map((p) => p.code)).toContain("proxy_mode_shared_bucket");
  });

  it("rejects an invalid proxy mode", () => {
    const report = validateProductionConfig({ ...PROD_BASE, TRUSTED_PROXY_MODE: "wild" });
    expect(report.problems.map((p) => p.code)).toContain("proxy_mode_invalid");
  });

  it("requires a PDF token when the renderer URL is set", () => {
    const report = validateProductionConfig({ ...PROD_BASE, PDF_RENDERER_URL: "https://pdf.internal", PDF_RENDERER_TOKEN: "" });
    expect(report.problems.map((p) => p.code)).toContain("pdf_token_missing");
  });

  it("rejects the local default PDF token in production", () => {
    const report = validateProductionConfig({ ...PROD_BASE, PDF_RENDERER_URL: "https://pdf.internal", PDF_RENDERER_TOKEN: "local-render-token" });
    expect(report.problems.map((p) => p.code)).toContain("pdf_token_insecure");
  });

  it("never leaks a secret value in diagnostics", () => {
    const report = validateProductionConfig({ ...PROD_BASE, UPSTASH_REDIS_REST_TOKEN: "" });
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("https://example.upstash.io");
  });

  it("is lenient in development (memory limiter, no Redis required)", () => {
    const report = validateProductionConfig({ NODE_ENV: "development", TRUSTED_PROXY_MODE: "none" });
    expect(report.ok).toBe(true);
  });
});

describe("rendererTokenIsInsecure", () => {
  it("returns null outside production", () => {
    expect(rendererTokenIsInsecure({ NODE_ENV: "development", PDF_RENDERER_TOKEN: "" })).toBeNull();
  });
  it("flags empty token in production", () => {
    expect(rendererTokenIsInsecure({ NODE_ENV: "production", PDF_RENDERER_TOKEN: "" })?.code).toBe("pdf_token_missing");
  });
  it("flags the local default token in production", () => {
    expect(rendererTokenIsInsecure({ NODE_ENV: "production", PDF_RENDERER_TOKEN: "local-render-token" })?.code).toBe("pdf_token_insecure");
  });
});
