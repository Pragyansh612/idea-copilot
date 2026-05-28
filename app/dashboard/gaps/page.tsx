'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { IdeaAPI, type Idea } from '@/lib/api/idea'
import { routes } from '@/lib/routes'
import { normalizeGaps, type GapItem } from '@/lib/dashboard/gaps'
import { loadGapsForIdea, saveGapsForIdea } from '@/lib/dashboard/gap-storage'
import { MarketGapResults } from '@/components/dashboard/MarketGapResults'
import * as DI from '@/components/dashboard/Icons'

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

  useEffect(() => {
    if (selectedIdeaId) setGaps(loadGapsForIdea(selectedIdeaId))
  }, [selectedIdeaId])

  async function runAnalysis() {
    if (!selectedIdeaId) return
    try {
      setAnalyzing(true)
      setError(null)
      const result = await IdeaAPI.marketGapAnalysis(selectedIdeaId)
      const normalized = normalizeGaps(result)
      setGaps(normalized)
      saveGapsForIdea(selectedIdeaId, normalized)
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
      {!loading && !error && gaps.length > 0 && selectedIdeaId && (
        <MarketGapResults gaps={gaps} ideaId={selectedIdeaId} />
      )}
    </div>
  )
}
