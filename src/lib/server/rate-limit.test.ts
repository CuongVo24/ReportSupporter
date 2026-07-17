import { afterEach, describe, expect, it, vi } from "vitest";
import { BoundedMemorySlidingWindow, createRateLimiter, rateLimitIdentity, wrapDistributedRateLimit } from "./rate-limit";

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

describe("rateLimitIdentity", () => {
  it("ignores spoofed forwarding headers unless proxy trust is enabled", () => {
    const previousMode = process.env.TRUSTED_PROXY_MODE;
    process.env.TRUSTED_PROXY_MODE = "none";
    const first = rateLimitIdentity(new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    }), "same-key");
    const second = rateLimitIdentity(new Request("http://localhost", {
      headers: { "x-forwarded-for": "198.51.100.2" },
    }), "same-key");
    if (previousMode === undefined) delete process.env.TRUSTED_PROXY_MODE;
    else process.env.TRUSTED_PROXY_MODE = previousMode;
    expect(first).toBe(second);
    expect(first).not.toContain("same-key");
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
