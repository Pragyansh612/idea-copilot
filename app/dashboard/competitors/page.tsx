'use client'
import { useEffect, useState } from 'react'
import { CompetitorAPI, IdeaAPI, type Idea } from '@/lib/api/idea'
import { useRouter } from 'next/navigation'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

export default function CompetitorsPage() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('')
  const [competitors, setCompetitors] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    IdeaAPI.getIdeas({ limit: 50, sort_by: 'updated_at', sort_order: 'desc' })
      .then(r => {
        setIdeas(r.ideas)
        if (r.ideas[0]) setSelectedIdeaId(r.ideas[0].id)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load ideas'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedIdeaId) return
    setLoading(true)
    CompetitorAPI.getCompetitorResearch(selectedIdeaId)
      .then(data => setCompetitors(data.research || []))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load competitors'))
      .finally(() => setLoading(false))
  }, [selectedIdeaId])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Competitor intelligence · live</div>
          <h1>The market, <em>mapped</em>.</h1>
          <div className="ph-sub">Competitor research loaded from your backend for each idea.</div>
        </div>
        <div className="page-head-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ideas.length === 0 && (
            <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}><DI.Plus/> Add an idea</button>
          )}
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.copilot)}><DI.Spark/> Research via Copilot</button>
        </div>
        {ideas.length > 0 && (
          <select
            value={selectedIdeaId}
            onChange={e => setSelectedIdeaId(e.target.value)}
            style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
          >
            {ideas.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>
        )}
      </div>

      {error && <div className="card" style={{ marginBottom: 16, color: 'var(--warn)' }}>{error}</div>}

      <div className="ci-grid">
        <div className="ci-panel">
          <div className="ci-panel-head">
            <span>Competitor table · {competitors.length} found</span>
            <span className="live">live data</span>
          </div>
          {loading ? (
            <p style={{ padding: 16, color: 'var(--fg-2)' }}>Loading…</p>
          ) : competitors.length === 0 ? (
            <p style={{ padding: 16, color: 'var(--fg-2)' }}>No competitors for this idea yet. Scrape URLs from the API or add manually in the backend.</p>
          ) : (
            <div className="ci-table">
              <div className="ci-row h">
                <span/><span>Name</span><span>Position</span><span style={{ textAlign: 'right' }}>Confidence</span>
              </div>
              {competitors.map((c, idx) => {
                const name = String(c.competitor_name || c.name || `Competitor ${idx + 1}`)
                const pos = String(c.market_position || c.description || '—')
                const score = Math.round(Number(c.confidence_score) || 0)
                return (
                  <div key={String(c.id || idx)} className="ci-row">
                    <span className="ci-logo">{name[0]}</span>
                    <span className="ci-name">{name}</span>
                    <span className="ci-mark">{pos}</span>
                    <span className="ci-score">{score || '—'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
