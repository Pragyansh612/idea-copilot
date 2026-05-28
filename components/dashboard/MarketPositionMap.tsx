'use client'

import type { PositionPoint } from '@/lib/dashboard/competitor-intel'

type Props = {
  points: PositionPoint[]
}

export function MarketPositionMap({ points }: Props) {
  if (points.length === 0) return null

  const pad = 48
  const w = 480
  const h = 240
  const plotW = w - pad * 2
  const plotH = h - pad * 2

  const toX = (v: number) => pad + (v / 100) * plotW
  const toY = (v: number) => pad + plotH - (v / 100) * plotH

  return (
    <div className="dash-card">
      <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Market position map</div>
      <p style={{ color: 'var(--fg-2)', fontSize: 13, marginBottom: 12 }}>
        Coverage (feature breadth) vs innovation signals from feature data — strategic approximation.
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="ci-quadrant" role="img" aria-label="Market position quadrant">
        <rect x={pad} y={pad} width={plotW} height={plotH} fill="var(--bg-2)" stroke="var(--line)" rx="8" />
        <line x1={pad} y1={pad + plotH / 2} x2={pad + plotW} y2={pad + plotH / 2} stroke="var(--line-3)" strokeDasharray="4 4" />
        <line x1={pad + plotW / 2} y1={pad} x2={pad + plotW / 2} y2={pad + plotH} stroke="var(--line-3)" strokeDasharray="4 4" />
        <text x={pad + plotW / 2} y={h - 8} textAnchor="middle" fill="var(--fg-3)" fontSize="10">
          Market coverage →
        </text>
        <text x={12} y={pad + plotH / 2} transform={`rotate(-90 12 ${pad + plotH / 2})`} textAnchor="middle" fill="var(--fg-3)" fontSize="10">
          AI innovation →
        </text>
        {points.map(p => (
          <g key={p.id}>
            <circle
              cx={toX(p.x)}
              cy={toY(p.y)}
              r={p.isYou ? 8 : 6}
              fill={p.isYou ? 'var(--accent)' : 'var(--fg-3)'}
              stroke={p.isYou ? 'var(--accent-line)' : 'transparent'}
              strokeWidth={2}
            />
            <text x={toX(p.x) + 10} y={toY(p.y) - 6} fill="var(--fg)" fontSize="10">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
