'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IdeaAPI, type Idea } from '@/lib/api/idea'
import { routes } from '@/lib/routes'
import { normalizeGaps, type GapItem } from '@/lib/dashboard/gaps'
import * as DI from '@/components/dashboard/Icons'

export default function GapsPage() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState('')
  const [gaps, setGaps] = useState<GapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    IdeaAPI.getIdeas({ limit: 50 })
      .then(r => {
        setIdeas(r.ideas)
        if (r.ideas[0]) setSelectedIdeaId(r.ideas[0].id)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load ideas'))
      .finally(() => setLoading(false))
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
              style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)', marginRight: 8 }}
            >
              {ideas.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          )}
          <button className="btn-sm solid" onClick={runAnalysis} disabled={!selectedIdeaId || analyzing}>
            <DI.Spark/> {analyzing ? 'Analyzing…' : 'Generate fresh'}
          </button>
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 16, color: 'var(--warn)' }}>{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--fg-2)' }}>Loading ideas…</p>
      ) : ideas.length === 0 ? (
        <div className="empty">
          <h3>Add an idea first</h3>
          <p>Market gap analysis runs per idea.</p>
          <button className="btn-sm solid" onClick={() => router.push(routes.ideas)}><DI.Bulb/> Go to My Ideas</button>
        </div>
      ) : gaps.length === 0 ? (
        <div className="empty">
          <h3>No gaps loaded yet</h3>
          <p>Select an idea and run analysis to detect market gaps.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gaps.map((g, i) => (
            <div key={i} className="card">
              <div className="eyebrow-mono" style={{ marginBottom: 8 }}>
                #{String(i + 1).padStart(2, '0')}
                {g.confidence_score != null && ` · ${Math.round(g.confidence_score)}% conf`}
              </div>
              <h3 style={{ marginBottom: 8 }}>{g.title || g.opportunity || 'Market opportunity'}</h3>
              <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.55 }}>{g.description || String(g)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
