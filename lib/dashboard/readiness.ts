export type ReadinessItem = {
  label: string
  done: boolean
  cta: string
  action: () => void
}

export function buildReadinessItems(input: {
  hasDescription: boolean
  hasFeatures: boolean
  hasPhases: boolean
  hasCompetitors: boolean
  hasMarketGap: boolean
  onDescribe: () => void
  onGenerateFeatures: () => void
  onCreateRoadmap: () => void
  onDiscoverCompetitors: () => void
  onRunMarketGap: () => void
}): ReadinessItem[] {
  return [
    {
      label: 'Idea described',
      done: input.hasDescription,
      cta: 'Add description',
      action: input.onDescribe,
    },
    {
      label: 'Features added',
      done: input.hasFeatures,
      cta: 'Generate with AI',
      action: input.onGenerateFeatures,
    },
    {
      label: 'Roadmap created',
      done: input.hasPhases,
      cta: 'Create phases',
      action: input.onCreateRoadmap,
    },
    {
      label: 'Competitors researched',
      done: input.hasCompetitors,
      cta: 'Discover competitors',
      action: input.onDiscoverCompetitors,
    },
    {
      label: 'Market gap analyzed',
      done: input.hasMarketGap,
      cta: 'Run market gap analysis',
      action: input.onRunMarketGap,
    },
  ]
}
