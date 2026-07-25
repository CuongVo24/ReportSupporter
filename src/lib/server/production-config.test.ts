import { describe, expect, it } from "vitest";
import { rendererTokenIsInsecure, validateProductionConfig } from "./production-config";

const PROD_BASE = {
  NODE_ENV: "production",
  TRUSTED_PROXY_MODE: "vercel",
  TRUSTED_PROXY_HOPS: "1",
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
  RATE_LIMIT_SECRET: "a".repeat(32),
  RATE_LIMIT_SECRET_VERSION: "v1",
  OPERATOR_DIAGNOSTICS_TOKEN: "b".repeat(32),
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

  it("requires RATE_LIMIT_SECRET in production, no Redis-token fallback", () => {
    const report = validateProductionConfig({ ...PROD_BASE, RATE_LIMIT_SECRET: "" });
    expect(report.problems.map((p) => p.code)).toContain("rate_limit_secret_missing");
  });

  it("rejects a short RATE_LIMIT_SECRET", () => {
    const report = validateProductionConfig({ ...PROD_BASE, RATE_LIMIT_SECRET: "short" });
    expect(report.problems.map((p) => p.code)).toContain("rate_limit_secret_insecure");
  });

  it("requires RATE_LIMIT_SECRET_VERSION alongside the secret", () => {
    const report = validateProductionConfig({ ...PROD_BASE, RATE_LIMIT_SECRET_VERSION: "" });
    expect(report.problems.map((p) => p.code)).toContain("rate_limit_secret_version_missing");
  });

  it("requires TRUSTED_PROXY_HOPS when proxy mode needs a hop count in production", () => {
    const report = validateProductionConfig({ ...PROD_BASE, TRUSTED_PROXY_HOPS: "" });
    expect(report.problems.map((p) => p.code)).toContain("proxy_hops_invalid");
  });

  it("rejects an out-of-range TRUSTED_PROXY_HOPS", () => {
    const report = validateProductionConfig({ ...PROD_BASE, TRUSTED_PROXY_HOPS: "99" });
    expect(report.problems.map((p) => p.code)).toContain("proxy_hops_invalid");
  });

  it("requires OPERATOR_DIAGNOSTICS_TOKEN in production", () => {
    const report = validateProductionConfig({ ...PROD_BASE, OPERATOR_DIAGNOSTICS_TOKEN: "" });
    expect(report.problems.map((p) => p.code)).toContain("operator_token_missing");
  });

  it("rejects a weak OPERATOR_DIAGNOSTICS_TOKEN", () => {
    const report = validateProductionConfig({ ...PROD_BASE, OPERATOR_DIAGNOSTICS_TOKEN: "short" });
    expect(report.problems.map((p) => p.code)).toContain("operator_token_weak");
  });

  it("requires PDF_TICKET_SECRET when PDF_REMOTE_ENABLED=true", () => {
    const report = validateProductionConfig({ ...PROD_BASE, PDF_REMOTE_ENABLED: "true" });
    expect(report.problems.map((p) => p.code)).toContain("pdf_ticket_secret_missing");
    expect(report.problems.map((p) => p.code)).toContain("pdf_remote_issuer_untrusted");
  });

  it("requires an upstream-identity trusted issuer mode when remote PDF is on in production", () => {
    const report = validateProductionConfig({
      ...PROD_BASE,
      PDF_REMOTE_ENABLED: "true",
      PDF_TICKET_SECRET: "c".repeat(32),
      PDF_TICKET_SECRET_VERSION: "v1",
    });
    expect(report.problems.map((p) => p.code)).toContain("pdf_remote_issuer_untrusted");
  });

  it("passes with remote PDF fully configured behind a trusted issuer", () => {
    const report = validateProductionConfig({
      ...PROD_BASE,
      PDF_REMOTE_ENABLED: "true",
      PDF_TICKET_SECRET: "c".repeat(32),
      PDF_TICKET_SECRET_VERSION: "v1",
      PDF_TICKET_TRUSTED_ISSUER_MODE: "upstream-identity",
    });
    expect(report.problems.map((p) => p.code)).not.toContain("pdf_remote_issuer_untrusted");
    expect(report.problems.map((p) => p.code)).not.toContain("pdf_ticket_secret_missing");
  });

  it("rejects reusing the same secret value across RATE_LIMIT_SECRET and PDF_TICKET_SECRET", () => {
    const shared = "d".repeat(32);
    const report = validateProductionConfig({
      ...PROD_BASE,
      RATE_LIMIT_SECRET: shared,
      PDF_REMOTE_ENABLED: "true",
      PDF_TICKET_SECRET: shared,
      PDF_TICKET_SECRET_VERSION: "v1",
      PDF_TICKET_TRUSTED_ISSUER_MODE: "upstream-identity",
    });
    expect(report.problems.map((p) => p.code)).toContain("secret_cross_purpose_reuse");
  });

  it("rejects PDF_RENDERER_URL with userinfo, query, or fragment", () => {
    const withCreds = validateProductionConfig({
      ...PROD_BASE,
      PDF_RENDERER_URL: "https://user:pass@pdf.internal",
      PDF_RENDERER_TOKEN: "renderer-secret-token",
    });
    expect(withCreds.problems.map((p) => p.code)).toContain("pdf_url_credentials");

    const withQuery = validateProductionConfig({
      ...PROD_BASE,
      PDF_RENDERER_URL: "https://pdf.internal/render?x=1",
      PDF_RENDERER_TOKEN: "renderer-secret-token",
    });
    expect(withQuery.problems.map((p) => p.code)).toContain("pdf_url_query");

    const withFragment = validateProductionConfig({
      ...PROD_BASE,
      PDF_RENDERER_URL: "https://pdf.internal/#frag",
      PDF_RENDERER_TOKEN: "renderer-secret-token",
    });
    expect(withFragment.problems.map((p) => p.code)).toContain("pdf_url_fragment");
  });

  it("rejects a non-https PDF_RENDERER_URL in production without an explicit host allowlist", () => {
    const report = validateProductionConfig({
      ...PROD_BASE,
      PDF_RENDERER_URL: "http://pdf.internal",
      PDF_RENDERER_TOKEN: "renderer-secret-token",
    });
    expect(report.problems.map((p) => p.code)).toContain("pdf_url_format");
  });

  it("validates PDF renderer numeric envs and the body-read/render-deadline hierarchy", () => {
    const report = validateProductionConfig({
      ...PROD_BASE,
      PDF_RENDERER_URL: "https://pdf.internal",
      PDF_RENDERER_TOKEN: "renderer-secret-token",
      PDF_RENDER_DEADLINE_MS: "10000",
      PDF_BODY_READ_TIMEOUT_MS: "20000",
    });
    expect(report.problems.map((p) => p.code)).toContain("deadline_hierarchy_invalid");
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
