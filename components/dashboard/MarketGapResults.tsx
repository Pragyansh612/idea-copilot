'use client'

import { useRouter } from 'next/navigation'
import type { GapItem } from '@/lib/dashboard/gaps'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

function impactFromGap(gap: GapItem): 'high' | 'medium' | 'low' {
  const text = `${gap.urgency || ''} ${gap.tam || ''} ${gap.title || ''}`.toLowerCase()
  if (text.includes('high') || text.includes('urgent') || text.includes('large')) return 'high'
  if (text.includes('low') || text.includes('small')) return 'low'
  return 'medium'
}

function scoreFromText(text: string | undefined): number {
  if (!text) return 50
  const n = Number(text)
  if (Number.isFinite(n)) return Math.max(0, Math.min(100, n))
  const t = text.toLowerCase()
  if (t.includes('high')) return 80
  if (t.includes('low')) return 30
  return 55
}

type Props = {
  gaps: GapItem[]
  ideaId: string
}

export function MarketGapResults({ gaps, ideaId }: Props) {
  const router = useRouter()
  if (gaps.length === 0) return null

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="dash-card">
        <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Opportunity map</div>
        <svg viewBox="0 0 460 220" className="gap-opportunity-chart" role="img" aria-label="Market gap opportunity chart">
          <line x1="40" y1="180" x2="430" y2="180" stroke="var(--line-3)" />
          <line x1="40" y1="20" x2="40" y2="180" stroke="var(--line-3)" />
          <text x="235" y="208" textAnchor="middle" fill="var(--fg-3)" fontSize="10">Market competition (low → high)</text>
          <text x="10" y="100" transform="rotate(-90 10 100)" textAnchor="middle" fill="var(--fg-3)" fontSize="10">Opportunity size (low → high)</text>
          {gaps.map((g, idx) => {
            const x = 40 + (idx / Math.max(gaps.length - 1, 1)) * 380
            const y = 180 - (scoreFromText(g.urgency || g.tam) / 100) * 150
            return (
              <g key={`${g.title || idx}`}>
                <circle cx={x} cy={y} r={6} fill="var(--accent)" />
                <text x={x + 8} y={y - 8} fill="var(--fg)" fontSize="10">
                  {(g.title || g.opportunity || `Opp ${idx + 1}`).slice(0, 22)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      {gaps.map((g, i) => {
        const impact = impactFromGap(g)
        const title = g.title || g.opportunity || 'Market opportunity'
        const discussPrompt = `Help me evaluate this market opportunity for my idea: "${title}". ${g.description || ''}`
        return (
          <div key={`${title}-${i}`} className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              <div className="eyebrow-mono">
                #{String(i + 1).padStart(2, '0')}
                {g.confidence_score != null && ` · ${Math.round(g.confidence_score)}% conf`}
              </div>
              <span className={`i-tag ${impact === 'high' ? 'hot' : impact === 'low' ? '' : 'accent'}`}>impact · {impact}</span>
            </div>
            <h3 style={{ marginBottom: 8 }}>{title}</h3>
            <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.55, marginBottom: 10 }}>
              {g.description || 'No description provided.'}
            </p>
            <button
              type="button"
              className="btn-sm ghost"
              onClick={() => router.push(routes.copilotDiscuss(ideaId, discussPrompt))}
            >
              <DI.Spark /> Discuss with Copilot
            </button>
          </div>
        )
      })}
    </div>
  )
}
