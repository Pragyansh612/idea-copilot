import { AIAPI, CompetitorAPI, IdeaAPI, type Feature, type Idea, type Phase } from '@/lib/api/idea'
import {
  computeStartupReadinessPercent,
  signalsFromIdeaDetail,
  type ReadinessSignals,
} from '@/lib/dashboard/readiness'
import { loadGapsForIdea } from '@/lib/dashboard/gap-storage'

export type ChipGroup = {
  stage: string
  chips: string[]
}

export type QuickReportId = 'mvp' | 'gtm' | 'competitive' | 'investor'

export type QuickReportDef = {
  id: QuickReportId
  label: string
  shortLabel: string
}

export const QUICK_REPORTS: QuickReportDef[] = [
  { id: 'mvp', label: 'MVP Plan', shortLabel: 'MVP' },
  { id: 'gtm', label: 'Go-To-Market', shortLabel: 'GTM' },
  { id: 'competitive', label: 'Competitive Analysis Summary', shortLabel: 'Competitive' },
  { id: 'investor', label: 'Investor Pitch Points', shortLabel: 'Pitch' },
]

export type ReportSection = {
  title: string
  items: string[]
}

export type ExtractableListItem = {
  title: string
  description?: string
}

export type ExtractableList = {
  itemType: 'feature' | 'phase'
  items: ExtractableListItem[]
}

export type IdeaCopilotContext = {
  idea: Idea
  features: Feature[]
  phases: Phase[]
  competitorCount: number
  signals: ReadinessSignals
  readinessPercent: number
}

const WORKSPACE_CHIPS = [
  'Help me pick my strongest idea',
  'What should I validate first?',
  'Compare my active ideas',
  'How do I reach 100% readiness?',
]

export function buildTieredChipGroups(signals: ReadinessSignals): ChipGroup[] {
  const groups: ChipGroup[] = []
  const percent = computeStartupReadinessPercent(signals)

  if (!signals.hasDescription) {
    groups.push({
      stage: 'Define your idea',
      chips: ['Help me refine my idea description', 'Who is my target user?'],
    })
  }
  if (!signals.hasFeatures) {
    groups.push({
      stage: 'Features',
      chips: ['What core features should I build?', 'What is my core value proposition?'],
    })
  }
  if (!signals.hasPhases) {
    groups.push({
      stage: 'Roadmap',
      chips: ['How should I phase my launch?', 'What belongs in v1 vs later?'],
    })
  }
  if (!signals.hasCompetitors) {
    groups.push({
      stage: 'Competitor intelligence',
      chips: ['Who are my competitors?', 'What makes me different?'],
    })
  }
  if (!signals.hasMarketGap) {
    groups.push({
      stage: 'Market opportunity',
      chips: ['Find my market opportunity', 'What are competitors missing?'],
    })
  }
  if (percent >= 100) {
    groups.push({
      stage: 'Ready to execute',
      chips: ['Generate my MVP scope', 'Write my pitch summary', 'What should I build first?'],
    })
  }

  return groups
}

export function workspaceSuggestionChips(): string[] {
  return WORKSPACE_CHIPS
}

export async function fetchIdeaCopilotContext(ideaId: string): Promise<IdeaCopilotContext> {
  const [detail, comp] = await Promise.all([
    IdeaAPI.getIdea(ideaId),
    CompetitorAPI.getCompetitorResearch(ideaId).catch(() => ({
      research: [] as unknown[],
      competitors: [] as unknown[],
    })),
  ])
  const competitors = (comp.research || comp.competitors || []) as unknown[]
  const signals = signalsFromIdeaDetail({
    description: detail.idea.description,
    featureCount: detail.features?.length ?? 0,
    phaseCount: detail.phases?.length ?? 0,
    competitorCount: competitors.length,
    ideaId,
  })
  return {
    idea: detail.idea,
    features: detail.features ?? [],
    phases: detail.phases ?? [],
    competitorCount: competitors.length,
    signals,
    readinessPercent: computeStartupReadinessPercent(signals),
  }
}

function featureLines(features: Feature[]): string {
  if (features.length === 0) return '- None yet'
  return features
    .slice(0, 14)
    .map(f => `- ${f.title}${f.priority ? ` (${f.priority})` : ''}`)
    .join('\n')
}

function phaseLines(phases: Phase[]): string {
  if (phases.length === 0) return '- None yet'
  return phases.map(p => `- ${p.name}`).join('\n')
}

function gapSummary(ideaId: string): string {
  const gaps = loadGapsForIdea(ideaId)
  if (gaps.length === 0) return 'No market gap analysis stored yet.'
  return gaps
    .slice(0, 5)
    .map(g => `- ${g.title || g.description || 'Gap'}${g.potential_impact ? ` (${g.potential_impact} impact)` : ''}`)
    .join('\n')
}

