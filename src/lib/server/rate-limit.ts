import { createHash, createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
  available: boolean;
};

export type RateLimitConfig = {
  namespace: string;
  requests: number;
  windowSeconds: number;
  memoryCap?: number;
};

type DistributedLimitResult = { success: boolean; reset: number };

export function wrapDistributedRateLimit(
  limit: (key: string) => Promise<DistributedLimitResult>,
) {
  return async (key: string): Promise<RateLimitDecision> => {
    try {
      const result = await limit(key);
      return {
        allowed: result.success,
        retryAfterSeconds: result.success
          ? 0
          : Math.max(1, Math.ceil((result.reset - Date.now()) / 1_000)),
        available: true,
      };
    } catch {
      return { allowed: false, retryAfterSeconds: 0, available: false };
    }
  };
}

type MemoryBucket = { timestamps: number[]; lastAccess: number };

export class BoundedMemorySlidingWindow {
  private readonly buckets = new Map<string, MemoryBucket>();

  constructor(
    private readonly requests: number,
    private readonly windowMs: number,
    private readonly hardCap = 10_000,
  ) {}

  consume(key: string, now = Date.now()): RateLimitDecision {
    this.cleanup(now);
    let bucket = this.buckets.get(key);

    if (!bucket && this.buckets.size >= this.hardCap) {
      const oldestKey = this.buckets.keys().next().value as string | undefined;
      if (oldestKey) this.buckets.delete(oldestKey);
    }

    bucket ??= { timestamps: [], lastAccess: now };
    bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp > now - this.windowMs);
    bucket.lastAccess = now;

    // Reinsert so Map iteration order is also the LRU order.
    this.buckets.delete(key);
    this.buckets.set(key, bucket);

    if (bucket.timestamps.length >= this.requests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.timestamps[0] + this.windowMs - now) / 1_000),
      );
      return { allowed: false, retryAfterSeconds, available: true };
    }

    bucket.timestamps.push(now);
    return { allowed: true, retryAfterSeconds: 0, available: true };
  }

  get size(): number {
    return this.buckets.size;
  }

  private cleanup(now: number): void {
    const threshold = now - this.windowMs;
    for (const [key, bucket] of this.buckets) {
      bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp > threshold);
      if (bucket.timestamps.length === 0) this.buckets.delete(key);
    }
  }
}

/**
 * Extracts and validates the trusted client IP address based on TRUSTED_PROXY_MODE.
 * Malformed, spoofed, or unconfigured proxy headers fallback to "direct".
 */
export function trustedClientAddress(request: Request): string {
  const mode = process.env.TRUSTED_PROXY_MODE?.trim().toLowerCase() ?? "none";
  let ip = "";
  if (mode === "vercel" || mode === "forwarded") {
    ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  } else if (mode === "cloudflare") {
    ip = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  } else if (mode === "x-real-ip") {
    ip = request.headers.get("x-real-ip")?.trim() ?? "";
  }

  if (!ip || !/^[a-fA-F0-9:.]+$/u.test(ip)) {
    return "direct";
  }

  return ip;
}

/**
 * Derives a truncated HMAC fingerprint for an API key using a server secret.
 * Never stores or logs the raw API key.
 */
export function apiKeyFingerprint(apiKey: string): string {
  const secret =
    process.env.RATE_LIMIT_SECRET?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    "report-supporter-hmac-secret-v1";
  return createHmac("sha256", secret).update(apiKey).digest("hex").slice(0, 32);
}

export function pdfAddressIdentity(request: Request): string {
  const address = trustedClientAddress(request);
  return createHash("sha256").update(`pdf\0${address}`).digest("hex");
}

export function aiAddressIdentity(request: Request): string {
  const address = trustedClientAddress(request);
  return createHash("sha256").update(`ai-addr\0${address}`).digest("hex");
}

export function aiKeyIdentity(apiKey: string): string {
  return `ai-key-${apiKeyFingerprint(apiKey)}`;
}

export function rateLimitIdentity(request: Request, apiKey?: string): string {
  const address = trustedClientAddress(request);
  const keyFp = apiKey ? apiKeyFingerprint(apiKey) : "";
  return createHash("sha256").update(`${address}\0${keyFp}`).digest("hex");
}

export function createRateLimiter(config: RateLimitConfig) {
  const isProduction = process.env.NODE_ENV === "production";
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (isProduction) {
    if (!url || !token) {
      return async (): Promise<RateLimitDecision> => ({
        allowed: false,
        retryAfterSeconds: 0,
        available: false,
      });
    }

    const limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds} s`),
      analytics: false,
      prefix: `report-supporter:${config.namespace}`,
    });

    return wrapDistributedRateLimit((key) => limiter.limit(key));
  }

  const memory = new BoundedMemorySlidingWindow(
    config.requests,
    config.windowSeconds * 1_000,
    config.memoryCap,
  );
  return async (key: string): Promise<RateLimitDecision> => memory.consume(key);
}
