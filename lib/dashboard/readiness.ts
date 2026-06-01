import { CompetitorAPI, IdeaAPI } from '@/lib/api/idea'
import type { Idea } from '@/lib/api/idea'
import { hasGapRun, loadGapsForIdea } from '@/lib/dashboard/gap-storage'
import { routes } from '@/lib/routes'

export type ReadinessSignals = {
  hasDescription: boolean
  hasFeatures: boolean
  hasPhases: boolean
  hasCompetitors: boolean
  hasMarketGap: boolean
}

export type ReadinessStepKey = 'describe' | 'features' | 'roadmap' | 'competitors' | 'market'

export type ReadinessItem = {
  key: ReadinessStepKey
  label: string
  done: boolean
  cta: string
  action: () => void
}

const STEP_POINTS = 20

export const READINESS_STEPS: Array<{
  key: ReadinessStepKey
  label: string
  cta: string
  signal: keyof ReadinessSignals
}> = [
  { key: 'describe', label: 'Describe your idea', cta: 'Add description', signal: 'hasDescription' },
  { key: 'features', label: 'Generate features', cta: 'Generate with AI', signal: 'hasFeatures' },
  { key: 'roadmap', label: 'Create roadmap', cta: 'Create phases', signal: 'hasPhases' },
  { key: 'competitors', label: 'Research competitors', cta: 'Discover competitors', signal: 'hasCompetitors' },
  { key: 'market', label: 'Validate market', cta: 'Run market gap analysis', signal: 'hasMarketGap' },
]

export function computeStartupReadinessPercent(signals: ReadinessSignals): number {
  let score = 0
  if (signals.hasDescription) score += STEP_POINTS
  if (signals.hasFeatures) score += STEP_POINTS
  if (signals.hasPhases) score += STEP_POINTS
  if (signals.hasCompetitors) score += STEP_POINTS
  if (signals.hasMarketGap) score += STEP_POINTS
  return score
}

export function getFirstMissingStep(signals: ReadinessSignals): ReadinessStepKey | null {
  for (const step of READINESS_STEPS) {
    if (!signals[step.signal]) return step.key
  }
  return null
}

export function signalsFromIdeaDetail(input: {
  description?: string | null
  featureCount: number
  phaseCount: number
  competitorCount: number
  ideaId: string
}): ReadinessSignals {
  return {
    hasDescription: Boolean(input.description?.trim()),
    hasFeatures: input.featureCount > 0,
    hasPhases: input.phaseCount > 0,
    hasCompetitors: input.competitorCount > 0,
    hasMarketGap: hasGapRun(input.ideaId) || loadGapsForIdea(input.ideaId).length > 0,
  }
}

export async function fetchIdeaReadinessSignals(ideaId: string): Promise<ReadinessSignals> {
  const [detail, comp] = await Promise.all([
    IdeaAPI.getIdea(ideaId),
    CompetitorAPI.getCompetitorResearch(ideaId).catch(() => ({ research: [] as unknown[], competitors: [] as unknown[] })),
  ])
  const competitors = (comp.research || comp.competitors || []) as unknown[]
  return signalsFromIdeaDetail({
    description: detail.idea.description,
    featureCount: detail.features?.length ?? 0,
    phaseCount: detail.phases?.length ?? 0,
    competitorCount: competitors.length,
    ideaId,
  })
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize)
    results.push(...(await Promise.all(chunk.map(fn))))
  }
  return results
}

export async function fetchReadinessMapForIdeas(
  ideas: Idea[],
  options?: { activeOnly?: boolean },
): Promise<Map<string, ReadinessSignals>> {
  const scope = options?.activeOnly
    ? ideas.filter(i => !i.is_archived && i.status !== 'archived')
    : ideas
  const pairs = await mapInBatches(scope, 8, async idea => {
    try {
      return [idea.id, await fetchIdeaReadinessSignals(idea.id)] as const
    } catch {
      return [
        idea.id,
        signalsFromIdeaDetail({
          description: idea.description,
          featureCount: 0,
          phaseCount: 0,
          competitorCount: 0,
          ideaId: idea.id,
        }),
      ] as const
    }
  })
  return new Map(pairs)
}

export function pickLowestReadinessIdea(
  ideas: Idea[],
  snapshots: Map<string, ReadinessSignals>,
): { idea: Idea; signals: ReadinessSignals; percent: number } | null {
  const active = ideas.filter(i => !i.is_archived && i.status !== 'archived')
  let best: { idea: Idea; signals: ReadinessSignals; percent: number } | null = null

  for (const idea of active) {
    const signals = snapshots.get(idea.id)
    if (!signals) continue
    const percent = computeStartupReadinessPercent(signals)
    if (percent >= 100) continue
    if (!best || percent < best.percent) {
      best = { idea, signals, percent }
    }
  }

  return best
}

export type DashboardNextAction = {
  step: ReadinessStepKey
  actionLabel: string
  ideaTitle: string
  detail: string
  headline: string
}

export function buildDashboardNextAction(
  idea: Idea,
  signals: ReadinessSignals,
): DashboardNextAction | null {
  const stepKey = getFirstMissingStep(signals)
  if (!stepKey) return null
  const step = READINESS_STEPS.find(s => s.key === stepKey)!
  return {
    step: stepKey,
    actionLabel: step.cta,
    ideaTitle: idea.title,
    detail: `${idea.title} is at ${computeStartupReadinessPercent(signals)}% Startup Readiness.`,
    headline: `${step.cta} for ${idea.title}`,
  }
}

export function dashboardNextActionRoute(ideaId: string, step: ReadinessStepKey): string {
  switch (step) {
    case 'describe':
      return `${routes.ideaTab(ideaId, 'overview')}#idea-description`
    case 'features':
      return routes.ideaTab(ideaId, 'overview')
    case 'roadmap':
      return routes.ideaTab(ideaId, 'roadmap', { focus: 'phase' })
    case 'competitors':
      return routes.competitorsDiscover(ideaId)
    case 'market':
      return routes.ideaTab(ideaId, 'intelligence')
    default:
      return routes.idea(ideaId)
  }
}

export function buildReadinessItems(input: {
  signals: ReadinessSignals
  onDescribe: () => void
  onGenerateFeatures: () => void
  onCreateRoadmap: () => void
  onDiscoverCompetitors: () => void
  onRunMarketGap: () => void
}): ReadinessItem[] {
  const actions: Record<ReadinessStepKey, () => void> = {
    describe: input.onDescribe,
    features: input.onGenerateFeatures,
    roadmap: input.onCreateRoadmap,
    competitors: input.onDiscoverCompetitors,
    market: input.onRunMarketGap,
  }

  return READINESS_STEPS.map(step => ({
    key: step.key,
    label: step.label,
    done: input.signals[step.signal],
    cta: step.cta,
    action: actions[step.key],
  }))
}
