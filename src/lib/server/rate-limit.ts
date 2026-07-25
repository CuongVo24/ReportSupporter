import { createHmac } from "node:crypto";
import { isIP } from "node:net";
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

// ---------------------------------------------------------------------------
// Trusted-ingress address parsing (W25-B)
//
// Each TRUSTED_PROXY_MODE has its own parser because the header semantics
// differ per platform. Getting this wrong either lets a client spoof another
// user's bucket (reading an attacker-controlled header) or collapses every
// user into one shared bucket (reading nothing).
// ---------------------------------------------------------------------------

function normalizeIp(candidate: string): string | null {
  const trimmedValue = candidate.trim();
  if (!trimmedValue) return null;
  if (isIP(trimmedValue)) return trimmedValue;

  // Bracketed IPv6 with optional port: "[2001:db8::1]:8080" or "[2001:db8::1]"
  const bracketed = /^\[([^\]]+)\](?::\d{1,5})?$/u.exec(trimmedValue);
  if (bracketed && isIP(bracketed[1])) return bracketed[1];

  // IPv4 with a port suffix: "203.0.113.5:8080"
  const ipv4WithPort = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d{1,5}$/u.exec(trimmedValue);
  if (ipv4WithPort && isIP(ipv4WithPort[1]) === 4) return ipv4WithPort[1];

  return null;
}

function readTrustedHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS?.trim();
  const parsed = raw ? Number(raw) : 1;
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) return 1;
  return parsed;
}

/**
 * Picks the client address from an X-Forwarded-For-style comma chain given
 * `hops` trusted reverse-proxies sitting between the original client and us.
 * Each trusted proxy appends the address of whoever it received the request
 * from, so the address appended by the FIRST trusted proxy (closest to the
 * original client) — at position `length - hops` — is the real client IP.
 * Anything to the left of that (extra entries a client can freely prepend
 * onto the header before it reaches the first trusted proxy) is never read,
 * so a client cannot spoof its way into the trusted slot.
 */
function pickFromRight(chain: string[], hops: number): string | null {
  if (chain.length < hops) return null; // not enough hops — chain too short to trust
  const candidate = chain[chain.length - hops];
  return candidate ? normalizeIp(candidate) : null;
}

function parseXForwardedFor(header: string, hops: number): string | null {
  const chain = header.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (chain.length === 0) return null;
  return pickFromRight(chain, hops);
}

/**
 * RFC 7239 `Forwarded` header parser. Handles multiple comma-separated
 * forwarded-elements, each with semicolon-separated params, quoted values,
 * and bracketed IPv6 (`for="[2001:db8::1]:1234"`). Obfuscated identifiers
 * (`for=unknown`, `for=_hidden`) never resolve to a usable address.
 */
function parseForwardedHeader(header: string, hops: number): string | null {
  const elements = header.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (elements.length === 0) return null;

  const forValues: string[] = [];
  for (const element of elements) {
    const params = element.split(";").map((p) => p.trim());
    const forParam = params.find((p) => /^for=/iu.test(p));
    if (!forParam) {
      forValues.push(""); // preserve position even when this element has no for=
      continue;
    }
    let value = forParam.slice(forParam.indexOf("=") + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1);
    }
    forValues.push(value);
  }

  const nonEmpty = forValues.filter(Boolean);
  if (nonEmpty.length === 0) return null;
  const picked = pickFromRight(nonEmpty, hops);
  return picked;
}

/**
 * Extracts and validates the trusted client IP address based on TRUSTED_PROXY_MODE.
 * Malformed, spoofed, or unconfigured proxy headers fallback to "direct".
 */
export function trustedClientAddress(request: Request): string {
  const mode = process.env.TRUSTED_PROXY_MODE?.trim().toLowerCase() ?? "none";
  const hops = readTrustedHops();
  let ip: string | null = null;

  if (mode === "vercel") {
    const header = request.headers.get("x-forwarded-for");
    if (header) ip = parseXForwardedFor(header, hops);
  } else if (mode === "forwarded") {
    const header = request.headers.get("forwarded");
    if (header) ip = parseForwardedHeader(header, hops);
  } else if (mode === "cloudflare") {
    // Cloudflare sets exactly this header at the edge; never a client-supplied chain.
    const header = request.headers.get("cf-connecting-ip");
    if (header) ip = normalizeIp(header);
  } else if (mode === "x-real-ip") {
    const header = request.headers.get("x-real-ip");
    if (header) ip = normalizeIp(header);
  }
  // mode === "none" (or unrecognized): never trust any forwarded header.

  return ip ?? "direct";
}

// ---------------------------------------------------------------------------
// Secret-backed fingerprints (W25-B)
//
// RATE_LIMIT_SECRET is a dedicated purpose-built secret, required in
// production by production-config.ts. It must never fall back to the Upstash
// Redis token (a capability-unrelated credential) or a hardcoded string. In
// non-production, a clearly-labeled dev fallback keeps local dev working.
//
// Rotation: bump RATE_LIMIT_SECRET_VERSION when rotating RATE_LIMIT_SECRET.
// The version is folded into the fingerprint, so buckets naturally partition
// per version instead of silently colliding across a rotation. Because
// rate-limit buckets are short-lived (window ≤ a few minutes) a brief reset
// of in-flight windows during rotation is an accepted tradeoff; no
// dual-version read path is needed.
// ---------------------------------------------------------------------------

const DEV_FALLBACK_SECRET = "dev-only-report-supporter-hmac-secret-DO-NOT-USE-IN-PRODUCTION";

function fingerprintSecret(): { secret: string; version: string } {
  const secret = process.env.RATE_LIMIT_SECRET?.trim();
  const version = process.env.RATE_LIMIT_SECRET_VERSION?.trim() || "v1";
  if (secret) return { secret, version };
  if (process.env.NODE_ENV === "production") {
    // production-config.ts / predeploy should already block boot without this.
    // Fail closed here too rather than silently using a guessable secret.
    throw new Error(
      "RATE_LIMIT_SECRET missing in production — refusing to fingerprint with an insecure fallback.",
    );
  }
  return { secret: DEV_FALLBACK_SECRET, version: "dev" };
}

function versionedHmac(value: string): string {
  const { secret, version } = fingerprintSecret();
  const digest = createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
  return `${version}:${digest}`;
}

/**
 * Derives a truncated, versioned HMAC fingerprint for an API key using a
 * dedicated server secret. Never stores or logs the raw API key.
 */
export function apiKeyFingerprint(apiKey: string): string {
  return versionedHmac(`key\0${apiKey}`);
}

/**
 * Derives a truncated, versioned HMAC fingerprint for a trusted client
 * address. Kept separate from a raw sha256 so an attacker who can see one
 * fingerprint cannot correlate it against externally-known IP hashes.
 */
function addressFingerprint(address: string): string {
  return versionedHmac(`addr\0${address}`);
}

export function pdfAddressIdentity(request: Request): string {
  const address = trustedClientAddress(request);
  return `pdf-addr-${addressFingerprint(address)}`;
}

export function aiAddressIdentity(request: Request): string {
  const address = trustedClientAddress(request);
  return `ai-addr-${addressFingerprint(address)}`;
}

export function aiKeyIdentity(apiKey: string): string {
  return `ai-key-${apiKeyFingerprint(apiKey)}`;
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
