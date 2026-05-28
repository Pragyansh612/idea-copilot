'use client'

import { Fragment } from 'react'
import type { FeatureMatrix } from '@/lib/dashboard/competitor-intel'
import * as DI from '@/components/dashboard/Icons'

type Props = {
  matrix: FeatureMatrix
  loading?: boolean
}

export function CompetitorFeatureMatrix({ matrix, loading }: Props) {
  const colCount = matrix.columns.length

  if (loading) {
    return (
      <div className="feature-mat">
        <div className="ci-panel-head">Feature comparison matrix</div>
        <p style={{ padding: 18, color: 'var(--fg-2)' }}>Loading feature data…</p>
      </div>
    )
  }

  if (matrix.rows.length === 0) {
    return (
      <div className="feature-mat">
        <div className="ci-panel-head">Feature comparison matrix</div>
        <p style={{ padding: 18, color: 'var(--fg-2)' }}>
          Add your idea features and run competitor analysis to populate the matrix.
        </p>
      </div>
    )
  }

  return (
    <div className="feature-mat">
      <div className="ci-panel-head">
        <span>Feature comparison matrix</span>
        <span className="live">live data</span>
      </div>
      <div
        className="fm-grid"
        style={{ gridTemplateColumns: `1.4fr repeat(${colCount}, minmax(72px, 1fr))` }}
      >
        <div className="fm-cell head row-head">Feature</div>
        {matrix.columns.map(col => (
          <div key={col.id} className={`fm-cell head ${col.isYou ? 'you' : ''}`}>
            {col.label}
          </div>
        ))}
        {matrix.rows.map(row => {
          const isDiff = matrix.differentiators.includes(row)
          const isGap = matrix.gaps.includes(row)
          return (
            <Fragment key={row}>
              <div
                className="fm-cell row-head"
                style={{
                  background: isDiff
                    ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                    : isGap
                      ? 'color-mix(in srgb, var(--warn) 8%, transparent)'
                      : undefined,
                }}
              >
                {row}
              </div>
              {matrix.columns.map(col => {
                const has = Boolean(matrix.cells[row]?.[col.id])
                return (
                  <div key={`${row}-${col.id}`} className="fm-cell">
                    {has ? <span className="y" aria-label="yes">✓</span> : <span className="n" aria-label="no">✕</span>}
                  </div>
                )
              })}
            </Fragment>
          )
        })}
      </div>
      <div className="fm-summary">
        <p>
          <DI.Spark /> You have <b>{matrix.differentiators.length}</b> features competitors don&apos;t.
          Competitors have <b>{matrix.gaps.length}</b> features you don&apos;t.
        </p>
      </div>
    </div>
  )
}
