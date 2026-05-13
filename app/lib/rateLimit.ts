import { NextResponse } from "next/server";

/**
 * In-memory sliding-window rate limiter.
 *
 * Caveat: Vercel serverless instances are ephemeral and not shared, so a
 * determined attacker can still get N × instance_count requests before being
 * throttled. For real protection at scale, swap this for Upstash Ratelimit
 * (Redis-backed). This module's API is intentionally compatible.
 */

type Hit = { timestamps: number[] };
const buckets = new Map<string, Hit>();

// Periodic cleanup so we don't leak memory on a long-lived instance.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, hit] of buckets) {
    // Drop buckets that haven't been touched in the last 10 minutes.
    if (hit.timestamps.length === 0 || now - hit.timestamps[hit.timestamps.length - 1] > 10 * 60_000) {
      buckets.delete(key);
    }
  }
}

export type RateLimitOptions = {
  /** Logical bucket name, e.g. "chat-message" or "orders-by-email". */
  key: string;
  /** Maximum number of requests allowed within `windowMs`. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number; // ms until oldest hit expires
};

export function rateLimit(req: Request, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const ip = getClientIp(req);
  const bucketKey = `${opts.key}:${ip}`;
  const hit = buckets.get(bucketKey) || { timestamps: [] };

  // Drop expired timestamps (older than window).
  const cutoff = now - opts.windowMs;
  hit.timestamps = hit.timestamps.filter((t) => t > cutoff);

  if (hit.timestamps.length >= opts.max) {
    buckets.set(bucketKey, hit);
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, opts.windowMs - (now - hit.timestamps[0])),
    };
  }

  hit.timestamps.push(now);
  buckets.set(bucketKey, hit);
  return {
    allowed: true,
    remaining: Math.max(0, opts.max - hit.timestamps.length),
    resetMs: opts.windowMs,
  };
}

/**
 * Extracts a usable IP from the request headers.
 * Vercel sets `x-real-ip` and `x-forwarded-for`. We take the FIRST hop of XFF
 * which is the original client (Vercel rewrites XFF safely).
 */
function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return "anon";
}

/** Convenience: builds a 429 NextResponse with Retry-After header. */
export function tooManyRequests(result: RateLimitResult) {
  const retryAfter = Math.ceil(result.resetMs / 1000);
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(retryAfter),
      },
    },
  );
}
