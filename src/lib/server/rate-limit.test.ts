import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BoundedMemorySlidingWindow,
  apiKeyFingerprint,
  createRateLimiter,
  pdfAddressIdentity,
  aiAddressIdentity,
  aiKeyIdentity,
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

  it("vercel mode picks the client IP appended by the first trusted proxy", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    // With exactly 1 trusted proxy in front of us, that proxy appended the
    // real client's address as the LAST (rightmost) entry.
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "9.9.9.9, 70.41.3.18" },
    });
    expect(trustedClientAddress(req)).toBe("70.41.3.18");
  });

  it("vercel mode ignores attacker-prepended left-hand entries", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const spoofed = new Request("http://localhost", {
      headers: { "x-forwarded-for": "9.9.9.9, 203.0.113.195, 70.41.3.18" },
    });
    const clean = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    // Both resolve to the same trusted-hop-counted position (the last entry,
    // appended by the one trusted proxy) regardless of what a client
    // prepends on the left, proving the parser never reads attacker input.
    expect(trustedClientAddress(spoofed)).toBe("70.41.3.18");
    expect(trustedClientAddress(clean)).toBe("70.41.3.18");
  });

  it("vercel mode falls back to direct when the chain is shorter than the trusted hop count", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "3");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });

  it("vercel mode fails closed to direct (never defaults to hops=1) when TRUSTED_PROXY_HOPS is missing", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    // TRUSTED_PROXY_HOPS deliberately not set.
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "9.9.9.9, 70.41.3.18" },
    });
    // With the old silent-default-to-1 behavior this would resolve to
    // "70.41.3.18" (treating the rightmost entry as trusted). It must
    // instead fail closed to "direct" since the hop count was never
    // actually configured/validated.
    expect(trustedClientAddress(req)).toBe("direct");
  });

  it("vercel mode fails closed to direct (never defaults to hops=1) when TRUSTED_PROXY_HOPS is invalid", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "not-a-number");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "9.9.9.9, 70.41.3.18" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });

  it("forwarded mode fails closed to direct when TRUSTED_PROXY_HOPS is out of range", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "forwarded");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "0");
    const req = new Request("http://localhost", {
      headers: { forwarded: "for=70.41.3.18" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });

  it("preserves empty Forwarded elements instead of shifting the trusted hop position", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "forwarded");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "2");
    const req = new Request("http://localhost", {
      headers: { forwarded: "for=198.51.100.1, , for=203.0.113.9" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });

  it("canonicalizes equivalent IPv6 spellings into the same trusted address", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "cloudflare");
    const expanded = new Request("http://localhost", {
      headers: { "cf-connecting-ip": "2001:0db8:0000:0000:0000:0000:0000:0001" },
    });
    const compressed = new Request("http://localhost", {
      headers: { "cf-connecting-ip": "2001:db8::1" },
    });
    expect(trustedClientAddress(expanded)).toBe("2001:db8::1");
    expect(trustedClientAddress(expanded)).toBe(trustedClientAddress(compressed));
  });

  it("rejects invalid port suffixes instead of accepting them as trusted IPs", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "x-real-ip");
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "203.0.113.8:99999" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });

  it("extracts cf-connecting-ip for cloudflare mode and ignores XFF", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "cloudflare");
    const req = new Request("http://localhost", {
      headers: { "cf-connecting-ip": "198.51.100.42", "x-forwarded-for": "9.9.9.9" },
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
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "70.41.3.18, invalid-ip-with-spaces and <script>" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });

  it("strips a valid port suffix from an IPv4 address", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "70.41.3.18, 203.0.113.195:4000" },
    });
    expect(trustedClientAddress(req)).toBe("203.0.113.195");
  });

  it("parses RFC 7239 Forwarded header with quoted, bracketed IPv6", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "forwarded");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const req = new Request("http://localhost", {
      headers: { forwarded: 'for=70.41.3.18, for="[2001:db8:cafe::17]:4711"' },
    });
    expect(trustedClientAddress(req)).toBe("2001:db8:cafe::17");
  });

  it("does not trust an obfuscated Forwarded identifier", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "forwarded");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const req = new Request("http://localhost", {
      headers: { forwarded: "for=70.41.3.18, for=unknown" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });

  it("does not read x-forwarded-for when mode is forwarded (RFC 7239 only)", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "forwarded");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195" },
    });
    expect(trustedClientAddress(req)).toBe("direct");
  });
});

describe("apiKeyFingerprint & Secrets", () => {
  it("generates a versioned HMAC fingerprint without raw key leakage", () => {
    vi.stubEnv("RATE_LIMIT_SECRET", "custom-secret-key-123");
    const fp1 = apiKeyFingerprint("sk-proj-secret-api-key-1");
    const fp2 = apiKeyFingerprint("sk-proj-secret-api-key-2");

    expect(fp1).toMatch(/^v1:[0-9a-f]{32}$/u);
    expect(fp1).not.toContain("sk-proj");
    expect(fp1).not.toBe(fp2);
  });

  it("embeds RATE_LIMIT_SECRET_VERSION in the fingerprint prefix", () => {
    vi.stubEnv("RATE_LIMIT_SECRET", "custom-secret-key-123");
    vi.stubEnv("RATE_LIMIT_SECRET_VERSION", "v7");
    expect(apiKeyFingerprint("sk-key")).toMatch(/^v7:/u);
  });

  it("throws in production when RATE_LIMIT_SECRET is missing rather than using a guessable fallback", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RATE_LIMIT_SECRET", "");
    expect(() => apiKeyFingerprint("sk-key")).toThrow(/RATE_LIMIT_SECRET/);
  });
});

describe("PDF Identity Isolation", () => {
  it("does NOT change PDF bucket when x-api-key header is rotated", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const req1 = new Request("http://localhost/api/pdf", {
      headers: { "x-forwarded-for": "198.51.100.1, 70.41.3.18", "x-api-key": "key-alpha" },
    });
    const req2 = new Request("http://localhost/api/pdf", {
      headers: { "x-forwarded-for": "198.51.100.1, 70.41.3.18", "x-api-key": "key-beta" },
    });

    expect(pdfAddressIdentity(req1)).toBe(pdfAddressIdentity(req2));
  });
});

describe("AI Dual Limiter Composition & Identity", () => {
  it("produces distinct identities for address and key that both change bucket if the other is rotated", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const req = new Request("http://localhost/api/ai", {
      headers: { "x-forwarded-for": "198.51.100.1, 70.41.3.18" },
    });
    const addrId = aiAddressIdentity(req);
    const keyId = aiKeyIdentity("my-api-key");

    expect(addrId).not.toBe(keyId);
    expect(keyId).toBe(`ai-key-${apiKeyFingerprint("my-api-key")}`);
  });

  it("keeps two different API keys on the same address in separate key buckets", () => {
    const keyIdA = aiKeyIdentity("key-a");
    const keyIdB = aiKeyIdentity("key-b");
    expect(keyIdA).not.toBe(keyIdB);
  });

  it("keeps two different addresses using the same API key in separate address buckets", () => {
    vi.stubEnv("TRUSTED_PROXY_MODE", "vercel");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const reqA = new Request("http://localhost/api/ai", {
      headers: { "x-forwarded-for": "70.41.3.18, 198.51.100.1" },
    });
    const reqB = new Request("http://localhost/api/ai", {
      headers: { "x-forwarded-for": "70.41.3.18, 198.51.100.2" },
    });
    expect(aiAddressIdentity(reqA)).not.toBe(aiAddressIdentity(reqB));
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
