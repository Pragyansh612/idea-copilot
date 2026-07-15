import type { Feature } from '@/lib/api/idea'
import { countStoredGapOpportunities } from '@/lib/dashboard/gap-storage'

export type CompetitorRow = Record<string, unknown>

export type CompetitorFeature = {
  id: string
  competitor_id: string
  feature_name: string
  description?: string
}

export type WorkspaceCompetitorStats = {
  tracked: number
  analyzed: number
  featuresExtracted: number
  marketGapsFound: number
}

export type FeatureMatrix = {
  rows: string[]
  columns: { id: string; label: string; isYou?: boolean }[]
  cells: Record<string, Record<string, boolean>>
  differentiators: string[]
  gaps: string[]
}

export type OverallPosition = 'strong' | 'competitive' | 'at_risk' | 'unknown'

export type FeatureComparisonRow = {
  feature: string
  your_idea: 'has' | 'missing' | 'partial'
  competitors: string[]
  importance: 'critical' | 'important' | 'nice_to_have'
}

export type FeatureGap = {
  feature: string
  description?: string
  competitor_count?: number
  urgency?: 'high' | 'medium' | 'low'
}

export type CompetitorWeakness = {
  competitor_name: string
  weakness: string
  opportunity?: string
}

/** Normalized `POST /api/ideas/{id}/competitor-analysis` response ("Strategic Insights"). */
export type StrategicAnalysis = {
  feature_comparison: FeatureComparisonRow[]
  your_strengths: string[]
  your_weaknesses: string[]
  feature_gaps: FeatureGap[]
  competitor_weaknesses: CompetitorWeakness[]
  strategy_advice: string[]
  overall_position: OverallPosition
  fastest_differentiator?: string
  summary?: string
  /** Present when the backend short-circuits with no competitor data yet. */
  message?: string
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

export function normalizeStrategicAnalysis(data: unknown): StrategicAnalysis {
  const o = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {}) as Record<string, unknown>
  const position = o.overall_position
  return {
    feature_comparison: Array.isArray(o.feature_comparison) ? (o.feature_comparison as FeatureComparisonRow[]) : [],
    your_strengths: asStringArray(o.your_strengths),
    your_weaknesses: asStringArray(o.your_weaknesses),
    feature_gaps: Array.isArray(o.feature_gaps) ? (o.feature_gaps as FeatureGap[]) : [],
    competitor_weaknesses: Array.isArray(o.competitor_weaknesses) ? (o.competitor_weaknesses as CompetitorWeakness[]) : [],
    strategy_advice: asStringArray(o.strategy_advice),
    overall_position:
      position === 'strong' || position === 'competitive' || position === 'at_risk' ? position : 'unknown',
    fastest_differentiator: typeof o.fastest_differentiator === 'string' ? o.fastest_differentiator : undefined,
    summary: typeof o.summary === 'string' ? o.summary : undefined,
    message: typeof o.message === 'string' ? o.message : undefined,
  }
}

export type PositionPoint = {
  id: string
  label: string
  x: number
  y: number
  isYou?: boolean
}

export type ScrapeQuality = 'ok' | 'thin' | 'blocked' | 'low_confidence'

/** `null`/`undefined`/unrecognized scrape_quality is treated as "ok" for backward compatibility. */
export function competitorScrapeQuality(c: CompetitorRow): ScrapeQuality {
  const v = c.scrape_quality
  if (v === 'thin' || v === 'blocked' || v === 'low_confidence') return v
  return 'ok'
}

function normFeatureName(name: string): string {
  return name.trim().toLowerCase()
}

export function competitorDisplayName(c: CompetitorRow, idx = 0): string {
  return String(c.competitor_name || c.name || `Competitor ${idx + 1}`)
}

export function competitorWebsite(c: CompetitorRow): string {
  return String(c.competitor_url || c.url || '')
}

export function competitorDescription(c: CompetitorRow): string {
  return String(c.description || c.market_position || '')
}

export function competitorId(c: CompetitorRow, idx = 0): string {
  const id = c.id != null ? String(c.id) : ''
  if (id && id !== 'undefined') return id
  return `c-${idx}`
}

/** Real DB id for API calls — null when not persisted yet. */
export function competitorApiId(c: CompetitorRow): string | null {
  const id = c.id != null ? String(c.id) : ''
  if (!id || id === 'undefined') return null
  return id
}

/** Normalize website host+path for duplicate detection. */
export function canonicalizeCompetitorUrl(url: string): string {
  const raw = (url || '').trim().toLowerCase()
  if (!raw) return ''
  try {
    const withProto = /^https?:\/\//.test(raw) ? raw : `https://${raw}`
    const u = new URL(withProto)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.replace(/\/+$/, '') || ''
    return `${host}${path}`
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '')
  }
}

/**
 * Keep one row per canonical URL (prefer analyzed + richer description).
 * Prevents duplicate columns after Analyze incorrectly re-scraped as insert.
 */
