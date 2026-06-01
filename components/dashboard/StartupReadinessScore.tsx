'use client'

import { computeStartupReadinessPercent, type ReadinessSignals } from '@/lib/dashboard/readiness'

type StartupReadinessScoreProps = {
  signals: ReadinessSignals
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const SIZES = {
  sm: { box: 44, stroke: 4, font: 11 },
  md: { box: 72, stroke: 5, font: 15 },
  lg: { box: 96, stroke: 6, font: 20 },
}

export function StartupReadinessScore({
  signals,
  size = 'md',
  showLabel = true,
  className = '',
}: StartupReadinessScoreProps) {
  const percent = computeStartupReadinessPercent(signals)
  const { box, stroke, font } = SIZES[size]
  const radius = (box - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className={`startup-readiness ${className}`.trim()} title={`Startup Readiness ${percent}%`}>
      <div className="startup-readiness-ring" style={{ width: box, height: box }}>
        <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} aria-hidden>
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            stroke="var(--line-2)"
            strokeWidth={stroke}
          />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${box / 2} ${box / 2})`}
          />
        </svg>
        <span className="startup-readiness-pct" style={{ fontSize: font }}>
          {percent}%
        </span>
      </div>
      {showLabel && <span className="startup-readiness-label">Startup Readiness</span>}
    </div>
  )
}
