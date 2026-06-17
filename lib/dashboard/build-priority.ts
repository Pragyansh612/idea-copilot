import type { Feature, Phase, PriorityEnum } from '@/lib/api/idea'

export type BuildPriorityRow = {
  id: string
  kind: 'feature' | 'phase'
  title: string
  subtitle?: string
  impactScore: number
  priority?: PriorityEnum
  isCompleted: boolean
  rank: number
}

const PRIORITY_IMPACT: Record<PriorityEnum, number> = {
  high: 80,
  medium: 55,
  low: 30,
}

export function priorityToImpact(priority: PriorityEnum | string | undefined): number {
  if (priority && priority in PRIORITY_IMPACT) {
    return PRIORITY_IMPACT[priority as PriorityEnum]
  }
  return PRIORITY_IMPACT.medium
}

/** Rank incomplete features and phases by impact — what to build first. */
export function buildPriorityRows(features: Feature[], phases: Phase[]): BuildPriorityRow[] {
  const phaseById = new Map(phases.map(p => [p.id, p]))
  const rows: Omit<BuildPriorityRow, 'rank'>[] = []

  for (const phase of [...phases].sort((a, b) => a.order_index - b.order_index)) {
    if (phase.is_completed) continue
    const phaseFeatures = features.filter(f => f.phase_id === phase.id && !f.is_completed)
    const avgImpact =
      phaseFeatures.length > 0
        ? phaseFeatures.reduce((sum, f) => sum + priorityToImpact(f.priority), 0) / phaseFeatures.length
        : Math.max(40, 70 - phase.order_index * 5)

    rows.push({
      id: `phase-${phase.id}`,
      kind: 'phase',
      title: phase.name,
      subtitle: phaseFeatures.length > 0 ? `${phaseFeatures.length} features in phase` : 'Roadmap milestone',
      impactScore: Math.round(avgImpact),
      isCompleted: false,
    })
  }

  for (const feature of features) {
    if (feature.is_completed) continue
    const phase = feature.phase_id ? phaseById.get(feature.phase_id) : undefined
    rows.push({
      id: feature.id,
      kind: 'feature',
      title: feature.title,
      subtitle: phase?.name ?? 'Unassigned',
      impactScore: priorityToImpact(feature.priority),
      priority: feature.priority,
      isCompleted: false,
    })
  }

  return rows
    .sort((a, b) => {
      if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore
      if (a.kind !== b.kind) return a.kind === 'phase' ? -1 : 1
      return a.title.localeCompare(b.title)
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))
}
