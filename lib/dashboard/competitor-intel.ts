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

export type StrategicSection = {
  title: string
  items: string[]
}

export type PositionPoint = {
  id: string
  label: string
  x: number
  y: number
  isYou?: boolean
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

export function parseStrategicInsights(text: string): StrategicSection[] {
  const sections: StrategicSection[] = []
  const lines = text.split('\n').map(l => l.trim().replace(/\*\*/g, '')).filter(Boolean)
  let current: StrategicSection | null = null

  for (const line of lines) {
    const mdHeading = line.match(/^#{1,3}\s+(.+)/)
    if (mdHeading && /weakness|opportunit|differentiator|strength|insight/i.test(mdHeading[1])) {
      if (current?.items.length) sections.push(current)
      current = { title: mdHeading[1].replace(/:$/, ''), items: [] }
      continue
    }

    const heading = line.match(/^(?:#+\s*|\d+\.\s*)?(.{3,80}):?\s*$/i)
    const bullet = line.match(/^(?:[-*•]|\d+\.)\s+(.+)/)

    if (heading && !bullet && /weakness|opportunit|differentiator|strength/i.test(line)) {
      if (current?.items.length) sections.push(current)
      current = { title: heading[1].replace(/:$/, ''), items: [] }
      continue
    }

    if (bullet) {
      if (!current) current = { title: 'Insights', items: [] }
      current.items.push(bullet[1])
      continue
    }

    if (/weakness|opportunit|differentiator/i.test(line) && line.length < 90) {
      if (current?.items.length) sections.push(current)
      current = { title: line.replace(/:$/, ''), items: [] }
    }
  }

  if (current?.items.length) sections.push(current)

  if (sections.length === 0) {
    const bullets = lines
      .map(l => l.match(/^(?:[-*•]|\d+\.)\s+(.+)/)?.[1])
      .filter((x): x is string => Boolean(x))
    if (bullets.length) {
      return [{ title: 'Strategic insights', items: bullets }]
    }
    return [{ title: 'Strategic insights', items: [text.slice(0, 500)] }]
  }

  return sections
}
