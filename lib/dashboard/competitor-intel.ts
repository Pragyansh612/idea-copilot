import type { Feature } from '@/lib/api/idea'
import { countStoredGapOpportunities } from '@/lib/dashboard/gap-storage'
import type { ConfidenceLevel } from '@/lib/dashboard/gaps'

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
  /** Set when some/all backing competitors had blocked/thin scrapes — same gating as Market Gap Analysis. */
  confidence?: ConfidenceLevel
  confidence_reason?: string
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function isConfidenceLevel(v: unknown): v is ConfidenceLevel {
  return v === 'high' || v === 'medium' || v === 'low'
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
    confidence: isConfidenceLevel(o.confidence) ? o.confidence : undefined,
    confidence_reason: typeof o.confidence_reason === 'string' ? o.confidence_reason : undefined,
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

const FEATURE_TOKEN_STOPWORDS = new Set([
  'a', 'an', 'and', 'or', 'the', 'for', 'with', 'to', 'of', 'in', 'on', 'at', 'by', 'via',
  'from', 'your', 'you', 'our', 'their', 'its', 'is', 'are', 'be', 'as', 'into', 'that',
  'this', 'core', 'functionality', 'feature', 'features', 'support', 'supports',
])

/** Strip a leading "[Category]" tag some Gemini-generated feature names carry. */
function stripFeatureCategoryPrefix(name: string): string {
  return name.replace(/^\[[^\]]*\]\s*/, '')
}

function featureTokens(name: string): Set<string> {
  const words = stripFeatureCategoryPrefix(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !FEATURE_TOKEN_STOPWORDS.has(w))
    .map(w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
  return new Set(words)
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const x of a) if (b.has(x)) intersection += 1
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

const FEATURE_CLUSTER_THRESHOLD = 0.4

/**
 * Cluster semantically-similar feature names (e.g. "Real-time Transcription"
 * and "[Core Functionality] Live Meeting Transcription") into a single
 * canonical label. Each competitor's features are independently generated
 * free text by Gemini, so exact-string matching (the previous approach)
 * almost never lines up two competitors that both offer the same
 * capability — see PRODUCT_AUDIT_2026-08-22.md §1b item 1.
 *
 * Returns a map from normalized feature name -> canonical display label.
 */
function clusterFeatureNames(names: string[]): Map<string, string> {
  const firstSeenDisplay = new Map<string, string>()
  for (const n of names) {
    const norm = normFeatureName(n)
    if (!firstSeenDisplay.has(norm)) firstSeenDisplay.set(norm, n)
  }

  type Cluster = { canonicalLabel: string; tokens: Set<string> }
  const clusters: Cluster[] = []
  const normToCluster = new Map<string, Cluster>()

  for (const [norm, display] of firstSeenDisplay) {
    const tokens = featureTokens(display)
    let best: Cluster | null = null
    let bestScore = 0
    for (const cluster of clusters) {
      const score = jaccardSimilarity(tokens, cluster.tokens)
      if (score >= FEATURE_CLUSTER_THRESHOLD && score > bestScore) {
        best = cluster
        bestScore = score
      }
    }
    if (best) {
      for (const t of tokens) best.tokens.add(t)
      if (display.length < best.canonicalLabel.length) best.canonicalLabel = display
      normToCluster.set(norm, best)
    } else {
      const cluster: Cluster = { canonicalLabel: display, tokens }
      clusters.push(cluster)
      normToCluster.set(norm, cluster)
    }
  }

  const result = new Map<string, string>()
  for (const norm of firstSeenDisplay.keys()) {
    result.set(norm, normToCluster.get(norm)!.canonicalLabel)
  }
  return result
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
  const columns: FeatureMatrix['columns'] = [
    { id: 'you', label: 'You', isYou: true },
    ...competitors.map((c, idx) => ({
      id: competitorId(c, idx),
      label: competitorDisplayName(c, idx).slice(0, 18),
    })),
  ]

  // Cluster every distinct feature name (yours + every competitor's) so that
  // near-duplicate free-text names — different competitors independently
  // describing the same capability — land on the same matrix row instead of
  // each competitor only ever matching itself.
  const allNames: string[] = [
    ...yourFeatures.map(f => f.title),
    ...competitors.flatMap((comp, idx) =>
      (featuresByCompetitor[competitorId(comp, idx)] || []).map(cf => cf.feature_name),
    ),
  ]
  const canonicalByNorm = clusterFeatureNames(allNames)
  const canonicalOf = (name: string) => canonicalByNorm.get(normFeatureName(name)) ?? name

  const youKeys = new Set(yourFeatures.map(f => canonicalOf(f.title)))
  const rows = [...new Set(canonicalByNorm.values())].sort((a, b) => a.localeCompare(b))
  const cells: FeatureMatrix['cells'] = {}

  for (const row of rows) {
    cells[row] = { you: youKeys.has(row) }
    competitors.forEach((comp, idx) => {
      const cid = competitorId(comp, idx)
      const has = (featuresByCompetitor[cid] || []).some(cf => canonicalOf(cf.feature_name) === row)
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
  // Reuse feature-name clustering (see clusterFeatureNames above) so "coverage"
  // reflects how much of the whole tracked market's distinct feature set each
  // competitor actually covers, rather than a raw count relative to whichever
  // competitor happens to have the most features — the old formula produced
  // identical scores whenever several competitors tied for the max feature
  // count, and a binary AI-mention check for "innovation" produced identical
  // scores for anyone with any AI feature at all. See
  // PRODUCT_AUDIT_2026-08-22.md §1b item 2.
  const allNames: string[] = [
    ...yourFeatures.map(f => f.title),
    ...competitors.flatMap((comp, idx) =>
      (featuresByCompetitor[competitorId(comp, idx)] || []).map(cf => cf.feature_name),
    ),
  ]
  const canonicalByNorm = clusterFeatureNames(allNames)
  const canonicalOf = (name: string) => canonicalByNorm.get(normFeatureName(name)) ?? name
  const totalDistinctFeatures = Math.max(1, new Set(canonicalByNorm.values()).size)

  const coverageOf = (names: string[]): number => {
    const distinct = new Set(names.map(canonicalOf))
    return Math.min(100, Math.round((distinct.size / totalDistinctFeatures) * 85 + 10))
  }
  const innovationOf = (texts: string[]): number => {
    if (texts.length === 0) return 30
    const aiCount = texts.filter(hasAiSignal).length
    return Math.round(25 + (aiCount / texts.length) * 70)
  }

  const youCoverage = coverageOf(yourFeatures.map(f => f.title))
  const youInnovation = innovationOf(yourFeatures.map(f => `${f.title} ${f.description || ''}`))

  const points: PositionPoint[] = [
    { id: 'you', label: 'You', x: youCoverage, y: youInnovation, isYou: true },
  ]

  competitors.forEach((c, idx) => {
    const cid = competitorId(c, idx)
    const feats = featuresByCompetitor[cid] || []
    const coverage = coverageOf(feats.map(f => f.feature_name))
    const innovation = innovationOf(feats.map(f => `${f.feature_name} ${f.description || ''}`))
    points.push({
      id: cid,
      label: competitorDisplayName(c, idx).slice(0, 14),
      x: coverage,
      y: innovation,
    })
  })

  return points
}

