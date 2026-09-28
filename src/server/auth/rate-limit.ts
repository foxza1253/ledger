/** Fixed-window in-memory limiter for login attempts (per process — enough for a personal app). */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function hitRateLimit(key: string, limit = 5, windowMs = 15 * 60_000): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }
  b.count += 1
  return { allowed: b.count <= limit, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
}

export function resetRateLimit(key: string) {
  buckets.delete(key)
}
