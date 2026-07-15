/**
 * Lightweight in-memory stale-while-revalidate cache for hot dashboard reads.
 * Caps entry count so we never balloon memory; only caches JSON-serializable snapshots.
 */

type Entry = {
  data: unknown
  at: number
  ttlMs: number
}

const store = new Map<string, Entry>()
const MAX_ENTRIES = 24
const DEFAULT_TTL_MS = 60_000

function evictIfNeeded() {
  while (store.size > MAX_ENTRIES) {
    let oldestKey: string | null = null
    let oldestAt = Infinity
    for (const [k, v] of store) {
      if (v.at < oldestAt) {
        oldestAt = v.at
        oldestKey = k
      }
    }
    if (oldestKey) store.delete(oldestKey)
    else break
  }
}

export function getCached<T>(key: string): T | null {
  const hit = store.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > hit.ttlMs) {
    store.delete(key)
    return null
  }
  return hit.data as T
}

export function setCached<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { data, at: Date.now(), ttlMs })
  evictIfNeeded()
}

export function invalidateCached(prefixOrKey: string): void {
  if (store.has(prefixOrKey)) {
    store.delete(prefixOrKey)
    return
  }
  for (const k of [...store.keys()]) {
    if (k.startsWith(prefixOrKey)) store.delete(k)
  }
}

export function peekStale<T>(key: string): T | null {
  const hit = store.get(key)
  return hit ? (hit.data as T) : null
}
