'use client'

import { useRouter } from 'next/navigation'
import type { ConfidenceLevel, GapItem } from '@/lib/dashboard/gaps'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

function impactFromGap(gap: GapItem): 'high' | 'medium' | 'low' {
  if (gap.potential_impact) return gap.potential_impact
  return 'medium'
}

type Props = {
  gaps: GapItem[]
  ideaId: string
  confidence?: ConfidenceLevel
  confidenceReason?: string
  nextAction?: string
  onDiscoverCompetitors?: () => void
}

const IMPACT_TAG_CLASS: Record<'high' | 'medium' | 'low', string> = {
  high: 'good',
  medium: 'warn',
  low: '',
}

export function MarketGapResults({ gaps, ideaId, confidence, confidenceReason, nextAction, onDiscoverCompetitors }: Props) {
  const router = useRouter()
  if (gaps.length === 0) return null

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {nextAction && (
        <div className="dash-card gap-next-action">
          <div className="eyebrow-mono gap-next-action-eyebrow">What to do next</div>
          <p className="gap-next-action-text">{nextAction}</p>
          <button
            type="button"
            className="btn-sm solid"
            onClick={() => router.push(routes.copilotDiscuss(ideaId, `Help me plan this next step: "${nextAction}"`))}
          >
            <DI.Spark /> Discuss with Copilot
          </button>
        </div>
      )}
      {confidence === 'low' && (
        <div className="dash-card" style={{ borderColor: 'color-mix(in srgb, var(--warn) 40%, var(--line))' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <DI.Radar style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: 'grid', gap: 8 }}>
              <p style={{ color: 'var(--fg)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                Limited competitor data available. Run competitor discovery first for more specific insights.
              </p>
              {confidenceReason && (
                <p style={{ color: 'var(--fg-3)', fontSize: 12, margin: 0 }}>{confidenceReason}</p>
              )}
              {onDiscoverCompetitors && (
                <button type="button" className="btn-sm solid" onClick={onDiscoverCompetitors} style={{ justifySelf: 'start' }}>
                  <DI.Radar /> Discover competitors
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {confidence === 'medium' && (
        <p style={{ color: 'var(--fg-3)', fontSize: 12.5, margin: 0 }}>
          Based on partial competitor data.
        </p>
      )}
      <div className="dash-card">
        <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Opportunity map</div>
        <svg viewBox="0 0 460 220" className="gap-opportunity-chart" role="img" aria-label="Market gap opportunity chart">
          <line x1="40" y1="180" x2="430" y2="180" stroke="var(--line-3)" />
          <line x1="40" y1="20" x2="40" y2="180" stroke="var(--line-3)" />
          <text x="235" y="208" textAnchor="middle" fill="var(--fg-3)" fontSize="10">Market competition (low → high)</text>
          <text x="10" y="100" transform="rotate(-90 10 100)" textAnchor="middle" fill="var(--fg-3)" fontSize="10">Opportunity size (low → high)</text>
          {gaps.map((g, idx) => {
            const x = 40 + (idx / Math.max(gaps.length - 1, 1)) * 380
            const impactScore = { high: 85, medium: 55, low: 30 }[impactFromGap(g)]
            const y = 180 - (impactScore / 100) * 150
            return (
              <g key={`${g.title || idx}`}>
                <circle cx={x} cy={y} r={6} fill="var(--accent)" />
                <text x={x + 8} y={y - 8} fill="var(--fg)" fontSize="10">
                  {(g.title || `Opp ${idx + 1}`).slice(0, 22)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      {gaps.map((g, i) => {
        const impact = impactFromGap(g)
        const title = g.title || 'Market opportunity'
        const discussPrompt = `Help me evaluate this market opportunity for my idea: "${title}". ${g.description || ''}`
        return (
          <div key={`${title}-${i}`} className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              <div className="eyebrow-mono">#{String(i + 1).padStart(2, '0')}</div>
              <span className={`i-tag ${IMPACT_TAG_CLASS[impact]}`}>opportunity · {impact}</span>
            </div>
            <h3 style={{ marginBottom: 8 }}>{title}</h3>
            <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.55, marginBottom: g.evidence ? 8 : 10 }}>
              {g.description || 'No description provided.'}
            </p>
            {g.evidence && (
              <p style={{ color: 'var(--fg-3)', fontSize: 12.5, lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>
                Based on: {g.evidence}
              </p>
            )}
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
