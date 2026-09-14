import "server-only";

/**
 * Fixed-window in-process rate limiter.
 *
 * Honest about its limits: state lives in one Node process, so it does not
 * survive a restart and does not coordinate across instances. That is a real
 * constraint of the shared-hosting target, not an oversight. It blunts casual
 * abuse of write endpoints; anything stronger belongs at the edge or in a
 * shared store. See docs/security.md.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    // Bound memory: this map is the only thing keeping these keys alive.
    if (buckets.size >= MAX_TRACKED_KEYS) {
      for (const [k, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(k);
      }
      if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    }
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}
