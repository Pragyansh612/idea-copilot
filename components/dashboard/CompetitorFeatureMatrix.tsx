'use client'

import { Fragment, useMemo, useState } from 'react'
import type { FeatureMatrix } from '@/lib/dashboard/competitor-intel'
import * as DI from '@/components/dashboard/Icons'

type Props = {
  matrix: FeatureMatrix
  loading?: boolean
  onImportGaps?: (gaps: string[]) => void
  importingGaps?: boolean
}

const ROWS_PER_PAGE = 8
const COLS_PER_PAGE = 5 // including "You" when present

function shortLabel(label: string, isYou: boolean) {
  if (isYou) return 'You'
  if (label.length <= 12) return label
  return `${label.slice(0, 10)}…`
}

export function CompetitorFeatureMatrix({ matrix, loading, onImportGaps, importingGaps }: Props) {
  const [rowPage, setRowPage] = useState(0)
  const [colPage, setColPage] = useState(0)

  const youCol = matrix.columns.find(c => c.isYou)
  const otherCols = matrix.columns.filter(c => !c.isYou)
  const colPages = Math.max(1, Math.ceil(otherCols.length / Math.max(1, COLS_PER_PAGE - (youCol ? 1 : 0))))
  const visibleOthers = useMemo(() => {
    const size = Math.max(1, COLS_PER_PAGE - (youCol ? 1 : 0))
    const start = Math.min(colPage, colPages - 1) * size
    return otherCols.slice(start, start + size)
  }, [otherCols, colPage, colPages, youCol])

  const visibleCols = useMemo(
    () => (youCol ? [youCol, ...visibleOthers] : visibleOthers),
    [youCol, visibleOthers],
  )

  const rowPages = Math.max(1, Math.ceil(matrix.rows.length / ROWS_PER_PAGE))
  const safeRowPage = Math.min(rowPage, rowPages - 1)
  const visibleRows = matrix.rows.slice(safeRowPage * ROWS_PER_PAGE, safeRowPage * ROWS_PER_PAGE + ROWS_PER_PAGE)
  const colCount = visibleCols.length
  const lastVisibleRowIndex = visibleRows.length - 1

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
        <span className="live">{matrix.rows.length} features · {matrix.columns.length} columns</span>
      </div>
      <div className="fm-toolbar">
        <span className="fm-toolbar-meta">
          Rows {safeRowPage * ROWS_PER_PAGE + 1}–{Math.min((safeRowPage + 1) * ROWS_PER_PAGE, matrix.rows.length)} of {matrix.rows.length}
        </span>
        <div className="fm-pager">
          <button type="button" className="btn-sm ghost" disabled={safeRowPage <= 0} onClick={() => setRowPage(p => Math.max(0, p - 1))}>
            Prev features
          </button>
          <button type="button" className="btn-sm ghost" disabled={safeRowPage >= rowPages - 1} onClick={() => setRowPage(p => Math.min(rowPages - 1, p + 1))}>
            Next features
          </button>
        </div>
        {otherCols.length > COLS_PER_PAGE - (youCol ? 1 : 0) && (
          <div className="fm-pager">
            <button type="button" className="btn-sm ghost" disabled={colPage <= 0} onClick={() => setColPage(p => Math.max(0, p - 1))}>
              Prev competitors
            </button>
            <button type="button" className="btn-sm ghost" disabled={colPage >= colPages - 1} onClick={() => setColPage(p => Math.min(colPages - 1, p + 1))}>
              Next competitors
            </button>
          </div>
        )}
      </div>
      <div className="fm-scroll">
        <div
          className="fm-grid"
          style={{
            gridTemplateColumns: `minmax(140px, 200px) repeat(${colCount}, minmax(56px, 88px))`,
          }}
        >
          <div className="fm-cell head row-head">Feature</div>
          {visibleCols.map((col, i) => (
            <div
              key={col.id}
              className={`fm-cell head ${col.isYou ? 'you' : ''} ${i === colCount - 1 ? 'last-col' : ''}`}
              title={col.label}
            >
              {shortLabel(col.label, Boolean(col.isYou))}
            </div>
          ))}
          {visibleRows.map((row, rowIndex) => {
            const isDiff = matrix.differentiators.includes(row)
            const isGap = matrix.gaps.includes(row)
            const isLastRow = rowIndex === lastVisibleRowIndex
            return (
              <Fragment key={`${row}-${rowIndex}`}>
                <div
                  className={`fm-cell row-head ${isDiff ? 'fm-diff' : isGap ? 'fm-gap' : ''} ${isLastRow ? 'last-row' : ''}`}
                  title={row}
                >
                  <span className="fm-row-label">{row}</span>
                </div>
                {visibleCols.map((col, i) => {
                  const has = Boolean(matrix.cells[row]?.[col.id])
                  return (
                    <div
                      key={`${row}-${rowIndex}-${col.id}`}
                      className={`fm-cell ${i === colCount - 1 ? 'last-col' : ''} ${isLastRow ? 'last-row' : ''}`}
                    >
                      {has ? <span className="y" aria-label="yes">✓</span> : <span className="n" aria-label="no">·</span>}
                    </div>
                  )
                })}
              </Fragment>
            )
          })}
        </div>
      </div>
      <div className="fm-legend">
        <span className="fm-legend-item fm-diff">Your differentiators</span>
        <span className="fm-legend-item fm-gap">Competitor gaps for you</span>
      </div>
      <div className="fm-summary">
        <DI.Spark />
        <div style={{ flex: 1 }}>
          <p>
            You have <b>{matrix.differentiators.length}</b> features competitors don&apos;t.
            Competitors have <b>{matrix.gaps.length}</b> features you don&apos;t.
          </p>
          {matrix.gaps.length > 0 && onImportGaps && (
            <button
              type="button"
              className="btn-sm ghost"
              style={{ marginTop: 10 }}
              disabled={importingGaps}
              onClick={() => onImportGaps(matrix.gaps)}
            >
              <DI.Plus /> {importingGaps ? 'Importing…' : `Import ${matrix.gaps.length} gap${matrix.gaps.length === 1 ? '' : 's'} as features`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
