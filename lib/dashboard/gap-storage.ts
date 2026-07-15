import type { GapItem, MarketGapResult } from '@/lib/dashboard/gaps'

const RUN_KEY = 'ic-gap-runs'
const DATA_PREFIX = 'ic-gap-data:'

export function getGapRunMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(RUN_KEY) || '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

export function markGapRun(ideaId: string): void {
  if (typeof window === 'undefined') return
  const map = getGapRunMap()
  map[ideaId] = true
  localStorage.setItem(RUN_KEY, JSON.stringify(map))
}

/** Persists an already-normalized market gap result (see `normalizeGapResult`). */
export function saveGapsForIdea(ideaId: string, result: MarketGapResult): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${DATA_PREFIX}${ideaId}`, JSON.stringify(result))
  markGapRun(ideaId)
}

function readStoredResult(ideaId: string): MarketGapResult {
  if (typeof window === 'undefined') return { items: [] }
  try {
    const raw = localStorage.getItem(`${DATA_PREFIX}${ideaId}`)
    if (!raw) return { items: [] }
    const parsed = JSON.parse(raw) as Partial<MarketGapResult>
    return { ...parsed, items: Array.isArray(parsed.items) ? parsed.items : [] }
  } catch {
    return { items: [] }
  }
}

export function loadGapResultForIdea(ideaId: string): MarketGapResult {
  return readStoredResult(ideaId)
}

export function loadGapsForIdea(ideaId: string): GapItem[] {
  return readStoredResult(ideaId).items
}

export function hasGapRun(ideaId: string): boolean {
  return getGapRunMap()[ideaId] === true || loadGapsForIdea(ideaId).length > 0
}

/** Total opportunity count stored across all ideas (for workspace stats). */
export function countStoredGapOpportunities(): number {
  if (typeof window === 'undefined') return 0
  let total = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(DATA_PREFIX)) continue
      const parsed = JSON.parse(localStorage.getItem(key) || '{}') as Partial<MarketGapResult>
      total += Array.isArray(parsed.items) ? parsed.items.length : 0
    }
  } catch {
    return getGapRunCount()
  }
  return total || getGapRunCount()
}

function getGapRunCount(): number {
  return Object.values(getGapRunMap()).filter(Boolean).length
}