export function buildQuickReportPrompt(reportId: QuickReportId, ctx: IdeaCopilotContext): string {
  const { idea, features, phases, competitorCount } = ctx
  const base = `Idea: "${idea.title}"
Description: ${idea.description?.trim() || 'Not provided'}
Priority: ${idea.priority}
Features (${features.length}):
${featureLines(features)}
Roadmap phases (${phases.length}):
${phaseLines(phases)}
Competitors researched: ${competitorCount}
Market gaps:
${gapSummary(idea.id)}`

  switch (reportId) {
    case 'mvp':
      return `You are a product manager writing an MVP Plan. Use this idea context:

${base}

Respond with EXACTLY these markdown sections and bullet points (3-5 bullets each):

## MVP Goal
## Core Features
## Out of Scope
## Timeline
## Success Metrics

Be specific to this idea. Keep bullets actionable.`
    case 'gtm':
      return `You are a go-to-market strategist. Use this idea context:

${base}

Respond with EXACTLY these markdown sections and bullet points (3-5 bullets each):

## Target Audience
## Channels
## Launch Plan
## Messaging

Be specific to this idea.`
    case 'competitive':
      return `You are a competitive intelligence analyst. Use this idea context:

${base}

Respond with EXACTLY these markdown sections and bullet points (3-5 bullets each):

## Market Landscape
## Key Competitors
## Differentiation
## Gaps to Exploit

Be specific to this idea.`
    case 'investor':
      return `You are a startup advisor preparing investor pitch points. Use this idea context:

${base}

Respond with EXACTLY these markdown sections and bullet points (3-5 bullets each):

## Problem
## Solution
## Market Opportunity
## Traction & Milestones
## The Ask

Be concise and investor-ready.`
    default:
      return base
  }
}

export function quickReportTitle(reportId: QuickReportId): string {
  return QUICK_REPORTS.find(r => r.id === reportId)?.label ?? 'Report'
}

export function parseReportSections(text: string): ReportSection[] {
  const lines = text.split('\n').map(l => l.trim().replace(/\*\*/g, '')).filter(Boolean)
  const sections: ReportSection[] = []
  let current: ReportSection | null = null

  function pushCurrent() {
    if (current && current.items.length > 0) sections.push(current)
    current = null
  }

  for (const line of lines) {
    const mdHeading = line.match(/^#{1,3}\s+(.+)/)
    if (mdHeading) {
      pushCurrent()
      current = { title: mdHeading[1].replace(/:$/, ''), items: [] }
      continue
    }
    const bullet = line.match(/^[-*•]\s+(.+)/) || line.match(/^\d+[.)]\s+(.+)/)
    if (bullet && current) {
      current.items.push(bullet[1].trim())
    }
  }
  pushCurrent()

  if (sections.length > 0) return sections

  const fallbackItems = lines
    .map(l => l.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '').trim())
    .filter(Boolean)
  if (fallbackItems.length >= 2) {
    return [{ title: 'Summary', items: fallbackItems }]
  }
  return []
}

export function detectExtractableList(text: string): ExtractableList | null {
  const lines = text.split('\n')
  const items: ExtractableListItem[] = []

  for (const line of lines) {
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)/)
    if (!bullet) continue
    const raw = bullet[1].trim().replace(/\*\*/g, '')
    const titled = raw.match(/^([^:—–-]+)[:—–-]\s*(.+)/)
    if (titled) {
      items.push({ title: titled[1].trim(), description: titled[2].trim() })
    } else {
      items.push({ title: raw.length > 120 ? `${raw.slice(0, 117)}…` : raw })
    }
  }

  if (items.length < 2) return null

  const sample = text.toLowerCase()
  const phaseHits =
    (sample.match(/\bphase\b|\broadmap\b|\bmilestone\b|\bsprint\b|\blaunch sequence\b|\bweek \d/g) || [])
      .length
  const featureHits =
    (sample.match(/\bfeature\b|\bfunctionality\b|\bcapability\b|\bbuild\b|\bimplement\b|\bmvp\b/g) || [])
      .length

  const itemType: 'feature' | 'phase' = phaseHits > featureHits ? 'phase' : 'feature'
  return { itemType, items: items.slice(0, 12) }
}

export async function applyCopilotListToIdea(
  ideaId: string,
  list: ExtractableList,
  copilotResponse: string,
): Promise<{ created: number; itemType: 'feature' | 'phase' }> {
  const suggestionType = list.itemType === 'phase' ? 'phases' : 'features'
  const suggestion = await AIAPI.generateSuggestions({
    idea_id: ideaId,
    suggestion_type: suggestionType,
    context: `Add these ${list.itemType}s from Copilot to the idea:\n\n${copilotResponse}`,
  })

  let created = 0
  for (const item of list.items) {
    await AIAPI.createFromSuggestion({
      suggestion_id: suggestion.id,
      item_type: list.itemType,
      idea_id: ideaId,
      title: item.title,
      description: item.description,
    })
    created++
  }

  return { created, itemType: list.itemType }
}
