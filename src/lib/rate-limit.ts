// ─── HT Fabrication Visualiser — In-Memory Rate Limiter ─────────
// Dependency-free fixed-window rate limiter for public + auth endpoints.
//
// NOTE: state lives in module scope, so limits are enforced PER INSTANCE
// (per serverless lambda / per region). This is fine for a single-region,
// low-volume deployment; swap for a shared store (e.g. Upstash Redis) if
// the app is scaled horizontally.

import type { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic sweep so expired buckets don't accumulate unbounded.
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export interface RateLimitOptions {
  /** Max requests permitted within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Record a hit against `key` and report whether it is within `limit` for the
 * current window. A fresh window starts on the first hit after expiry.
 */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfterMs: 0 };
  }

  existing.count += 1;
  if (existing.count > opts.limit) {
    return { ok: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  return { ok: true, remaining: opts.limit - existing.count, retryAfterMs: 0 };
}

/**
 * Derive a best-effort client key from proxy headers. Falls back to
 * "unknown" (which buckets all header-less callers together — acceptable
 * for coarse abuse protection).
 */
export function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  return "unknown";
}
