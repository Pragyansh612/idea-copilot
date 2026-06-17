import type { Idea } from '@/lib/api/idea'
import { computeStartupReadinessPercent, type ReadinessSignals } from '@/lib/dashboard/readiness'
import { routes } from '@/lib/routes'

const MS_DAY = 86_400_000
const STALE_DAYS = 14
const INACTIVE_DAYS = 30

export type FounderBucket = 'ready' | 'work' | 'attention'

export type FounderSummary = {
  ready: number
  work: number
  attention: number
}

export type HealthReason = {
  id: string
  label: string
  href: string
}

export type WorkspaceHealth = {
  score: number
  reasons: HealthReason[]
}

export type WorkspaceInsight = {
  id: string
  message: string
  cta: string
  href: string
  priority: number
}

export function activeIdeas(ideas: Idea[]): Idea[] {
  return ideas.filter(i => !i.is_archived && i.status !== 'archived')
}

function daysSince(iso: string): number {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 999
  return (Date.now() - t) / MS_DAY
}

export function readinessPercentFor(ideaId: string, map: Map<string, ReadinessSignals>): number {
  const signals = map.get(ideaId)
  if (!signals) return 0
  return computeStartupReadinessPercent(signals)
}

export function computeFounderSummary(
  ideas: Idea[],
  readinessByIdea: Map<string, ReadinessSignals>,
): FounderSummary {
  const summary: FounderSummary = { ready: 0, work: 0, attention: 0 }
  for (const idea of activeIdeas(ideas)) {
    const pct = readinessPercentFor(idea.id, readinessByIdea)
    const inactive = daysSince(idea.updated_at) > INACTIVE_DAYS
    if (pct >= 80) summary.ready += 1
    else if (pct >= 40 && !inactive) summary.work += 1
    else summary.attention += 1
  }
  return summary
}

export function founderBucketFor(
  idea: Idea,
  readinessByIdea: Map<string, ReadinessSignals>,
): FounderBucket {
  const pct = readinessPercentFor(idea.id, readinessByIdea)
  const inactive = daysSince(idea.updated_at) > INACTIVE_DAYS
  if (pct >= 80) return 'ready'
  if (pct >= 40 && !inactive) return 'work'
  return 'attention'
}

export function computeWorkspaceHealth(
  ideas: Idea[],
  readinessByIdea: Map<string, ReadinessSignals>,
): WorkspaceHealth {
  const active = activeIdeas(ideas)
  if (active.length === 0) {
    return { score: 0, reasons: [{ id: 'empty', label: 'Create your first idea to start building workspace health.', href: routes.newIdea }] }
  }

  const readinessScores = active.map(i => readinessPercentFor(i.id, readinessByIdea))
  const avgReadiness = readinessScores.reduce((a, b) => a + b, 0) / active.length

  const updatedRecently = active.filter(i => daysSince(i.updated_at) <= STALE_DAYS).length
  const withCompetitors = active.filter(i => readinessByIdea.get(i.id)?.hasCompetitors).length

  const recentPct = (updatedRecently / active.length) * 100
  const competitorPct = (withCompetitors / active.length) * 100

  const score = Math.round(avgReadiness * 0.4 + recentPct * 0.3 + competitorPct * 0.3)

  const noCompetitors = active.filter(i => !readinessByIdea.get(i.id)?.hasCompetitors).length
  const stale = active.filter(i => daysSince(i.updated_at) > STALE_DAYS).length

  const reasons: HealthReason[] = []
  if (noCompetitors > 0) {
    reasons.push({
      id: 'no-competitors',
      label: `${noCompetitors} idea${noCompetitors === 1 ? '' : 's'} ha${noCompetitors === 1 ? 's' : 've'} no competitor research`,
      href: routes.intelligence,
    })
  }
  if (stale > 0) {
    reasons.push({
      id: 'stale',
      label: `${stale} idea${stale === 1 ? '' : 's'} not updated in ${STALE_DAYS} days`,
      href: routes.ideasWithBucket('attention'),
    })
  }
  if (avgReadiness < 80 && reasons.length < 3) {
    reasons.push({
      id: 'readiness',
      label: `Average Startup Readiness is ${Math.round(avgReadiness)}% — keep completing checklists`,
      href: routes.ideas,
    })
  }

  return { score, reasons: reasons.slice(0, 3) }
}

function sharedTags(a: Idea, b: Idea): string[] {
  const ta = new Set((a.tags || []).map(t => t.toLowerCase()))
  return (b.tags || []).filter(t => ta.has(t.toLowerCase()))
}

export function generateWorkspaceInsights(
  ideas: Idea[],
  readinessByIdea: Map<string, ReadinessSignals>,
): WorkspaceInsight[] {
  const active = activeIdeas(ideas)
  const insights: WorkspaceInsight[] = []

  for (const idea of active) {
    const signals = readinessByIdea.get(idea.id)
    if (!signals) continue
    const pct = computeStartupReadinessPercent(signals)

    if (signals.hasFeatures && signals.hasPhases && !signals.hasCompetitors) {
      insights.push({
        id: `missing-research-${idea.id}`,
        message: `${idea.title} has a roadmap but no market research.`,
        cta: 'Discover competitors',
        href: routes.intelligenceDiscover(idea.id),
        priority: 100,
      })
    }

    if (idea.status === 'in_progress' && daysSince(idea.updated_at) > STALE_DAYS) {
      insights.push({
        id: `stale-${idea.id}`,
        message: `You haven't updated ${idea.title} in ${STALE_DAYS} days. Still working on it?`,
        cta: 'Open idea',
        href: routes.idea(idea.id),
        priority: 90,
      })
    }

    if (pct >= 80) {
      insights.push({
        id: `ready-${idea.id}`,
        message: `${idea.title} is ${pct}% ready. What's holding you back from building it?`,
        cta: 'Review idea',
        href: routes.ideaTab(idea.id, 'overview'),
        priority: 70,
      })
    }
  }

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const overlap = sharedTags(active[i], active[j])
      if (overlap.length > 2) {
        insights.push({
          id: `overlap-${active[i].id}-${active[j].id}`,
          message: `Your ideas ${active[i].title} and ${active[j].title} may overlap (${overlap.slice(0, 3).join(', ')}). Consider combining them.`,
          cta: 'View ideas',
          href: routes.ideas,
          priority: 60,
        })
      }
    }
  }

  return insights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
}
