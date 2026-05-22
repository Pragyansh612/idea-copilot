export type GapItem = {
  title?: string
  description?: string
  confidence_score?: number
  opportunity?: string
  urgency?: string
  tam?: string
}

/** Normalize market-gap API payloads (array or nested object). */
export function normalizeGaps(data: unknown): GapItem[] {
  if (Array.isArray(data)) return data as GapItem[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    for (const key of ['gaps', 'opportunities', 'items', 'results']) {
      if (Array.isArray(o[key])) return o[key] as GapItem[]
    }
  }
  return []
}
