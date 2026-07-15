'use client'

import type { PositionPoint } from '@/lib/dashboard/competitor-intel'

type Props = {
  points: PositionPoint[]
}

function clipLabel(label: string, isYou: boolean) {
  if (isYou) return 'You'
  if (label.length <= 16) return label
  return `${label.slice(0, 14)}…`
}

export function MarketPositionMap({ points }: Props) {
  if (points.length === 0) return null

  const padL = 44
  const padR = 28
  const padT = 28
  const padB = 40
  const w = 640
  const h = 320
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  const toX = (v: number) => padL + (Math.min(100, Math.max(0, v)) / 100) * plotW
  const toY = (v: number) => padT + plotH - (Math.min(100, Math.max(0, v)) / 100) * plotH

  return (
    <div className="dash-card ci-position-map">
      <div className="eyebrow-mono">Market position map</div>
      <p className="ci-position-map-desc">
        Horizontal = feature coverage breadth. Vertical = innovation signal from feature data.
        Approximate — use it to spot clusters, not as a precise score.
      </p>
      <div className="ci-position-map-frame">
        <svg viewBox={`0 0 ${w} ${h}`} className="ci-quadrant" role="img" aria-label="Market position quadrant">
          <rect x={padL} y={padT} width={plotW} height={plotH} fill="transparent" stroke="var(--line)" rx="8" />
          <line
            x1={padL}
            y1={padT + plotH / 2}
            x2={padL + plotW}
            y2={padT + plotH / 2}
            stroke="var(--line-3)"
            strokeDasharray="4 4"
          />
          <line
            x1={padL + plotW / 2}
            y1={padT}
            x2={padL + plotW / 2}
            y2={padT + plotH}
            stroke="var(--line-3)"
            strokeDasharray="4 4"
          />
          <text x={padL + plotW / 2} y={h - 12} textAnchor="middle" fill="var(--fg-3)" fontSize="11">
            Feature coverage →
          </text>
          <text
            x={14}
            y={padT + plotH / 2}
            transform={`rotate(-90 14 ${padT + plotH / 2})`}
            textAnchor="middle"
            fill="var(--fg-3)"
            fontSize="11"
          >
            Innovation signal →
          </text>
          {points.map(p => {
            const cx = toX(p.x)
            const cy = toY(p.y)
            const label = clipLabel(p.label, Boolean(p.isYou))
            return (
              <g key={p.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={p.isYou ? 7 : 5}
                  fill={p.isYou ? 'var(--accent)' : 'var(--fg-3)'}
                  stroke={p.isYou ? 'color-mix(in srgb, var(--accent) 40%, white)' : 'transparent'}
                  strokeWidth={p.isYou ? 2 : 0}
                />
                <text
                  x={cx + (p.isYou ? 11 : 9)}
                  y={cy + 3}
                  fill={p.isYou ? 'var(--accent)' : 'var(--fg-2)'}
                  fontSize={p.isYou ? 11 : 10}
                  fontWeight={p.isYou ? 600 : 400}
                >
                  {label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="ci-position-legend">
        <span><i className="ci-position-dot you" /> Your idea</span>
        <span><i className="ci-position-dot" /> Competitor</span>
      </div>
    </div>
  )
}
