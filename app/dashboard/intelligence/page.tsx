'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CompetitorFeatureMatrix } from '@/components/dashboard/CompetitorFeatureMatrix'
import { MarketGapResults } from '@/components/dashboard/MarketGapResults'
import { MarketPositionMap } from '@/components/dashboard/MarketPositionMap'
import { StrategicInsightsCard } from '@/components/dashboard/StrategicInsightsCard'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { Toast } from '@/components/dashboard/Toast'
import { captureError } from '@/lib/monitoring'
import * as DI from '@/components/dashboard/Icons'
import {
  CompetitorAPI,
  FeatureAPI,
  IdeaAPI,
  type Feature,
  type Idea,
} from '@/lib/api/idea'
import {
  buildFeatureMatrix,
  buildPositionMap,
  competitorApiId,
  competitorDescription,
  competitorDisplayName,
  competitorId,
  competitorScrapeQuality,
  competitorWebsite,
  computeWorkspaceStats,
  dedupeCompetitorsByUrl,
  normalizeStrategicAnalysis,
  type CompetitorFeature,
  type CompetitorRow,
  type StrategicAnalysis,
  type WorkspaceCompetitorStats,
} from '@/lib/dashboard/competitor-intel'
import { normalizeGapResult, type MarketGapResult } from '@/lib/dashboard/gaps'
import { loadGapResultForIdea, saveGapsForIdea } from '@/lib/dashboard/gap-storage'
import {
  getDiscoverJob,
  startDiscoverJob,
  subscribeDiscoverJob,
  type DiscoverJobState,
} from '@/lib/dashboard/discover-job'
import { routes } from '@/lib/routes'

const FLOW_STEPS = [
  { id: 'discover', num: 1, label: 'Discover competitors' },
  { id: 'analyze', num: 2, label: 'Analyze' },
  { id: 'matrix', num: 3, label: 'Feature matrix' },
  { id: 'position', num: 4, label: 'Market position map' },
  { id: 'gap-analysis', num: 5, label: 'Run gap analysis' },
  { id: 'opportunities', num: 6, label: 'Opportunity cards' },
  { id: 'strategic', num: 7, label: 'Strategic insights' },
] as const

function IntelligenceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState('')
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([])
  const [yourFeatures, setYourFeatures] = useState<Feature[]>([])
  const [gapResult, setGapResult] = useState<MarketGapResult>({ items: [] })
  const [competitorsByIdea, setCompetitorsByIdea] = useState<Record<string, CompetitorRow[]>>({})
  const [featuresByCompetitor, setFeaturesByCompetitor] = useState<Record<string, CompetitorFeature[]>>({})
  const [featureCountByCompetitor, setFeatureCountByCompetitor] = useState<Record<string, number>>({})
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceCompetitorStats>({
    tracked: 0,
    analyzed: 0,
    featuresExtracted: 0,
    marketGapsFound: 0,
  })
  const [expandedFeatures, setExpandedFeatures] = useState<string | null>(null)
  const [strategicAnalysis, setStrategicAnalysis] = useState<StrategicAnalysis | null>(null)
  const [ideasLoading, setIdeasLoading] = useState(true)
  const [ideaDataLoading, setIdeaDataLoading] = useState(false)
  const [matrixLoading, setMatrixLoading] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [discoverJob, setDiscoverJob] = useState<DiscoverJobState | null>(null)
  const [gapAnalyzing, setGapAnalyzing] = useState(false)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [competitorPage, setCompetitorPage] = useState(0)
  const discoverOnce = useRef<string | null>(null)
  const gapScrollOnce = useRef<string | null>(null)
  const intelAbort = useRef<AbortController | null>(null)

  const syncIdeaInUrl = useCallback((ideaId: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams()
    params.set('idea', ideaId)
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, v)
    }
    router.replace(`/dashboard/intelligence?${params.toString()}`, { scroll: false })
  }, [router])

  const loadWorkspaceAggregates = useCallback(async (ideaList: Idea[]) => {
    const byIdea: Record<string, CompetitorRow[]> = {}
    const featCounts: Record<string, number> = {}
    await Promise.all(
      ideaList.map(async idea => {
        try {
          const data = await CompetitorAPI.getCompetitorResearch(idea.id)
          const rows = dedupeCompetitorsByUrl((data.research || data.competitors || []) as CompetitorRow[])
          byIdea[idea.id] = rows
          await Promise.all(
            rows.map(async c => {
              const apiId = competitorApiId(c)
              if (!apiId) return
              try {
                const fr = await CompetitorAPI.getCompetitorFeatures(apiId)
                featCounts[apiId] = ((fr.features || []) as CompetitorFeature[]).length
              } catch {
                featCounts[apiId] = 0
              }
            }),
          )
        } catch {
          byIdea[idea.id] = []
        }
      }),
    )
    setCompetitorsByIdea(byIdea)
    setFeatureCountByCompetitor(featCounts)
    setWorkspaceStats(computeWorkspaceStats(byIdea, featCounts))
  }, [])

  const loadIdeas = useCallback(async () => {
    try {
      setIdeasLoading(true)
      setPageError(null)
      const r = await IdeaAPI.getIdeas({ limit: 50, sort_by: 'updated_at', sort_order: 'desc' })
      setIdeas(r.ideas)
      const preselect = searchParams.get('idea')
      if (preselect && r.ideas.some(i => i.id === preselect)) {
        setSelectedIdeaId(preselect)
      } else if (r.ideas[0]) {
        setSelectedIdeaId(prev => prev || r.ideas[0].id)
      }
      void loadWorkspaceAggregates(r.ideas.slice(0, 20))
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to load ideas')
    } finally {
      setIdeasLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only initial idea query param; URL sync must not re-fetch
  }, [loadWorkspaceAggregates])

  const loadIdeaIntel = useCallback(async (ideaId: string) => {
    if (!ideaId) return
    intelAbort.current?.abort()
    const ac = new AbortController()
    intelAbort.current = ac
    try {
      setIdeaDataLoading(true)
      setMatrixLoading(true)
      const [detail, compData] = await Promise.all([
        IdeaAPI.getIdea(ideaId),
        CompetitorAPI.getCompetitorResearch(ideaId),
      ])
      if (ac.signal.aborted) return
      const rows = dedupeCompetitorsByUrl(
        (compData.research || compData.competitors || []) as CompetitorRow[],
      )
      setYourFeatures(detail.features || [])
      setCompetitors(rows)
      setCompetitorPage(0)
      setGapResult(loadGapResultForIdea(ideaId))

      const featMap: Record<string, CompetitorFeature[]> = {}
      await Promise.all(
        rows.map(async (c, idx) => {
          const apiId = competitorApiId(c)
          const key = competitorId(c, idx)
          if (!apiId) {
            featMap[key] = []
            return
          }
          try {
            const fr = await CompetitorAPI.getCompetitorFeatures(apiId)
            if (!ac.signal.aborted) featMap[key] = (fr.features || []) as CompetitorFeature[]
          } catch {
            if (!ac.signal.aborted) featMap[key] = []
          }
        }),
      )
      if (ac.signal.aborted) return
      setFeaturesByCompetitor(featMap)
      const counts: Record<string, number> = {}
      for (const [cid, feats] of Object.entries(featMap)) {
        counts[cid] = feats.length
      }
      setFeatureCountByCompetitor(prevCounts => {
        const merged = { ...prevCounts, ...counts }
        setCompetitorsByIdea(prev => {
          const next = { ...prev, [ideaId]: rows }
          setWorkspaceStats(computeWorkspaceStats(next, merged))
          return next
        })
        return merged
      })
    } catch (err) {
      if (ac.signal.aborted) return
      setActionError(err instanceof Error ? err.message : 'Failed to load intelligence data')
      setCompetitors([])
      setYourFeatures([])
      setFeaturesByCompetitor({})
      setGapResult({ items: [] })
    } finally {
      if (!ac.signal.aborted) {
        setIdeaDataLoading(false)
        setMatrixLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      intelAbort.current?.abort()
    }
  }, [])

  useEffect(() => {
    loadIdeas()
  }, [loadIdeas])

  // Apply idea from URL when searchParams change without reloading the whole list
  useEffect(() => {
    const preselect = searchParams.get('idea')
    if (preselect && ideas.some(i => i.id === preselect) && preselect !== selectedIdeaId) {
      setSelectedIdeaId(preselect)
    }
  }, [searchParams, ideas, selectedIdeaId])

  useEffect(() => {
    if (selectedIdeaId) loadIdeaIntel(selectedIdeaId)
  }, [selectedIdeaId, loadIdeaIntel])

  useEffect(() => {
    if (!selectedIdeaId) {
      setDiscoverJob(null)
      return
    }
    return subscribeDiscoverJob(selectedIdeaId, setDiscoverJob)
  }, [selectedIdeaId])

  const discovering = discoverJob?.status === 'running' || busyAction === 'discover'

  const discoverCompetitors = useCallback(async () => {
    if (!selectedIdeaId) return
    if (discoverJob?.status === 'running') return
    const ideaId = selectedIdeaId
    try {
      setBusyAction('discover')
      setActionError(null)
      await startDiscoverJob(ideaId, async () => {
        const result = await IdeaAPI.discoverCompetitors(ideaId)
        await loadIdeaIntel(ideaId)
        await loadWorkspaceAggregates(ideas.slice(0, 20))
        return result
      })
      const done = getDiscoverJob(ideaId)
      if (done.resultSummary) setToast(done.resultSummary)
      else if (done.error) setActionError(done.error)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Competitor discovery failed')
      captureError(err, { ideaId, flow: 'discover-competitors' })
    } finally {
      setBusyAction(null)
    }
  }, [selectedIdeaId, discoverJob?.status, loadIdeaIntel, loadWorkspaceAggregates, ideas])

  useEffect(() => {
    if (searchParams.get('discover') !== '1' || !selectedIdeaId || ideasLoading) return
    const key = `${selectedIdeaId}:discover`
    if (discoverOnce.current === key) return
    discoverOnce.current = key
    syncIdeaInUrl(selectedIdeaId)
    void discoverCompetitors()
  }, [searchParams, selectedIdeaId, ideasLoading, syncIdeaInUrl, discoverCompetitors])

  useEffect(() => {
    if (searchParams.get('gap') !== '1' || !selectedIdeaId || ideasLoading) return
    const key = `${selectedIdeaId}:gap`
    if (gapScrollOnce.current === key) return
    gapScrollOnce.current = key
    syncIdeaInUrl(selectedIdeaId)
    requestAnimationFrame(() => {
      document.getElementById('intel-gap-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [searchParams, selectedIdeaId, ideasLoading, syncIdeaInUrl])

  const selectedIdea = useMemo(
    () => ideas.find(i => i.id === selectedIdeaId),
    [ideas, selectedIdeaId],
  )

  const matrix = useMemo(
    () => buildFeatureMatrix(yourFeatures, competitors, featuresByCompetitor),
    [yourFeatures, competitors, featuresByCompetitor],
  )

  const positionPoints = useMemo(
    () => buildPositionMap(yourFeatures, competitors, featuresByCompetitor),
    [yourFeatures, competitors, featuresByCompetitor],
  )

  async function analyzeCompetitor(c: CompetitorRow) {
    if (!selectedIdeaId) return
    const apiId = competitorApiId(c)
    try {
      setBusyAction(`analyze-${c.id}`)
      setActionError(null)
      if (apiId) {
        // Update existing row — never scrape-insert (that created duplicate competitors).
        await CompetitorAPI.analyzeCompetitor(apiId)
      } else {
        const url = competitorWebsite(c)
        if (url) {
          await CompetitorAPI.scrapeCompetitors({
            idea_id: selectedIdeaId,
            urls: [url],
            analyze: true,
          })
        } else {
          await IdeaAPI.runCompetitorAnalysis(selectedIdeaId)
        }
      }
      await loadIdeaIntel(selectedIdeaId)
      await loadWorkspaceAggregates(ideas)
      setToast('Competitor analysis complete.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setBusyAction(null)
    }
  }

  async function importGapsAsFeatures(gaps: string[]) {
    if (!selectedIdeaId || gaps.length === 0) return
    try {
      setBusyAction('import-gaps')
      setActionError(null)
      const existing = new Set(yourFeatures.map(f => f.title.trim().toLowerCase()))
      let added = 0
      for (const title of gaps) {
        if (existing.has(title.trim().toLowerCase())) continue
        await FeatureAPI.createFeatureForIdea(selectedIdeaId, {
          title,
          description: 'Imported from competitor gap analysis',
          priority: 'medium',
        })
        existing.add(title.trim().toLowerCase())
        added += 1
      }
      await loadIdeaIntel(selectedIdeaId)
      setToast(added > 0 ? `Imported ${added} feature${added === 1 ? '' : 's'} from competitor gaps.` : 'Those gaps are already in your feature list.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to import gap features')
    } finally {
      setBusyAction(null)
    }
  }

  async function runGapAnalysis() {
    if (!selectedIdeaId) return
    try {
      setGapAnalyzing(true)
      setActionError(null)
      const result = await IdeaAPI.marketGapAnalysis(selectedIdeaId)
      const normalized = normalizeGapResult(result)
      setGapResult(normalized)
      saveGapsForIdea(selectedIdeaId, normalized)
      await loadWorkspaceAggregates(ideas)
      setToast('Market gap analysis complete.')
      requestAnimationFrame(() => {
        document.getElementById('intel-opportunities')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Market gap analysis failed')
      captureError(err, { ideaId: selectedIdeaId, flow: 'market-gap-analysis' })
    } finally {
      setGapAnalyzing(false)
    }
  }

  async function generateStrategicInsights() {
    if (!selectedIdeaId) return
    try {
      setInsightsLoading(true)
      setActionError(null)
      const result = await IdeaAPI.runCompetitorAnalysis(selectedIdeaId)
      setStrategicAnalysis(normalizeStrategicAnalysis(result))
      setToast('Strategic insights generated.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setInsightsLoading(false)
    }
  }

  function selectIdea(id: string) {
    setSelectedIdeaId(id)
    setStrategicAnalysis(null)
    setExpandedFeatures(null)
    setGapResult(loadGapResultForIdea(id))
    syncIdeaInUrl(id)
  }

  const loading = ideasLoading || (selectedIdeaId && ideaDataLoading)

  return (
    <div className="page intel-workspace">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Intelligence · one workspace</div>
          <h1>Research the market, <em>end to end</em>.</h1>
          <div className="ph-sub">
            Discover competitors, compare features, map positioning, find gaps, and generate strategic insights — one flow per idea.
          </div>
        </div>
      </div>

      {pageError && (
        <PageError
          message={pageError}
          onRetry={() => {
            loadIdeas()
            if (selectedIdeaId) loadIdeaIntel(selectedIdeaId)
          }}
        />
      )}

      {actionError && !pageError && (
        <div className="dash-card" style={{ padding: '12px 16px', marginBottom: 12, borderColor: 'var(--bad)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <span style={{ color: 'var(--fg)', fontSize: 13 }}>{actionError}</span>
          <button type="button" className="btn-sm ghost" onClick={() => setActionError(null)}>Dismiss</button>
        </div>
      )}

      {!pageError && ideasLoading && <PageLoading label="Loading intelligence workspace…" />}

      {!pageError && !ideasLoading && (
        <>
          <div className="ci-summary-bar">
            {[
              { label: 'Competitors tracked', value: workspaceStats.tracked },
              { label: 'Competitors analyzed', value: workspaceStats.analyzed },
              { label: 'Features extracted', value: workspaceStats.featuresExtracted },
              { label: 'Market gaps found', value: workspaceStats.marketGapsFound },
            ].map(stat => (
              <div key={stat.label} className="ci-summary-stat dash-card">
                <span className="ci-summary-value">{stat.value}</span>
                <span className="ci-summary-label">{stat.label}</span>
              </div>
            ))}
          </div>

          {ideas.length === 0 ? (
            <PageEmpty
              icon={<DI.Radar />}
              title="No ideas yet"
              description="Create an idea first, then run the full intelligence flow."
              action={
                <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
                  <DI.Plus /> New idea
                </button>
              }
            />
          ) : (
            <>
              <div className="intel-idea-picker dash-card">
                <div>
                  <div className="eyebrow-mono">Research context</div>
                  <p className="intel-idea-picker-desc">
                    Select an idea — every step below updates for that idea.
                  </p>
                </div>
                <select
                  value={selectedIdeaId}
                  onChange={e => selectIdea(e.target.value)}
                  className="dash-select ci-idea-select"
                  aria-label="Select idea for intelligence research"
                >
                  {ideas.map(i => (
                    <option key={i.id} value={i.id}>{i.title}</option>
                  ))}
                </select>
              </div>

              <nav className="intel-flow-nav" aria-label="Intelligence flow steps">
                {FLOW_STEPS.map(step => (
                  <a key={step.id} href={`#intel-${step.id}`} className="intel-flow-nav-item">
                    <span className="intel-flow-nav-num">{step.num}</span>
                    {step.label}
                  </a>
                ))}
              </nav>

              <div className="intel-flow">
                {/* Step 1 & 2: Discover + Analyze */}
                <section id="intel-discover" className="intel-flow-step dash-card">
                  <header className="intel-flow-step-head">
                    <span className="intel-flow-step-num">1</span>
                    <div>
                      <h2>Discover competitors</h2>
                      <p>AI finds who you&apos;re up against for {selectedIdea?.title ?? 'this idea'}.</p>
                    </div>
                    <button
                      type="button"
                      className="btn-sm solid"
                      onClick={() => void discoverCompetitors()}
                      disabled={!selectedIdeaId || discovering}
                    >
                      <DI.Radar /> {discovering ? 'Discovering…' : 'Discover competitors'}
                    </button>
                  </header>
                  {discoverJob && (discoverJob.status === 'running' || discoverJob.logs.length > 0) && (
                    <div className="discover-progress">
                      <div className="discover-progress-head">
                        {discoverJob.status === 'running' && <div className="spin-ring" />}
                        {discoverJob.status === 'running'
                          ? 'Discovery in progress — soft-nav away is OK; a full page reload will stop the request'
                          : discoverJob.status === 'error'
                            ? 'Discovery failed'
                            : discoverJob.resultSummary || 'Discovery finished'}
                      </div>
                      <div className="discover-progress-log" aria-live="polite">
                        {discoverJob.logs.slice(-8).map((line, i) => (
                          <div key={`${line.at}-${i}`} className="log-line">
                            <span className="log-time">
                              {new Date(line.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span>{line.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section id="intel-analyze" className="intel-flow-step dash-card">
                  <header className="intel-flow-step-head">
                    <span className="intel-flow-step-num">2</span>
                    <div>
                      <h2>Analyze</h2>
                      <p>Deep-dive each competitor — extract features and positioning.</p>
                    </div>
                    {competitors.length > 0 && (
                      <a href="#intel-strategic" className="btn-sm ghost">
                        <DI.Sparkles /> Compare strategy in step 7
                      </a>
                    )}
                  </header>

                  <div className="intel-competitor-list">
                    {loading ? (
                      <PageLoading label="Loading competitors…" />
                    ) : competitors.length === 0 ? (
                      <PageEmpty
                        icon={<DI.Radar />}
                        title="No competitors yet"
                        description="Start with Discover competitors above — then analyze each one here."
                        action={
                          <button
                            type="button"
                            className="btn-sm solid"
                            onClick={() => void discoverCompetitors()}
                            disabled={discovering}
                          >
                            <DI.Radar /> Discover competitors
                          </button>
                        }
                      />
                    ) : (
                      (() => {
                        const pageSize = 5
                        const pages = Math.max(1, Math.ceil(competitors.length / pageSize))
                        const page = Math.min(competitorPage, pages - 1)
                        const slice = competitors.slice(page * pageSize, page * pageSize + pageSize)
                        return (
                          <>
                            {slice.map((c, localIdx) => {
                              const idx = page * pageSize + localIdx
                              const cid = competitorId(c, idx)
                              const name = competitorDisplayName(c, idx)
                              const site = competitorWebsite(c)
                              const desc = competitorDescription(c)
                              const feats = featuresByCompetitor[cid] || []
                              const analyzing = busyAction === `analyze-${c.id}`
                              const quality = competitorScrapeQuality(c)
                              return (
                                <div key={cid} className="ci-competitor-card">
                                  <div className="ci-competitor-head">
                                    <span className="ci-logo">{name[0]}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div className="ci-name" title={name}>{name}</div>
                                      {site && (
                                        <a href={site} target="_blank" rel="noreferrer" className="ci-name sub" title={site}>
                                          {site.replace(/^https?:\/\//, '').slice(0, 40)}
                                        </a>
                                      )}
                                    </div>
                                    {quality !== 'ok' && (
                                      <span
                                        className={`i-tag ${quality === 'low_confidence' ? 'warn' : ''}`}
                                        title={
                                          quality === 'blocked'
                                            ? "This site's analysis was limited. Competitor identified but full features unavailable."
                                            : undefined
                                        }
                                      >
                                        {quality === 'thin' ? 'Limited data' : quality === 'blocked' ? 'Site blocked' : 'Low confidence'}
                                      </span>
                                    )}
                                  </div>
                                  {desc && <p className="ci-competitor-desc">{desc}</p>}
                                  <div className="ci-competitor-actions">
                                    <button
                                      type="button"
                                      className="btn-sm solid"
                                      onClick={() => void analyzeCompetitor(c)}
                                      disabled={Boolean(busyAction)}
                                    >
                                      <DI.Sparkles /> {analyzing ? 'Analyzing…' : 'Analyze'}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-sm ghost"
                                      onClick={() => setExpandedFeatures(expandedFeatures === cid ? null : cid)}
                                    >
                                      <DI.List /> Features ({feats.length})
                                    </button>
                                    {competitorApiId(c) && selectedIdeaId && (
                                      <button
                                        type="button"
                                        className="btn-sm ghost"
                                        onClick={() =>
                                          router.push(routes.intelligenceCompetitor(selectedIdeaId, competitorApiId(c)!))
                                        }
                                      >
                                        Open details
                                      </button>
                                    )}
                                  </div>
                                  {expandedFeatures === cid && (
                                    <ul className="ci-feature-list">
                                      {feats.length === 0 ? (
                                        <li style={{ color: 'var(--fg-3)' }}>No extracted features yet. Run Analyze.</li>
                                      ) : (
                                        feats.slice(0, 12).map(f => (
                                          <li key={f.id} title={f.feature_name}>{f.feature_name}</li>
                                        ))
                                      )}
                                      {feats.length > 12 && (
                                        <li style={{ color: 'var(--fg-3)' }}>+{feats.length - 12} more features</li>
                                      )}
                                    </ul>
                                  )}
                                </div>
                              )
                            })}
                            {pages > 1 && (
                              <div className="intel-list-pager">
                                <span className="intel-list-pager-meta">
                                  {page * pageSize + 1}–{Math.min((page + 1) * pageSize, competitors.length)} of {competitors.length}
                                </span>
                                <div className="fm-pager">
                                  <button type="button" className="btn-sm ghost" disabled={page <= 0} onClick={() => setCompetitorPage(p => Math.max(0, p - 1))}>
                                    Previous
                                  </button>
                                  <button type="button" className="btn-sm ghost" disabled={page >= pages - 1} onClick={() => setCompetitorPage(p => Math.min(pages - 1, p + 1))}>
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()
                    )}
                  </div>
                </section>

                {/* Step 3: Feature Matrix */}
                <section id="intel-matrix" className="intel-flow-step">
                  <header className="intel-flow-step-head intel-flow-step-head--inline">
                    <span className="intel-flow-step-num">3</span>
                    <div>
                      <h2>Feature matrix</h2>
                      <p>Compare your features against every competitor side by side.</p>
                    </div>
                  </header>
                  <CompetitorFeatureMatrix
                    matrix={matrix}
                    loading={matrixLoading}
                    importingGaps={busyAction === 'import-gaps'}
                    onImportGaps={gaps => void importGapsAsFeatures(gaps)}
                  />
                </section>

                {/* Step 4: Market Position Map */}
                <section id="intel-position" className="intel-flow-step">
                  <header className="intel-flow-step-head intel-flow-step-head--inline">
                    <span className="intel-flow-step-num">4</span>
                    <div>
                      <h2>Market position map</h2>
                      <p>See where you sit relative to competitors in the landscape.</p>
                    </div>
                  </header>
                  <MarketPositionMap points={positionPoints} />
                </section>

                {/* Step 5: Gap Analysis */}
                <section id="intel-gap-analysis" className="intel-flow-step dash-card">
                  <header className="intel-flow-step-head">
                    <span className="intel-flow-step-num">5</span>
                    <div>
                      <h2>Run gap analysis</h2>
                      <p>AI scans the category for white space and unmet demand.</p>
                    </div>
                    <button
                      type="button"
                      className="btn-sm solid"
                      onClick={() => void runGapAnalysis()}
                      disabled={!selectedIdeaId || gapAnalyzing}
                    >
                      <DI.Target /> {gapAnalyzing ? 'Running analysis…' : 'Run gap analysis'}
                    </button>
                  </header>
                  {gapAnalyzing && <PageLoading label="Running market gap analysis…" />}
                </section>

                {/* Step 6: Opportunity Cards */}
                <section id="intel-opportunities" className="intel-flow-step">
                  <header className="intel-flow-step-head intel-flow-step-head--inline">
                    <span className="intel-flow-step-num">6</span>
                    <div>
                      <h2>Opportunity cards</h2>
                      <p>Actionable gaps ranked by opportunity score.</p>
                    </div>
                  </header>
                  {gapResult.items.length === 0 && !gapAnalyzing ? (
                    <div className="dash-card intel-empty-opportunities">
                      <DI.Target />
                      <p>No opportunities yet. Run gap analysis in step 5 to generate opportunity cards.</p>
                      <button
                        type="button"
                        className="btn-sm solid"
                        onClick={() => void runGapAnalysis()}
                        disabled={!selectedIdeaId || gapAnalyzing}
                      >
                        <DI.Target /> Run gap analysis
                      </button>
                    </div>
                  ) : (
                    selectedIdeaId && (
                      <MarketGapResults
                        gaps={gapResult.items}
                        ideaId={selectedIdeaId}
                        confidence={gapResult.confidence}
                        confidenceReason={gapResult.confidence_reason}
                        nextAction={gapResult.next_action}
                        onDiscoverCompetitors={() => void discoverCompetitors()}
                      />
                    )
                  )}
                </section>

                {/* Step 7: Strategic Insights */}
                <section id="intel-strategic" className="intel-flow-step">
                  <header className="intel-flow-step-head intel-flow-step-head--inline">
                    <span className="intel-flow-step-num">7</span>
                    <div>
                      <h2>Strategic insights</h2>
                      <p>AI briefing on weaknesses, opportunities, and your fastest differentiator — grounded in your tracked competitors.</p>
                    </div>
                  </header>
                  <StrategicInsightsCard
                    analysis={strategicAnalysis}
                    loading={insightsLoading}
                    onGenerate={generateStrategicInsights}
                    onDiscoverCompetitors={() => void discoverCompetitors()}
                  />
                </section>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<div className="page"><PageLoading label="Loading intelligence…" /></div>}>
      <IntelligenceContent />
    </Suspense>
  )
}
