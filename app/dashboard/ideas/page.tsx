'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryAPI, IdeaAPI, type Category, type Idea } from '@/lib/api/idea'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { StartupReadinessScore } from '@/components/dashboard/StartupReadinessScore'
import { ideaScore, matchesStatusFilter, statusBadge, statusLabel, timeAgo } from '@/lib/dashboard/format'
import { fetchReadinessMapForIdeas, type ReadinessSignals } from '@/lib/dashboard/readiness'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const FILTERS = ['All', 'Active', 'Validating', 'Draft', 'Stalled']

function emptySignals(): ReadinessSignals {
  return {
    hasDescription: false,
    hasFeatures: false,
    hasPhases: false,
    hasCompetitors: false,
    hasMarketGap: false,
  }
}

export default function MyIdeasPage() {
  const router = useRouter()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState('All')
  const [cat, setCat] = useState('all')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [readinessByIdea, setReadinessByIdea] = useState<Map<string, ReadinessSignals>>(new Map())
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [cats, result] = await Promise.all([
        CategoryAPI.getCategories(),
        IdeaAPI.getIdeas({ limit: 100, sort_by: 'updated_at', sort_order: 'desc' }),
      ])
      setCategories(cats)
      setIdeas(result.ideas)
      const snapshots = await fetchReadinessMapForIdeas(result.ideas, { activeOnly: false })
      setReadinessByIdea(snapshots)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const categoryOptions = [
    { id: 'all', name: 'All categories' },
    ...categories.map(c => ({ id: c.id, name: c.name })),
  ]

  const list = ideas.filter(i => {
    const catMatch = cat === 'all' || i.category_id === cat
    return matchesStatusFilter(i, filter) && catMatch
  })

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">My Ideas · {ideas.length} total</div>
          <h1>Every spark you&apos;ve <em>filed</em>.</h1>
          <div className="ph-sub">Each card shows Startup Readiness — your path from idea to validated market.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost" onClick={() => router.push(routes.copilot)}><DI.Spark/> Ask Copilot</button>
          <button className="btn-sm solid" onClick={() => router.push(routes.newIdea)}><DI.Plus/> New idea</button>
        </div>
      </div>

      {error && <PageError message={error} onRetry={load} />}

      {loading && !error && <PageLoading label="Loading ideas…" />}

      {!error && !loading && (
      <>
      <div className="ideas-filterbar">
        <div className="seg">
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}><DI.Grid/> Grid</button>
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><DI.List/> List</button>
        </div>
        <div className="chips">
          {FILTERS.map(f => <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
          <span style={{ width: 1, height: 18, background: 'var(--line-2)', margin: '0 4px' }}/>
          {categoryOptions.map(c => (
            <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>{c.name}</button>
          ))}
        </div>
        <span className="sort"><DI.Down/> sort · recent</span>
      </div>

      {list.length === 0 ? (
        <PageEmpty
          icon={<DI.Bulb />}
          title={ideas.length === 0 ? 'No ideas yet' : 'No ideas match this filter'}
          description={ideas.length === 0 ? 'Capture your first spark or refine one with Copilot.' : 'Try widening your filter or create a new idea.'}
          action={
            <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
              <DI.Plus /> New idea
            </button>
          }
        />
      ) : view === 'grid' ? (
        <div className="ideas-grid">
          {list.map(i => {
            const badge = statusBadge(i.status)
            const score = ideaScore(i)
            const signals = readinessByIdea.get(i.id) ?? emptySignals()
            return (
              <div key={i.id} className="idea" onClick={() => router.push(routes.idea(i.id))}>
                <div className="i-row1">
                  <span className={`i-tag ${badge.kind}`}>{badge.text}</span>
                  <span className="i-score">score · <b>{score}</b></span>
                </div>
                <h3>{i.title}</h3>
                <p className="i-desc">{i.description || 'No description yet.'}</p>
                <div className="i-prog"><div className="bar" style={{ width: `${i.progress_percentage}%` }}/></div>
                <div className="idea-card-readiness" onClick={e => e.stopPropagation()}>
                  <StartupReadinessScore signals={signals} size="sm" />
                  <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.ideaTab(i.id, 'overview'))}>
                    Continue
                  </button>
                </div>
                <div className="i-foot">
                  <div className="tags">{(i.tags || []).slice(0, 3).map(t => <span key={t}>{t}</span>)}</div>
                  <span className="sep"/>
                  <span>{timeAgo(i.updated_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="dash-card" style={{ padding: 0 }}>
          <div className="ci-table">
            <div className="ci-row h">
              <span/><span>Idea</span><span>Status</span><span>Readiness</span>
              <span style={{ textAlign: 'right' }}>Score</span>
            </div>
            {list.map(i => {
              const signals = readinessByIdea.get(i.id) ?? emptySignals()
              return (
                <div key={i.id} className="ci-row" onClick={() => router.push(routes.idea(i.id))}>
                  <span className="ci-logo">{i.title[0]}</span>
                  <span className="ci-name">{i.title}<span className="sub">{(i.tags || []).join(' · ')}</span></span>
                  <span><span className={`i-tag ${statusBadge(i.status).kind}`}>{statusLabel(i.status)}</span></span>
                  <span className="ci-mark">
                    <StartupReadinessScore signals={signals} size="sm" showLabel={false} />
                  </span>
                  <span className="ci-score">{ideaScore(i)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
