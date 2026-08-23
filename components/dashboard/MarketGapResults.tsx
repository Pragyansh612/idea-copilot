'use client'

import { useRouter } from 'next/navigation'
import type { ConfidenceLevel, GapItem } from '@/lib/dashboard/gaps'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

function impactFromGap(gap: GapItem): 'high' | 'medium' | 'low' {
  if (gap.potential_impact) return gap.potential_impact
  return 'medium'
}

type OpportunityPoint = { x: number; y: number; text: string }
type OpportunityLabel = { x: number; y: number; text: string }

/**
 * Place chart labels avoiding overlap with previously-placed labels by
 * trying a small set of vertical "lanes" above/below each point, instead of
 * always rendering at a fixed offset (which smashed together as soon as two
 * points were close on the x-axis — see PRODUCT_AUDIT_2026-08-22.md §1b
 * item 3). Not a full force-directed layout, but bounded and deterministic.
 */
function layoutOpportunityLabels(points: OpportunityPoint[]): OpportunityLabel[] {
  const CHAR_WIDTH = 5.3
  const LABEL_HEIGHT = 11
  const LANES = [-8, 15, -24, 32, -40, 48]
  const placed: { left: number; right: number; top: number; bottom: number }[] = []

  const overlaps = (box: { left: number; right: number; top: number; bottom: number }) =>
    placed.some(
      p => box.left < p.right + 4 && box.right > p.left - 4 && box.top < p.bottom + 2 && box.bottom > p.top - 2,
    )

  return points.map(point => {
    const width = point.text.length * CHAR_WIDTH
    const left = point.x + 8
    const right = left + width

    for (const offset of LANES) {
      const labelY = point.y + offset
      const box = { left, right, top: labelY - LABEL_HEIGHT, bottom: labelY }
      if (!overlaps(box)) {
        placed.push(box)
        return { x: left, y: labelY, text: point.text }
      }
    }

    const labelY = point.y + LANES[LANES.length - 1]
    placed.push({ left, right, top: labelY - LABEL_HEIGHT, bottom: labelY })
    return { x: left, y: labelY, text: point.text }
  })
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
          {(() => {
            const points = gaps.map((g, idx) => {
              const x = 40 + (idx / Math.max(gaps.length - 1, 1)) * 380
              const impactScore = { high: 85, medium: 55, low: 30 }[impactFromGap(g)]
              const y = 180 - (impactScore / 100) * 150
              return { x, y, text: (g.title || `Opp ${idx + 1}`).slice(0, 22) }
            })
            const labels = layoutOpportunityLabels(points)
            return points.map((point, idx) => {
              const label = labels[idx]
              const isOffset = Math.abs(label.y - (point.y - 8)) > 2
              return (
                <g key={`${gaps[idx].title || idx}`}>
                  {isOffset && (
                    <line
                      x1={point.x + 6}
                      y1={point.y}
                      x2={label.x - 2}
                      y2={label.y - 3}
                      stroke="var(--line-3)"
                      strokeWidth={0.75}
                    />
                  )}
                  <circle cx={point.x} cy={point.y} r={6} fill="var(--accent)" />
                  <text x={label.x} y={label.y} fill="var(--fg)" fontSize="10">
                    {label.text}
                  </text>
                </g>
              )
            })
          })()}
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
