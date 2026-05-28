import { normalizeGaps, type GapItem } from '@/lib/dashboard/gaps'

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

export function saveGapsForIdea(ideaId: string, gaps: GapItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${DATA_PREFIX}${ideaId}`, JSON.stringify(gaps))
  markGapRun(ideaId)
}

export function loadGapsForIdea(ideaId: string): GapItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${DATA_PREFIX}${ideaId}`)
    if (!raw) return []
    return normalizeGaps(JSON.parse(raw))
  } catch {
    return []
  }
}

export function hasGapRun(ideaId: string): boolean {
  return getGapRunMap()[ideaId] === true || loadGapsForIdea(ideaId).length > 0
}