export function dedupeCompetitorsByUrl(rows: CompetitorRow[]): CompetitorRow[] {
  const byKey = new Map<string, CompetitorRow>()
  const score = (c: CompetitorRow) => {
    let s = 0
    if (isCompetitorAnalyzed(c)) s += 10
    if (c.description) s += Math.min(5, String(c.description).length / 80)
    if (Array.isArray(c.strengths)) s += (c.strengths as unknown[]).length
    if (c.confidence_score != null) s += Number(c.confidence_score) || 0
    return s
  }
  rows.forEach((c, idx) => {
    const url = canonicalizeCompetitorUrl(competitorWebsite(c))
    const name = competitorDisplayName(c, idx).toLowerCase()
    const key = url || `name:${name}` || competitorId(c, idx)
    const prev = byKey.get(key)
    if (!prev || score(c) >= score(prev)) byKey.set(key, c)
  })
  return [...byKey.values()]
}

export function isCompetitorAnalyzed(c: CompetitorRow): boolean {
  const strengths = c.strengths as unknown[] | undefined
  const weaknesses = c.weaknesses as unknown[] | undefined
  const score = Number(c.confidence_score)
  if (Array.isArray(strengths) && strengths.length > 0) return true
  if (Array.isArray(weaknesses) && weaknesses.length > 0) return true
  if (Number.isFinite(score) && score > 0) return true
  return Boolean(c.market_position || c.description)
}

export function computeWorkspaceStats(
  competitorsByIdea: Record<string, CompetitorRow[]>,
  featureCountByCompetitor: Record<string, number>,
): WorkspaceCompetitorStats {
  const all = Object.values(competitorsByIdea).flat()
  const analyzed = all.filter(isCompetitorAnalyzed).length
  const featuresExtracted = Object.values(featureCountByCompetitor).reduce((a, b) => a + b, 0)
  return {
    tracked: all.length,
    analyzed,
    featuresExtracted,
    marketGapsFound: countStoredGapOpportunities(),
  }
}

export function buildFeatureMatrix(
  yourFeatures: Feature[],
  competitors: CompetitorRow[],
  featuresByCompetitor: Record<string, CompetitorFeature[]>,
): FeatureMatrix {
  const youNames = new Set(yourFeatures.map(f => normFeatureName(f.title)))
  const columns: FeatureMatrix['columns'] = [
    { id: 'you', label: 'You', isYou: true },
    ...competitors.map((c, idx) => ({
      id: competitorId(c, idx),
      label: competitorDisplayName(c, idx).slice(0, 18),
    })),
  ]

  const nameMap = new Map<string, string>()
  for (const f of yourFeatures) {
    const k = normFeatureName(f.title)
    if (!nameMap.has(k)) nameMap.set(k, f.title)
  }
  competitors.forEach((comp, idx) => {
    const cid = competitorId(comp, idx)
    for (const cf of featuresByCompetitor[cid] || []) {
      const k = normFeatureName(cf.feature_name)
      if (!nameMap.has(k)) nameMap.set(k, cf.feature_name)
    }
  })

  const rows = [...nameMap.values()].sort((a, b) => a.localeCompare(b))
  const cells: FeatureMatrix['cells'] = {}

  for (const row of rows) {
    const key = normFeatureName(row)
    cells[row] = { you: youNames.has(key) }
    competitors.forEach((comp, idx) => {
      const cid = competitorId(comp, idx)
      const has = (featuresByCompetitor[cid] || []).some(
        cf => normFeatureName(cf.feature_name) === key,
      )
      cells[row][cid] = has
    })
  }

  const differentiators: string[] = []
  const gaps: string[] = []
  for (const row of rows) {
    const rowCells = cells[row]
    const youHave = Boolean(rowCells.you)
    const anyComp = competitors.some((c, idx) => rowCells[competitorId(c, idx)])
    if (youHave && !anyComp) differentiators.push(row)
    if (!youHave && anyComp) gaps.push(row)
  }

  return { rows, columns, cells, differentiators, gaps }
}

function hasAiSignal(text: string): boolean {
  return /\b(ai|ml|gpt|llm|machine learning|artificial intelligence|copilot|automation)\b/i.test(text)
}

export function buildPositionMap(
  yourFeatures: Feature[],
  competitors: CompetitorRow[],
  featuresByCompetitor: Record<string, CompetitorFeature[]>,
): PositionPoint[] {
  const maxCompetitorFeatures = Math.max(
    1,
    ...competitors.map((c, idx) => (featuresByCompetitor[competitorId(c, idx)] || []).length),
  )

  const youCoverage = Math.min(100, (yourFeatures.length / maxCompetitorFeatures) * 70 + 20)
  const youInnovation = yourFeatures.some(f => hasAiSignal(`${f.title} ${f.description || ''}`))
    ? 75
    : 35

  const points: PositionPoint[] = [
    { id: 'you', label: 'You', x: youCoverage, y: youInnovation, isYou: true },
  ]

  competitors.forEach((c, idx) => {
    const cid = competitorId(c, idx)
    const feats = featuresByCompetitor[cid] || []
    const coverage = Math.min(100, (feats.length / maxCompetitorFeatures) * 70 + 15)
    const innovation = feats.some(f => hasAiSignal(`${f.feature_name} ${f.description || ''}`))
      ? 72
      : 28 + (idx % 3) * 8
    points.push({
      id: cid,
      label: competitorDisplayName(c, idx).slice(0, 14),
      x: coverage,
      y: innovation,
    })
  })

  return points
}

