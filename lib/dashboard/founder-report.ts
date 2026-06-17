import type { Feature, Idea, Phase } from '@/lib/api/idea'

export type FounderReportSectionKey =
  | 'strengths'
  | 'weaknesses'
  | 'opportunities'
  | 'threats'
  | 'build_scope'

export type FounderReportSection = {
  key: FounderReportSectionKey
  title: string
  items: string[]
}

export type FounderReport = {
  sections: FounderReportSection[]
  generatedAt: string
}

const REPORT_PREFIX = 'ic-founder-report:'

const SECTION_DEFS: Array<{ key: FounderReportSectionKey; match: RegExp; title: string }> = [
  { key: 'strengths', match: /strength/i, title: 'Strengths' },
  { key: 'weaknesses', match: /weakness/i, title: 'Weaknesses' },
  { key: 'opportunities', match: /opportunit/i, title: 'Opportunities' },
  { key: 'threats', match: /threat/i, title: 'Threats' },
  { key: 'build_scope', match: /recommended first build|first build scope|mvp scope|build scope/i, title: 'Recommended first build scope' },
]

export function buildFounderReportPrompt(
  idea: Idea,
  features: Feature[],
  phases: Phase[],
  competitorCount: number,
): string {
  const featureList = features.slice(0, 12).map(f => `- ${f.title} (${f.priority})`).join('\n') || '- None yet'
  const phaseList = phases.map(p => `- ${p.name}`).join('\n') || '- None yet'

  return `You are a startup advisor writing a concise Founder Report for the idea "${idea.title}".

Context:
- Description: ${idea.description?.trim() || 'Not provided'}
- Priority: ${idea.priority}
- Overall score: ${idea.overall_score ?? 'n/a'}
- Features (${features.length}):
${featureList}
- Roadmap phases (${phases.length}):
${phaseList}
- Competitors researched: ${competitorCount}

Respond with EXACTLY these markdown sections and bullet points (3-5 bullets each where applicable):

## Strengths
## Weaknesses
## Opportunities
## Threats
## Recommended first build scope

Be specific to this idea. Under "Recommended first build scope", list the smallest shippable MVP — concrete features or milestones only.`
}

export function parseFounderReport(text: string): FounderReportSection[] {
  const lines = text.split('\n').map(l => l.trim().replace(/\*\*/g, '')).filter(Boolean)
  const sections: FounderReportSection[] = []
  let current: FounderReportSection | null = null

  function pushCurrent() {
    if (current && current.items.length > 0) sections.push(current)
    current = null
  }

  for (const line of lines) {
    const mdHeading = line.match(/^#{1,3}\s+(.+)/)
    if (mdHeading) {
      const heading = mdHeading[1].replace(/:$/, '')
      const def = SECTION_DEFS.find(d => d.match.test(heading))
      if (def) {
        pushCurrent()
        current = { key: def.key, title: def.title, items: [] }
        continue
      }
    }

    const bullet = line.match(/^(?:[-*•]|\d+\.)\s+(.+)/)
    if (bullet && current) {
      current.items.push(bullet[1])
      continue
    }

    if (!bullet && !mdHeading) {
      const plainHeading = SECTION_DEFS.find(d => d.match.test(line.replace(/:$/, '')))
      if (plainHeading && line.length < 80) {
        pushCurrent()
        current = { key: plainHeading.key, title: plainHeading.title, items: [] }
      }
    }
  }

  pushCurrent()

  if (sections.length === 0) {
    const bullets = lines
      .map(l => l.match(/^(?:[-*•]|\d+\.)\s+(.+)/)?.[1])
      .filter((x): x is string => Boolean(x))
    if (bullets.length) {
      return [{ key: 'build_scope', title: 'Founder Report', items: bullets }]
    }
    return [{ key: 'build_scope', title: 'Founder Report', items: [text.slice(0, 800)] }]
  }

  const order = SECTION_DEFS.map(d => d.key)
  return [...sections].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
}

export function loadFounderReport(ideaId: string): FounderReport | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${REPORT_PREFIX}${ideaId}`)
    if (!raw) return null
    return JSON.parse(raw) as FounderReport
  } catch {
    return null
  }
}

export function saveFounderReport(ideaId: string, report: FounderReport): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${REPORT_PREFIX}${ideaId}`, JSON.stringify(report))
}
