'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CompetitorFeatureMatrix } from '@/components/dashboard/CompetitorFeatureMatrix'
import { MarketPositionMap } from '@/components/dashboard/MarketPositionMap'
import { StrategicInsightsCard } from '@/components/dashboard/StrategicInsightsCard'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import * as DI from '@/components/dashboard/Icons'
import { CopilotAPI } from '@/lib/api/copilot'
import {
  CompetitorAPI,
  IdeaAPI,
  type Feature,
  type Idea,
} from '@/lib/api/idea'
import { Toast } from '@/components/dashboard/Toast'
import {
  buildFeatureMatrix,
  buildPositionMap,
  competitorApiId,
  competitorDescription,
  competitorDisplayName,
  competitorId,
  competitorWebsite,
  computeWorkspaceStats,
  parseStrategicInsights,
  type CompetitorFeature,
  type CompetitorRow,
  type StrategicSection,
  type WorkspaceCompetitorStats,
} from '@/lib/dashboard/competitor-intel'
import { routes } from '@/lib/routes'

function CompetitorsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState('')
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([])
  const [yourFeatures, setYourFeatures] = useState<Feature[]>([])
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
  const [strategicSections, setStrategicSections] = useState<StrategicSection[] | null>(null)
  const [ideasLoading, setIdeasLoading] = useState(true)
  const [ideaDataLoading, setIdeaDataLoading] = useState(false)
  const [matrixLoading, setMatrixLoading] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const discoverOnce = useRef(false)

  const syncIdeaInUrl = useCallback((ideaId: string) => {
    router.replace(routes.competitorsForIdea(ideaId), { scroll: false })
  }, [router])

  const loadWorkspaceAggregates = useCallback(async (ideaList: Idea[]) => {
    const byIdea: Record<string, CompetitorRow[]> = {}
    const featCounts: Record<string, number> = {}
    await Promise.all(
      ideaList.map(async idea => {
        try {
          const data = await CompetitorAPI.getCompetitorResearch(idea.id)
          const rows = (data.research || data.competitors || []) as CompetitorRow[]
          byIdea[idea.id] = rows
          await Promise.all(
            rows.map(async (c, idx) => {
              const apiId = competitorApiId(c)
              if (!apiId) return
              try {
                const fr = await CompetitorAPI.getCompetitorFeatures(apiId)
                const feats = (fr.features || []) as CompetitorFeature[]
                featCounts[apiId] = feats.length
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
      setError(null)
      const r = await IdeaAPI.getIdeas({ limit: 50, sort_by: 'updated_at', sort_order: 'desc' })
      setIdeas(r.ideas)
      const preselect = searchParams.get('idea')
      if (preselect && r.ideas.some(i => i.id === preselect)) {
        setSelectedIdeaId(preselect)
      } else if (r.ideas[0]) {
        setSelectedIdeaId(r.ideas[0].id)
      }
      void loadWorkspaceAggregates(r.ideas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas')
    } finally {
      setIdeasLoading(false)
    }
  }, [loadWorkspaceAggregates, searchParams])

  const loadIdeaIntel = useCallback(async (ideaId: string) => {
    if (!ideaId) return
    try {
      setIdeaDataLoading(true)
      setMatrixLoading(true)
      setError(null)
      const [detail, compData] = await Promise.all([
        IdeaAPI.getIdea(ideaId),
        CompetitorAPI.getCompetitorResearch(ideaId),
      ])
      const rows = (compData.research || compData.competitors || []) as CompetitorRow[]
      setYourFeatures(detail.features || [])
      setCompetitors(rows)

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
            featMap[key] = (fr.features || []) as CompetitorFeature[]
          } catch {
            featMap[key] = []
          }
        }),
      )
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
      setError(err instanceof Error ? err.message : 'Failed to load competitor intelligence')
      setCompetitors([])
      setYourFeatures([])
      setFeaturesByCompetitor({})
    } finally {
      setIdeaDataLoading(false)
      setMatrixLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIdeas()
  }, [loadIdeas])

  useEffect(() => {
    if (selectedIdeaId) loadIdeaIntel(selectedIdeaId)
  }, [selectedIdeaId, loadIdeaIntel])

  async function discoverCompetitors() {
    if (!selectedIdeaId) return
    try {
      setBusyAction('discover')
      setError(null)
      await IdeaAPI.discoverCompetitors(selectedIdeaId)
      await loadIdeaIntel(selectedIdeaId)
      await loadWorkspaceAggregates(ideas)
      setToast('Competitor discovery complete.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Competitor discovery failed')
    } finally {
      setBusyAction(null)
    }
  }

  useEffect(() => {
    if (searchParams.get('discover') !== '1' || !selectedIdeaId || ideasLoading || discoverOnce.current) return
    discoverOnce.current = true
    router.replace(routes.competitorsForIdea(selectedIdeaId), { scroll: false })
    void discoverCompetitors()
  }, [searchParams, selectedIdeaId, ideasLoading, router])

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
    const url = competitorWebsite(c)
    try {
      setBusyAction(`analyze-${c.id}`)
      setError(null)
      if (url) {
        await CompetitorAPI.scrapeCompetitors({
          idea_id: selectedIdeaId,
          urls: [url],
          analyze: true,
        })
      } else {
        await IdeaAPI.runCompetitorAnalysis(selectedIdeaId)
      }
      await loadIdeaIntel(selectedIdeaId)
      await loadWorkspaceAggregates(ideas)
      setToast('Competitor analysis complete.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setBusyAction(null)
    }
  }

  async function generateStrategicInsights() {
    if (!selectedIdea) return
    const names = competitors.map((c, i) => competitorDisplayName(c, i)).join(', ')
    const prompt = `Based on my idea "${selectedIdea.title}" and these competitors: ${names || 'none yet'}, give me:
1. Top 3 competitor weaknesses
2. Top 3 opportunities for my product
3. The single fastest differentiator I can build

Use numbered lists under clear headings.`
    try {
      setInsightsLoading(true)
      setError(null)
      const res = await CopilotAPI.chat({ query: prompt, idea_id: selectedIdea.id })
      setStrategicSections(parseStrategicInsights(res.response))
      setToast('Strategic insights generated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setInsightsLoading(false)
    }
  }

  const loading = ideasLoading || (selectedIdeaId && ideaDataLoading)

  return (
    <div className="page ci-workspace">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Competitor intelligence · workspace</div>
          <h1>The market, <em>mapped</em>.</h1>
          <div className="ph-sub">Discover competitors, compare features, and generate strategic positioning — powered by your live API.</div>
        </div>
      </div>

      {error && <PageError message={error} onRetry={() => { loadIdeas(); if (selectedIdeaId) loadIdeaIntel(selectedIdeaId) }} />}

      {!error && ideasLoading && <PageLoading label="Loading workspace…" />}

      {!error && !ideasLoading && (
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
              description="Create an idea, then discover competitors for it."
              action={
                <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
                  <DI.Plus /> New idea
                </button>
              }
            />
          ) : (
            <>
              <div className="ci-idea-picker dash-card">
                <div>
                  <div className="eyebrow-mono">Research context</div>
                  <p style={{ color: 'var(--fg-2)', fontSize: 14, marginTop: 4 }}>
                    Select an idea to load competitor intelligence, feature matrix, and positioning map.
                  </p>
                </div>
                <select
                  value={selectedIdeaId}
                  onChange={e => {
                    const id = e.target.value
                    setSelectedIdeaId(id)
                    setStrategicSections(null)
                    setExpandedFeatures(null)
                    syncIdeaInUrl(id)
                  }}
                  className="dash-select ci-idea-select"
                  aria-label="Select idea for competitor research"
                >
                  {ideas.map(i => (
                    <option key={i.id} value={i.id}>{i.title}</option>
                  ))}
                </select>
              </div>

              <div className="ci-grid ci-grid-main">
                <div className="ci-side">
                  <div className="ci-panel dash-card" style={{ padding: 0 }}>
                    <div className="ci-panel-head">
                      <span>Competitors · {competitors.length}</span>
                      {selectedIdea && <span className="live">{selectedIdea.title}</span>}
                    </div>
                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {loading ? (
                        <PageLoading label="Loading competitors…" />
                      ) : competitors.length === 0 ? (
                        <PageEmpty
                          icon={<DI.Radar />}
                          title="No competitors yet"
                          description="Discover competitors with AI — your fastest path to a filled matrix."
                        />
                      ) : (
                        competitors.map((c, idx) => {
                          const cid = competitorId(c, idx)
                          const name = competitorDisplayName(c, idx)
                          const site = competitorWebsite(c)
                          const desc = competitorDescription(c)
                          const feats = featuresByCompetitor[cid] || []
                          const analyzing = busyAction === `analyze-${c.id}`
                          return (
                            <div key={cid} className="ci-competitor-card">
                              <div className="ci-competitor-head">
                                <span className="ci-logo">{name[0]}</span>
                                <div>
                                  <div className="ci-name">{name}</div>
                                  {site && (
                                    <a href={site} target="_blank" rel="noreferrer" className="ci-name sub">
                                      {site.replace(/^https?:\/\//, '').slice(0, 40)}
                                    </a>
                                  )}
                                </div>
                              </div>
                              {desc && <p className="ci-competitor-desc">{desc.slice(0, 220)}</p>}
                              <div className="ci-competitor-actions">
                                <button
                                  type="button"
                                  className="btn-sm ghost"
                                  onClick={() => analyzeCompetitor(c)}
                                  disabled={Boolean(busyAction)}
                                >
                                  <DI.Sparkles /> {analyzing ? 'Analyzing…' : 'Analyze'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-sm ghost"
                                  onClick={() => setExpandedFeatures(expandedFeatures === cid ? null : cid)}
                                >
                                  <DI.List /> View features ({feats.length})
                                </button>
                              </div>
                              {expandedFeatures === cid && (
                                <ul className="ci-feature-list">
                                  {feats.length === 0 ? (
                                    <li style={{ color: 'var(--fg-3)' }}>No extracted features yet. Run Analyze.</li>
                                  ) : (
                                    feats.map(f => (
                                      <li key={f.id}>{f.feature_name}</li>
                                    ))
                                  )}
                                </ul>
                              )}
                            </div>
                          )
                        })
                      )}
                      <button
                        type="button"
                        className="btn-sm solid ci-discover-hero"
                        onClick={discoverCompetitors}
                        disabled={!selectedIdeaId || busyAction === 'discover'}
                      >
                        <DI.Radar /> {busyAction === 'discover' ? 'Discovering…' : 'Discover new competitors'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ci-side">
                  <CompetitorFeatureMatrix matrix={matrix} loading={matrixLoading} />
                </div>
              </div>

              <div className="ci-workspace-bottom">
                <MarketPositionMap points={positionPoints} />

                <StrategicInsightsCard
                  sections={strategicSections}
                  loading={insightsLoading}
                  onGenerate={generateStrategicInsights}
                />
              </div>
            </>
          )}
        </>
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
