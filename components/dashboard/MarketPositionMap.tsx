'use client'

import { useMemo } from 'react'
import type { PositionPoint } from '@/lib/dashboard/competitor-intel'

type Props = {
  points: PositionPoint[]
}

function clipLabel(label: string, isYou: boolean) {
  if (isYou) return 'You'
  if (label.length <= 14) return label
  return `${label.slice(0, 12)}…`
}

function jitter(points: PositionPoint[]): PositionPoint[] {
  // Slightly spread near-overlaps so labels don't sit on each other
  const seen = new Map<string, number>()
  return points.map(p => {
    const key = `${Math.round(p.x / 4)}:${Math.round(p.y / 4)}`
    const n = seen.get(key) ?? 0
    seen.set(key, n + 1)
    if (n === 0) return p
    return {
      ...p,
      x: Math.min(98, Math.max(2, p.x + (n % 2 === 0 ? 3 : -3) * Math.ceil(n / 2))),
      y: Math.min(98, Math.max(2, p.y + (n % 2 === 0 ? -3 : 3) * Math.ceil(n / 2))),
    }
  })
}

export function MarketPositionMap({ points }: Props) {
  const plotted = useMemo(() => jitter(points), [points])
  const ranked = useMemo(
    () => [...points].sort((a, b) => (b.x + b.y) - (a.x + a.y)),
    [points],
  )

  if (points.length === 0) {
    return (
      <div className="dash-card ci-position-map">
        <div className="eyebrow-mono">Market position map</div>
        <p className="ci-position-map-desc">
          Add your features and analyze competitors to plot coverage vs innovation. Discover competitors first, then run Analyze on each.
        </p>
      </div>
    )
  }

  const padL = 52
  const padR = 20
  const padT = 36
  const padB = 44
  const w = 720
  const h = 360
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  const toX = (v: number) => padL + (Math.min(100, Math.max(0, v)) / 100) * plotW
  const toY = (v: number) => padT + plotH - (Math.min(100, Math.max(0, v)) / 100) * plotH

  const quads = [
    { x: padL + plotW * 0.72, y: padT + 18, label: 'Leaders' },
    { x: padL + plotW * 0.18, y: padT + 18, label: 'Innovators' },
    { x: padL + plotW * 0.18, y: padT + plotH - 12, label: 'Niche' },
    { x: padL + plotW * 0.72, y: padT + plotH - 12, label: 'Broad / mature' },
  ]

  return (
    <div className="dash-card ci-position-map">
      <div className="eyebrow-mono">Market position map</div>
      <p className="ci-position-map-desc">
        Coverage (right) vs innovation signal (up). Approximate — use it to spot clusters, not as a scoreboard.
      </p>
      <div className="ci-position-layout">
        <div className="ci-position-map-frame">
          <svg viewBox={`0 0 ${w} ${h}`} className="ci-quadrant" role="img" aria-label="Market position quadrant">
            <defs>
              <pattern id="ci-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--line)" strokeWidth="0.5" opacity="0.5" />
              </pattern>
            </defs>
            <rect x={padL} y={padT} width={plotW} height={plotH} fill="url(#ci-grid)" stroke="var(--line)" rx="10" />
            <line
              x1={padL}
              y1={padT + plotH / 2}
              x2={padL + plotW}
              y2={padT + plotH / 2}
              stroke="var(--line-3)"
              strokeDasharray="5 5"
            />
            <line
              x1={padL + plotW / 2}
              y1={padT}
              x2={padL + plotW / 2}
              y2={padT + plotH}
              stroke="var(--line-3)"
              strokeDasharray="5 5"
            />
            {quads.map(q => (
              <text key={q.label} x={q.x} y={q.y} fill="var(--fg-4)" fontSize="10" textAnchor="middle">
                {q.label}
              </text>
            ))}
            <text x={padL + plotW / 2} y={h - 14} textAnchor="middle" fill="var(--fg-3)" fontSize="11">
              Feature coverage →
            </text>
            <text
              x={16}
              y={padT + plotH / 2}
              transform={`rotate(-90 16 ${padT + plotH / 2})`}
              textAnchor="middle"
              fill="var(--fg-3)"
              fontSize="11"
            >
              Innovation →
            </text>
            {plotted.map(p => {
              const cx = toX(p.x)
              const cy = toY(p.y)
              const label = clipLabel(p.label, Boolean(p.isYou))
              return (
                <g key={p.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={p.isYou ? 8 : 5.5}
                    fill={p.isYou ? 'var(--accent)' : 'var(--fg-3)'}
                    stroke={p.isYou ? 'color-mix(in srgb, var(--accent) 35%, white)' : 'var(--surface)'}
                    strokeWidth={p.isYou ? 2.5 : 1.5}
                  />
                  <text
                    x={cx}
                    y={cy - (p.isYou ? 14 : 12)}
                    textAnchor="middle"
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
        <div className="ci-position-aside">
          <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Ranked list</div>
          <ul className="ci-position-list">
            {ranked.slice(0, 12).map(p => (
              <li key={p.id} className={p.isYou ? 'you' : ''}>
                <span className="ci-position-list-name" title={p.label}>{p.label}</span>
                <span className="ci-position-list-meta">
                  {Math.round(p.x)} cov · {Math.round(p.y)} innov
                </span>
              </li>
            ))}
          </ul>
          {ranked.length > 12 && (
            <p className="ci-position-list-more">+{ranked.length - 12} more on the map</p>
          )}
        </div>
      </div>
      <div className="ci-position-legend">
        <span><i className="ci-position-dot you" /> Your idea</span>
        <span><i className="ci-position-dot" /> Competitor</span>
      </div>
    </div>
  )
}
