import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BoundedMemorySlidingWindow,
  apiKeyFingerprint,
  createRateLimiter,
  pdfAddressIdentity,
  aiAddressIdentity,
  aiKeyIdentity,
  rateLimitIdentity,
  trustedClientAddress,
  wrapDistributedRateLimit,
} from "./rate-limit";

afterEach(() => vi.unstubAllEnvs());

describe("BoundedMemorySlidingWindow", () => {
  it("uses a sliding window and expires old requests", () => {
    const limiter = new BoundedMemorySlidingWindow(2, 1_000, 10);
    expect(limiter.consume("a", 0).allowed).toBe(true);
    expect(limiter.consume("a", 100).allowed).toBe(true);
    expect(limiter.consume("a", 200)).toMatchObject({ allowed: false, retryAfterSeconds: 1 });
    expect(limiter.consume("a", 1_001).allowed).toBe(true);
  });

  it("cleans expired buckets before insertion and enforces the hard cap", () => {
    const limiter = new BoundedMemorySlidingWindow(2, 1_000, 2);
    limiter.consume("a", 0);
    limiter.consume("b", 100);
    limiter.consume("c", 200);
    expect(limiter.size).toBe(2);
    limiter.consume("d", 1_500);
    expect(limiter.size).toBe(1);
  });
});

describe("trustedClientAddress & Ingress Parsing", () => {
  it("defaults to direct when mode is none or missing", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "none");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4", "cf-connecting-ip": "5.6.7.8" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });

  it("extracts first IP for vercel and forwarded mode", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
    });
    expect(trustedClientAddress(req)).toBe("203.0.113.195");
  });

  it("extracts cf-connecting-ip for cloudflare mode", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "cloudflare");
    const req = new Request("http://localhost", {
      headers: { "cf-connecting-ip": "198.51.100.42" },
    });
    expect(trustedClientAddress(req)).toBe("198.51.100.42");
  });

  it("extracts x-real-ip for x-real-ip mode", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "x-real-ip");
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.99" },
    });
    expect(trustedClientAddress(req)).toBe("198.51.100.99");
  });

  it("falls back to direct on malformed or invalid IP values", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "invalid-ip-with-spaces and <script>" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });
});

describe("apiKeyFingerprint & Secrets", () => {
  it("generates a 32-character hex HMAC fingerprint without raw key leakage", () => {
    vi.stubEnv("RATE_LIMIT_SECRET", "custom-secret-key-123");
    const fp1 = apiKeyFingerprint("sk-proj-secret-api-key-1");
    const fp2 = apiKeyFingerprint("sk-proj-secret-api-key-2");

    expect(fp1).toHaveLength(32);
    expect(fp1).not.toContain("sk-proj");
    expect(fp1).not.toBe(fp2);
  });
});

describe("PDF Identity Isolation", () => {
  it("does NOT change PDF bucket when x-api-key header is rotated", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    const req1 = new Request("http://localhost/api/pdf", {
      headers: { "x-forwarded-for": "198.51.100.1", "x-api-key": "key-alpha" },
    });
    const req2 = new Request("http://localhost/api/pdf", {
      headers: { "x-forwarded-for": "198.51.100.1", "x-api-key": "key-beta" },
    });

    expect(pdfAddressIdentity(req1)).toBe(pdfAddressIdentity(req2));
  });
});

describe("AI Dual Limiter Composition & Identity", () => {
  it("produces distinct identities for address and key", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    const req = new Request("http://localhost/api/ai", {
      headers: { "x-forwarded-for": "198.51.100.1" },
    });
    const addrId = aiAddressIdentity(req);
    const keyId = aiKeyIdentity("my-api-key");
    const combinedId = rateLimitIdentity(req, "my-api-key");

    expect(addrId).not.toBe(keyId);
    expect(combinedId).toBeDefined();
    expect(keyId).toBe(`ai-key-${apiKeyFingerprint("my-api-key")}`);
  });
});

describe("production distributed limiter", () => {
  it("fails closed when Redis credentials are unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const consume = createRateLimiter({ namespace: "test", requests: 1, windowSeconds: 60 });
    await expect(consume("identity")).resolves.toEqual({ allowed: false, retryAfterSeconds: 0, available: false });
  });

  it("shares a distributed window across two app instances", async () => {
    let remaining = 2;
    const sharedBackend = async () => ({ success: remaining-- > 0, reset: Date.now() + 60_000 });
    const appInstanceA = wrapDistributedRateLimit(sharedBackend);
    const appInstanceB = wrapDistributedRateLimit(sharedBackend);

    expect((await appInstanceA("same-identity")).allowed).toBe(true);
    expect((await appInstanceB("same-identity")).allowed).toBe(true);
    expect((await appInstanceA("same-identity")).allowed).toBe(false);
  });

  it("fails closed when the distributed backend throws", async () => {
    const consume = wrapDistributedRateLimit(async () => { throw new Error("redis down"); });
    await expect(consume("identity")).resolves.toEqual({ allowed: false, retryAfterSeconds: 0, available: false });
  });
});
