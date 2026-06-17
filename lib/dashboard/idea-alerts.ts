import type { Feature, Idea, Phase } from '@/lib/api/idea'
import { routes } from '@/lib/routes'

const MS_DAY = 86_400_000
const STALE_COMPETITOR_DAYS = 30
const OLD_IDEA_DAYS = 30

export type IdeaAlert = {
  id: string
  message: string
  cta: string
  action: 'roadmap' | 'intelligence' | 'roadmap-review'
}

const DISMISS_PREFIX = 'ic-dismissed-alerts:'

export function getDismissedAlertIds(ideaId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(`${DISMISS_PREFIX}${ideaId}`)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function dismissAlert(ideaId: string, alertId: string): void {
  if (typeof window === 'undefined') return
  const set = getDismissedAlertIds(ideaId)
  set.add(alertId)
  localStorage.setItem(`${DISMISS_PREFIX}${ideaId}`, JSON.stringify([...set]))
}

function daysSince(iso: string | undefined): number {
  if (!iso) return 999
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 999
  return (Date.now() - t) / MS_DAY
}

function latestCompetitorResearchAt(competitors: Array<Record<string, unknown>>): string | null {
  let latest: number | null = null
  for (const c of competitors) {
    const iso = String(c.updated_at || c.created_at || '')
    const t = new Date(iso).getTime()
    if (!Number.isNaN(t) && (latest === null || t > latest)) latest = t
  }
  return latest !== null ? new Date(latest).toISOString() : null
}

export function buildIdeaAlerts(input: {
  idea: Idea
  phases: Phase[]
  features: Feature[]
  competitors: Array<Record<string, unknown>>
}): IdeaAlert[] {
  const alerts: IdeaAlert[] = []
  const { idea, phases, features, competitors } = input

  if (idea.status === 'in_progress' && phases.length === 0) {
    alerts.push({
      id: 'no-roadmap',
      message: 'This idea is marked active but has no roadmap.',
      cta: 'Create phases',
      action: 'roadmap',
    })
  }

  if (competitors.length > 0) {
    const latest = latestCompetitorResearchAt(competitors)
    if (latest && daysSince(latest) > STALE_COMPETITOR_DAYS) {
      alerts.push({
        id: 'stale-competitors',
        message: 'Competitor research may be outdated.',
        cta: 'Re-run analysis',
        action: 'intelligence',
      })
    }
  }

  const hasFeatures = features.length > 0
  const anyDone = features.some(f => f.is_completed)
  const ideaAge = daysSince(idea.created_at)
  if (hasFeatures && !anyDone && ideaAge > OLD_IDEA_DAYS) {
    alerts.push({
      id: 'no-features-done',
      message: 'No features completed yet.',
      cta: 'Review roadmap',
      action: 'roadmap-review',
    })
  }

  return alerts
}

export function alertActionHref(ideaId: string, action: IdeaAlert['action']): string {
  switch (action) {
    case 'roadmap':
      return routes.ideaTab(ideaId, 'roadmap', { focus: 'phase' })
    case 'intelligence':
      return routes.intelligenceForIdea(ideaId)
    case 'roadmap-review':
      return routes.ideaTab(ideaId, 'roadmap')
    default:
      return routes.idea(ideaId)
  }
}
