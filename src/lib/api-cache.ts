/**
 * Simple in-memory TTL cache for analytics API routes.
 * Prevents hammering the database on every 30s poll cycle.
 *
 * Each entry is keyed by the full URL (including sorted query params).
 * Stale entries are lazily evicted on get() and proactively on set().
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 10_000; // 10 seconds
const MAX_ENTRIES = 500;

/** Get a cached value if still fresh. */
export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.data as T;
}

/** Store a value with optional TTL (default 10s). */
export function cacheSet<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  // Evict expired entries first, then oldest if still over limit
  if (store.size >= MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (v.expiresAt < now) store.delete(k);
    }
    // If still at capacity, delete oldest entry
    if (store.size >= MAX_ENTRIES) {
      const firstKey = store.keys().next().value;
      if (firstKey) store.delete(firstKey);
    }
  }
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Clear all cache entries, or entries matching a pathname prefix. */
export function cacheClear(pathPrefix?: string): void {
  if (!pathPrefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(pathPrefix)) store.delete(key);
  }
}

/** Build a cache key from the request URL pathname + sorted search params. */
export function cacheKey(request: Request): string {
  const url = new URL(request.url);
  url.searchParams.sort();
  return `${url.pathname}?${url.searchParams.toString()}`;
}
