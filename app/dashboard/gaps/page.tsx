'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { IdeaAPI, type Idea } from '@/lib/api/idea'
import { routes } from '@/lib/routes'
import { normalizeGaps, type GapItem } from '@/lib/dashboard/gaps'
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

export default function GapsPage() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState('')
  const [gaps, setGaps] = useState<GapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadIdeas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const r = await IdeaAPI.getIdeas({ limit: 50, sort_by: 'updated_at', sort_order: 'desc' })
      setIdeas(r.ideas)
      setSelectedIdeaId(prev => prev || r.ideas[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIdeas()
  }, [])

  async function runAnalysis() {
    if (!selectedIdeaId) return
    try {
      setAnalyzing(true)
      setError(null)
      const result = await IdeaAPI.marketGapAnalysis(selectedIdeaId)
      setGaps(normalizeGaps(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Market gap analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Market gaps · API analysis</div>
          <h1>The <em>white space</em> in your category.</h1>
          <div className="ph-sub">Run market gap analysis on an idea via the backend AI endpoint.</div>
        </div>
        <div className="page-head-actions">
          {ideas.length > 0 && (
            <select
              value={selectedIdeaId}
              onChange={e => setSelectedIdeaId(e.target.value)}
              className="dash-select"
              style={{ marginRight: 8 }}
              aria-label="Select idea"
            >
              {ideas.map(i => (
                <option key={i.id} value={i.id}>{i.title}</option>
              ))}
            </select>
          )}
          <button type="button" className="btn-sm solid" onClick={runAnalysis} disabled={!selectedIdeaId || analyzing}>
            <DI.Spark /> {analyzing ? 'Analyzing…' : 'Run analysis'}
          </button>
        </div>
      </div>

      {error && <PageError message={error} onRetry={loadIdeas} />}

      {loading && !error && <PageLoading label="Loading ideas…" />}
      {!loading && !error && ideas.length === 0 && (
        <PageEmpty
          icon={<DI.Target />}
          title="Add an idea first"
          description="Market gap analysis runs per idea."
          action={
            <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
              <DI.Plus /> New idea
            </button>
          }
        />
      )}
      {!loading && !error && ideas.length > 0 && gaps.length === 0 && !analyzing && (
        <PageEmpty
          icon={<DI.Target />}
          title="No gaps loaded yet"
          description="Select an idea and run analysis to detect market gaps."
          action={
            <button type="button" className="btn-sm solid" onClick={runAnalysis} disabled={!selectedIdeaId}>
              <DI.Spark /> Run analysis
            </button>
          }
        />
      )}
      {!loading && !error && analyzing && <PageLoading label="Running market gap analysis…" />}
      {!loading && !error && gaps.length > 0 && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="dash-card">
            <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Opportunity map</div>
            <svg viewBox="0 0 460 220" style={{ width: '100%', maxWidth: 680, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--bg-2)' }}>
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
            return (
              <div key={i} className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  <div className="eyebrow-mono">
                    #{String(i + 1).padStart(2, '0')}
                    {g.confidence_score != null && ` · ${Math.round(g.confidence_score)}% conf`}
                  </div>
                  <span className={`i-tag ${impact === 'high' ? 'hot' : impact === 'low' ? '' : 'accent'}`}>impact · {impact}</span>
                </div>
                <h3 style={{ marginBottom: 8 }}>{g.title || g.opportunity || 'Market opportunity'}</h3>
                <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.55, marginBottom: 10 }}>
                  {g.description || String(g)}
                </p>
                <button
                  type="button"
                  className="btn-sm ghost"
                  onClick={() => router.push(routes.copilotForIdea(selectedIdeaId))}
                >
                  <DI.Spark /> Discuss with Copilot
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
