/**
 * In-memory per-key rate limiter for public POST endpoints.
 *
 * ## Scope and lifetime
 *
 * The store lives in module scope as a single `Map<string, Bucket>`. Because
 * Node.js caches ES modules per process, every call site that imports
 * {@link checkRateLimit} shares the same map for the lifetime of the process.
 *
 * ## ⚠️ MVP only — single-instance assumption
 *
 * This implementation is **deliberately in-memory and single-process**. It is
 * appropriate for the MVP single-instance deployment described in
 * `design.md` ("Rate limiting" section). In any multi-instance setup
 * (e.g. Vercel scaling out, several Node workers, blue/green deploys) the
 * counters are partitioned per process, so an attacker can effectively get
 * `limit × instances` requests through.
 *
 * Before going to production-scale traffic, swap this module for a shared
 * store such as Upstash Redis or a Postgres `check_rate_limit(...)` RPC and
 * keep the same call surface (`checkRateLimit`, `getClientIp`). This is
 * tracked as a post-MVP TODO in `README.md` and design doc.
 *
 * Wymagania: 12, 23 (rate limit), 26, 44.
 */

/**
 * State for a single rate-limit key.
 *
 * - `count` is the number of accepted requests inside the current window.
 * - `windowStart` is the wall-clock timestamp (ms since epoch) at which the
 *   current window started; once `now - windowStart >= windowMs` the bucket
 *   is reset on the next call.
 */
interface Bucket {
  count: number;
  windowStart: number;
}

/**
 * Module-scoped store. Keys are arbitrary strings (typically
 * `"<endpoint>:<ip>"`). Exported only as a private symbol via
 * {@link _resetRateLimitStoreForTests}; production code MUST go through
 * {@link checkRateLimit}.
 */
const store = new Map<string, Bucket>();

/**
 * Result returned to the caller.
 *
 * - `allowed: true` → the caller may proceed.
 * - `allowed: false` → reject the request; `retryAfter` is the number of
 *   **whole seconds** the client should wait before retrying. It is
 *   designed to be used directly as the value of an HTTP `Retry-After`
 *   header (RFC 9110 §10.2.3, delta-seconds form).
 */
export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number };

/**
 * Check whether a request identified by `key` is allowed under the
 * `(limit, windowMs)` budget.
 *
 * Algorithm: fixed window per key. The first request creates a bucket and
 * starts the window at `now`. Subsequent requests within the same window
 * increment the counter; once the counter would exceed `limit`, the
 * function returns `allowed: false` with the time remaining until the
 * window rolls over. When `now - windowStart >= windowMs`, the bucket is
 * reset on the next call so a fresh window begins.
 *
 * @param key Stable identifier for the caller, e.g. `booking-inquiries:1.2.3.4`.
 *            Use {@link getClientIp} to derive the IP portion.
 * @param limit Maximum number of allowed requests inside `windowMs`. Must be
 *              a positive integer.
 * @param windowMs Length of the rolling window in milliseconds. Must be > 0.
 * @returns {@link RateLimitResult}
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new RangeError(`checkRateLimit: limit must be > 0, got ${limit}`);
  }
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new RangeError(
      `checkRateLimit: windowMs must be > 0, got ${windowMs}`,
    );
  }

  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    // First hit, or previous window expired → start a fresh window.
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count < limit) {
    bucket.count += 1;
    return { allowed: true };
  }

  // Over the limit. Compute time left in the current window, in seconds,
  // rounded up so a sub-second remainder still produces `Retry-After: 1`
  // instead of `0` (which clients are allowed to interpret as "retry now").
  const msLeft = bucket.windowStart + windowMs - now;
  const retryAfter = Math.max(1, Math.ceil(msLeft / 1000));
  return { allowed: false, retryAfter };
}

/**
 * Minimal request-like shape that {@link getClientIp} understands.
 *
 * Both `Request` (Web Fetch API, used by Next.js Route Handlers) and
 * `NextRequest` satisfy this shape via their `headers: Headers` field, so
 * the helper works in Route Handlers, middleware and server actions
 * without taking a hard dependency on `next/server`.
 */
export type RequestLike = { headers: Headers };

/**
 * Extract the best-effort client IP from a request.
 *
 * Order of precedence:
 *   1. The first entry of `X-Forwarded-For` (set by Vercel, most CDNs and
 *      reverse proxies; can be a comma-separated chain — we take the
 *      left-most value, i.e. the original client).
 *   2. `X-Real-IP` (set by some proxies such as Nginx).
 *   3. `'unknown'` as a documented fallback.
 *
 * ### About `request.ip`
 *
 * The original task description mentions falling back to `request.ip`.
 * Modern Next.js (≥ 15) and the Web Fetch `Request` type do **not** expose
 * such a property — Vercel removed `NextRequest.ip` in favour of relying
 * exclusively on forwarded headers, which we already cover above. Reading
 * `(request as any).ip` would silently be `undefined` in production and
 * just add a typing escape hatch for no benefit, so we intentionally do
 * not access it. The header-based path is the production code path; the
 * `'unknown'` literal serves as the explicit final fallback documented in
 * the task contract.
 *
 * The returned string is suitable to be embedded in a rate-limit key, e.g.
 * `\`booking-inquiries:${getClientIp(request)}\``. Two callers that legitimately
 * land on `'unknown'` will share a bucket — that is the intended behavior
 * (better to over-throttle anonymous traffic than to under-throttle).
 */
export function getClientIp(request: RequestLike): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // `X-Forwarded-For: client, proxy1, proxy2` → take the left-most entry.
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Test-only escape hatch. Clears every bucket in the module-scoped store so
 * each test starts from a clean slate. Calling this from production code
 * would defeat the purpose of the limiter — keep it inside `__tests__`.
 */
export function _resetRateLimitStoreForTests(): void {
  store.clear();
}
