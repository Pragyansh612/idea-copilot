'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { CompetitorAPI, IdeaAPI, type Idea } from '@/lib/api/idea'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

function CompetitorsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState('')
  const [competitors, setCompetitors] = useState<Array<Record<string, unknown>>>([])
  const [ideasLoading, setIdeasLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadIdeas = useCallback(async () => {
    try {
      setIdeasLoading(true)
      setError(null)
      const r = await IdeaAPI.getIdeas({ limit: 50, sort_by: 'updated_at', sort_order: 'desc' })
      setIdeas(r.ideas)
      const preselect = searchParams.get('idea')
      if (preselect && r.ideas.some(i => i.id === preselect)) {
        setSelectedIdeaId(preselect)
      } else if (r.ideas[0]) {
        setSelectedIdeaId(r.ideas[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas')
    } finally {
      setIdeasLoading(false)
    }
  }, [searchParams])

  const loadCompetitors = useCallback(async () => {
    if (!selectedIdeaId) return
    try {
      setDataLoading(true)
      setError(null)
      const data = await CompetitorAPI.getCompetitorResearch(selectedIdeaId)
      setCompetitors(data.research || data.competitors || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load competitors')
      setCompetitors([])
    } finally {
      setDataLoading(false)
    }
  }, [selectedIdeaId])

  useEffect(() => {
    loadIdeas()
  }, [loadIdeas])

  useEffect(() => {
    if (selectedIdeaId) loadCompetitors()
  }, [selectedIdeaId, loadCompetitors])

  const loading = ideasLoading || (selectedIdeaId && dataLoading)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Competitors · live</div>
          <h1>The market, <em>mapped</em>.</h1>
          <div className="ph-sub">Competitor research loaded from your backend for each idea.</div>
        </div>
        <div className="page-head-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {ideas.length === 0 && !ideasLoading && (
            <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
              <DI.Plus /> Add an idea
            </button>
          )}
          {ideas.length > 0 && (
            <select
              value={selectedIdeaId}
              onChange={e => setSelectedIdeaId(e.target.value)}
              className="dash-select"
              aria-label="Select idea"
            >
              {ideas.map(i => (
                <option key={i.id} value={i.id}>{i.title}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <PageError message={error} onRetry={() => { loadIdeas(); loadCompetitors() }} />}

      {!error && ideasLoading && <PageLoading label="Loading ideas…" />}
      {!error && !ideasLoading && ideas.length === 0 && (
        <PageEmpty
          icon={<DI.Radar />}
          title="No ideas yet"
          description="Create an idea, then discover competitors for it."
          action={
            <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
              <DI.Plus /> New idea
            </button>
          }
        />
      )}

      {!error && !ideasLoading && ideas.length > 0 && (
        <div className="ci-grid">
          <div className="ci-panel dash-card" style={{ padding: 0 }}>
            <div className="ci-panel-head">
              <span>Competitor table · {competitors.length} found</span>
              <span className="live">live data</span>
            </div>
            {loading ? (
              <PageLoading label="Loading competitors…" />
            ) : competitors.length === 0 ? (
              <PageEmpty
                icon={<DI.Radar />}
                title="No competitors yet"
                description="Run discovery from the idea Intelligence tab or add competitors via the API."
                action={
                  selectedIdeaId ? (
                    <button
                      type="button"
                      className="btn-sm solid"
                      onClick={() => router.push(routes.ideaTab(selectedIdeaId, 'comp'))}
                    >
                      Open idea intelligence
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="ci-table">
                <div className="ci-row h">
                  <span /><span>Name</span><span>Position</span><span style={{ textAlign: 'right' }}>Confidence</span>
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
      )}
    </div>
  )
}

export default function CompetitorsPage() {
  return (
    <Suspense fallback={<div className="page"><PageLoading label="Loading…" /></div>}>
      <CompetitorsContent />
    </Suspense>
  )
}
