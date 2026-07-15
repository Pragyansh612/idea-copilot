export type ImpactLevel = 'high' | 'medium' | 'low'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type GapCategory = 'missing_feature' | 'innovation_opportunity' | 'underserved_market'

export type GapItem = {
  category?: GapCategory
  title?: string
  description?: string
  potential_impact?: ImpactLevel
  evidence?: string
  competitors_with_it?: string[]
}

export type MarketGapResult = {
  items: GapItem[]
  confidence?: ConfidenceLevel
  confidence_reason?: string
  summary?: string
  next_action?: string
}

const CATEGORY_KEYS: Array<[string, GapCategory]> = [
  ['missing_features', 'missing_feature'],
  ['innovation_opportunities', 'innovation_opportunity'],
  ['underserved_markets', 'underserved_market'],
]

function isImpact(v: unknown): v is ImpactLevel {
  return v === 'high' || v === 'medium' || v === 'low'
}

function isConfidence(v: unknown): v is ConfidenceLevel {
  return v === 'high' || v === 'medium' || v === 'low'
}

/**
 * Normalize a `POST /api/ideas/{id}/market-gap-analysis` response (real shape:
 * `missing_features` / `innovation_opportunities` / `underserved_markets` arrays,
 * each item carrying `title`/`description`/`potential_impact`/`evidence`, plus
 * top-level `confidence`/`confidence_reason`) into a flat, render-ready shape.
 */
export function normalizeGapResult(data: unknown): MarketGapResult {
  if (Array.isArray(data)) return { items: data as GapItem[] }
  if (!data || typeof data !== 'object') return { items: [] }
  const o = data as Record<string, unknown>

  const items: GapItem[] = []
  for (const [key, category] of CATEGORY_KEYS) {
    const arr = o[key]
    if (!Array.isArray(arr)) continue
    for (const raw of arr) {
      if (!raw || typeof raw !== 'object') continue
      const r = raw as Record<string, unknown>
      items.push({
        category,
        title: typeof r.title === 'string' ? r.title : undefined,
        description: typeof r.description === 'string' ? r.description : undefined,
        potential_impact: isImpact(r.potential_impact) ? r.potential_impact : undefined,
        evidence: typeof r.evidence === 'string' ? r.evidence : undefined,
        competitors_with_it: Array.isArray(r.competitors_with_it)
          ? r.competitors_with_it.map(String)
          : undefined,
      })
    }
  }

  // Back-compat: older cached payloads or alternate shapes keyed by a flat array.
  if (items.length === 0) {
    for (const key of ['gaps', 'opportunities', 'items', 'results']) {
      if (Array.isArray(o[key])) {
        items.push(...(o[key] as GapItem[]))
        break
      }
    }
  }

  return {
    items,
    confidence: isConfidence(o.confidence) ? o.confidence : undefined,
    confidence_reason: typeof o.confidence_reason === 'string' ? o.confidence_reason : undefined,
    summary: typeof o.summary === 'string' ? o.summary : undefined,
    next_action: typeof o.next_action === 'string' ? o.next_action : undefined,
  }
}
