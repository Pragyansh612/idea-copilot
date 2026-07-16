'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CategoryAPI, IdeaAPI, type Category, type Idea } from '@/lib/api/idea'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { StartupReadinessScore } from '@/components/dashboard/StartupReadinessScore'
import { ChatImportModal } from '@/components/dashboard/ChatImportModal'
import { ideaScore, matchesStatusFilter, statusBadge, statusLabel, timeAgo } from '@/lib/dashboard/format'
import { emptySignals, fetchReadinessMapForIdeas, type ReadinessSignals } from '@/lib/dashboard/readiness'
import { founderBucketFor, type FounderBucket } from '@/lib/dashboard/workspace-intelligence'
import { getCached, peekStale, setCached } from '@/lib/dashboard/query-cache'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const FILTERS = ['All', 'Active', 'Validating', 'Draft', 'Stalled']
const PAGE_SIZE = 8
const IDEAS_CACHE_KEY = 'ideas:list'
const IDEAS_CACHE_TTL_MS = 60_000

const BUCKET_LABELS: Record<FounderBucket, string> = {
  ready: 'Ready to build',
  work: 'Need work',
  attention: 'Need attention',
}

export default function MyIdeasPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading ideas…" />}>
      <MyIdeasContent />
    </Suspense>
  )
}

function MyIdeasContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bucketParam = searchParams.get('bucket') as FounderBucket | null
  const bucket =
    bucketParam === 'ready' || bucketParam === 'work' || bucketParam === 'attention'
      ? bucketParam
      : null
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState('All')
  const [cat, setCat] = useState('all')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [readinessByIdea, setReadinessByIdea] = useState<Map<string, ReadinessSignals>>(new Map())
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [readinessReady, setReadinessReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  type IdeasSnapshot = {
    categories: Category[]
    ideas: Idea[]
    readinessEntries: [string, ReadinessSignals][]
  }

  function applySnapshot(snap: IdeasSnapshot) {
    setCategories(snap.categories)
    setIdeas(snap.ideas)
    setReadinessByIdea(new Map(snap.readinessEntries))
    setReadinessReady(true)
  }

  async function load(opts?: { soft?: boolean }) {
    try {
      if (!opts?.soft) setLoading(true)
      setError(null)
      const [cats, result] = await Promise.all([
        CategoryAPI.getCategories(),
        IdeaAPI.getIdeas({ limit: 100, sort_by: 'updated_at', sort_order: 'desc' }),
      ])
      if (!opts?.soft) {
        setCategories(cats)
        setIdeas(result.ideas)
        setReadinessReady(false)
      }
      const snapshots = await fetchReadinessMapForIdeas(result.ideas, { activeOnly: false })
      const snap: IdeasSnapshot = { categories: cats, ideas: result.ideas, readinessEntries: [...snapshots.entries()] }
      applySnapshot(snap)
      setCached(IDEAS_CACHE_KEY, snap, IDEAS_CACHE_TTL_MS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fresh = getCached<IdeasSnapshot>(IDEAS_CACHE_KEY)
    const stale = fresh ?? peekStale<IdeasSnapshot>(IDEAS_CACHE_KEY)
    if (stale) {
      applySnapshot(stale)
      setLoading(false)
      void load({ soft: true })
    } else {
      void load()
    }
  }, [])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, cat, bucket])

  const categoryOptions = [
    { id: 'all', name: 'All categories' },
    ...categories.map(c => ({ id: c.id, name: c.name })),
  ]

  const list = useMemo(() => {
    return ideas.filter(i => {
      const catMatch = cat === 'all' || i.category_id === cat
      if (!matchesStatusFilter(i, filter) || !catMatch) return false
      if (bucket) {
        if (!readinessReady) return false
        return founderBucketFor(i, readinessByIdea) === bucket
      }
      return true
    })
  }, [ideas, cat, filter, bucket, readinessByIdea, readinessReady])

  const visibleList = useMemo(() => list.slice(0, visibleCount), [list, visibleCount])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">
            My Ideas · {list.length} shown{bucket ? ` · ${BUCKET_LABELS[bucket]}` : ` · ${ideas.length} total`}
          </div>
          <h1>Every spark you&apos;ve <em>filed</em>.</h1>
          <div className="ph-sub">
            {bucket
              ? `Filtered by readiness: ${BUCKET_LABELS[bucket].toLowerCase()}.`
              : 'Each card shows Startup Readiness — your path from idea to validated market.'}
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost" onClick={() => setShowImport(true)}><DI.Chat/> Import from AI chat</button>
          <button className="btn-sm ghost" onClick={() => router.push(routes.copilot)}><DI.Spark/> Ask Copilot</button>
          <button className="btn-sm solid" onClick={() => router.push(routes.newIdea)}><DI.Plus/> New idea</button>
        </div>
      </div>

      {showImport && (
        <ChatImportModal
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); load() }}
        />
      )}

      {error && <PageError message={error} onRetry={load} />}

      {(loading || (bucket && !readinessReady)) && !error && (
        <PageLoading label={bucket ? 'Applying readiness filter…' : 'Loading ideas…'} />
      )}

      {!error && !loading && !(bucket && !readinessReady) && (
      <>
      <div className="ideas-filterbar">
        <div className="seg">
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}><DI.Grid/> Grid</button>
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><DI.List/> List</button>
        </div>
        <div className="chips">
          {(['ready', 'work', 'attention'] as const).map(b => (
            <button
              key={b}
              type="button"
              className={`chip ${bucket === b ? 'on' : ''}`}
              onClick={() => router.push(routes.ideasWithBucket(b))}
            >
              {BUCKET_LABELS[b]}
            </button>
          ))}
          {bucket && (
            <button type="button" className="chip on" onClick={() => router.push(routes.ideas)}>
              Clear bucket filter ×
            </button>
          )}
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
          description={ideas.length === 0 ? 'Capture your first spark, import an AI chat, or brainstorm with Copilot.' : 'Try widening your filter or create a new idea.'}
          action={
            ideas.length === 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
                  <DI.Plus /> New idea
                </button>
                <button type="button" className="btn-sm ghost" onClick={() => setShowImport(true)}>
                  <DI.Chat /> Import from chat
                </button>
                <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.copilot)}>
                  <DI.Spark /> Ask Copilot
                </button>
              </div>
            ) : (
              <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
                <DI.Plus /> New idea
              </button>
            )
          }
        />
      ) : view === 'grid' ? (
        <>
        <div className="ideas-grid">
          {visibleList.map(i => {
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
        {visibleCount < list.length && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button type="button" className="btn-sm ghost" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
              Show {Math.min(PAGE_SIZE, list.length - visibleCount)} more
            </button>
          </div>
        )}
        </>
      ) : (
        <div className="dash-card" style={{ padding: 0 }}>
          <div className="ci-table">
            <div className="ci-row h">
              <span/><span>Idea</span><span>Status</span><span>Readiness</span>
              <span style={{ textAlign: 'right' }}>Score</span>
            </div>
            {visibleList.map(i => {
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
          {visibleCount < list.length && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 14 }}>
              <button type="button" className="btn-sm ghost" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                Show {Math.min(PAGE_SIZE, list.length - visibleCount)} more
              </button>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  )
}
