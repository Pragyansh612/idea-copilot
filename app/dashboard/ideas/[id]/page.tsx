'use client'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { PageError, PageLoading } from '@/components/dashboard/PageState'
import {
  AIAPI,
  CompetitorAPI,
  FeatureAPI,
  IdeaAPI,
  type AISuggestion,
  type Feature,
  type Idea,
  type Phase,
} from '@/lib/api/idea'
import { formatDate, ideaScore, priorityShort, statusLabel, timeAgo } from '@/lib/dashboard/format'
import { useDashboardChrome } from '@/components/dashboard/DashboardChromeContext'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const VALID_TABS = ['features', 'phases', 'ai', 'comp'] as const

export default function IdeaDetailPage() {
  return (
    <Suspense fallback={<div className="page"><PageLoading label="Loading idea…" /></div>}>
      <IdeaDetailContent />
    </Suspense>
  )
}

function IdeaDetailContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const ideaId = params.id as string
  const [tab, setTab] = useState('features')
  const [idea, setIdea] = useState<Idea | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [competitors, setCompetitors] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setIdeaDetailTitle } = useDashboardChrome()

  useEffect(() => {
    return () => setIdeaDetailTitle(null)
  }, [setIdeaDetailTitle])

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && (VALID_TABS as readonly string[]).includes(t)) {
      setTab(t)
    }
  }, [searchParams])

  const showExportBanner = searchParams.get('action') === 'export'

  const load = useCallback(async () => {
    if (!ideaId) return
    try {
      setLoading(true)
      setError(null)
      const detail = await IdeaAPI.getIdea(ideaId)
      const [sugs, comp] = await Promise.all([
        AIAPI.getSuggestions(ideaId).catch(() => []),
        CompetitorAPI.getCompetitorResearch(ideaId).catch(() => ({ research: [] })),
      ])
      setIdea(detail.idea)
      setIdeaDetailTitle(detail.idea.title)
      setFeatures(detail.features || [])
      setPhases(detail.phases || [])
      setSuggestions(sugs)
      setCompetitors(comp.research || comp.competitors || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load idea')
      setIdea(null)
    } finally {
      setLoading(false)
    }
  }, [ideaId, setIdeaDetailTitle])

  useEffect(() => {
    load()
  }, [load])

  async function toggleFeature(feature: Feature) {
    try {
      const updated = await FeatureAPI.updateFeature(feature.id, { is_completed: !feature.is_completed })
      setFeatures(prev => prev.map(f => (f.id === feature.id ? updated : f)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature')
    }
  }

  if (loading) {
    return <div className="page"><PageLoading label="Loading idea…" /></div>
  }

  if (error || !idea) {
    return (
      <div className="page">
        <PageError message={error || 'Idea not found'} onRetry={load} />
        <button type="button" className="btn-sm ghost" style={{ marginTop: 12 }} onClick={() => router.push(routes.ideas)}>
          Back to ideas
        </button>
      </div>
    )
  }

  const completed = features.filter(f => f.is_completed).length
  const score = ideaScore(idea)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Idea · {statusLabel(idea.status)}</div>
          <h1><em>{idea.title}</em></h1>
          <div className="ph-sub">{idea.description || 'No description yet.'}</div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.ideas)}>
            <DI.CaretRight style={{ transform: 'rotate(180deg)' }}/> Back
          </button>
          <button
            type="button"
            className="btn-sm ghost"
            onClick={() => router.push(routes.ideaExport(ideaId))}
            aria-current={showExportBanner ? 'true' : undefined}
          >
            <DI.Export/> Export
          </button>
          <button type="button" className="btn-sm solid" onClick={() => router.push(routes.copilotForIdea(ideaId))}>
            <DI.Spark/> Ask Copilot
          </button>
        </div>
      </div>

      {showExportBanner && (
        <div className="idea-export-banner dash-card">
          <span>Export this idea as PDF, Markdown, or a bundle — full export UI ships in a later update. Use Copilot to draft content now.</span>
          <button type="button" className="btn-sm solid" onClick={() => router.push(routes.copilotForIdea(ideaId))}>
            <DI.Spark/> Draft with Copilot
          </button>
        </div>
      )}

      <div className="idea-detail">
        <div className="id-left">
          <div className="id-hero">
            <span className="id-tag">{statusLabel(idea.status)} · {idea.priority} priority</span>
            <h2>{idea.title}</h2>
            <p>{idea.description}</p>
            <div className="id-scorebar">
              <div className="label"><span>Score</span><span>{score} / 100</span></div>
              <div className="bar"><div className="fill" style={{ width: `${score}%` }}/></div>
            </div>
            <div className="id-scorebar">
              <div className="label"><span>Progress</span><span>{idea.progress_percentage ?? 0}%</span></div>
              <div className="bar"><div className="fill" style={{ width: `${idea.progress_percentage ?? 0}%` }}/></div>
            </div>
          </div>

          <div className="card">
            <div className="id-meta">
              <div className="row"><span className="key">Status</span><span className="val pill accent">{statusLabel(idea.status)}</span></div>
              <div className="row"><span className="key">Priority</span><span className="val">{idea.priority}</span></div>
              <div className="row"><span className="key">Created</span><span className="val">{formatDate(idea.created_at)}</span></div>
              <div className="row"><span className="key">Updated</span><span className="val">{timeAgo(idea.updated_at)}</span></div>
            </div>
          </div>

          {(idea.tags?.length ?? 0) > 0 && (
            <div className="card">
              <div className="eyebrow-mono" style={{ marginBottom: 12 }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {idea.tags.map(t => (
                  <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 9px', borderRadius: 999, background: 'color-mix(in srgb, var(--fg) 4%, transparent)', border: '1px solid var(--line-2)', color: 'var(--fg-2)' }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="id-center">
          <div className="id-tabs">
            {[
              { id: 'features', label: 'Features', count: `${completed}/${features.length}` },
              { id: 'phases', label: 'Phases', count: String(phases.length) },
              { id: 'ai', label: 'AI suggestions', count: String(suggestions.length) },
              { id: 'comp', label: 'Competitors', count: String(competitors.length) },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`id-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => {
                  setTab(t.id)
                  router.replace(routes.ideaTab(ideaId, t.id), { scroll: false })
                }}
              >
                {t.label} {t.count && <span className="count">{t.count}</span>}
              </button>
            ))}
          </div>

          {tab === 'features' && (
            <div className="id-panel">
              <div className="id-panel-head">
                <h3>Feature scope</h3>
              </div>
              {features.length === 0 ? (
                <p style={{ color: 'var(--fg-2)' }}>No features yet.</p>
              ) : (
                <div className="feat-list">
                  {features.map(f => (
                    <div key={f.id} className={`feat-item ${f.is_completed ? 'done' : ''}`} onClick={() => toggleFeature(f)}>
                      <span className="ck">{f.is_completed && <DI.Check/>}</span>
                      <span className={`prio ${f.priority}`}>{priorityShort(f.priority)}</span>
                      <span className="label">{f.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'phases' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Roadmap · phased</h3></div>
              {phases.length === 0 ? (
                <p style={{ color: 'var(--fg-2)' }}>No phases yet.</p>
              ) : (
                <div className="phases">
                  {phases.map((p, i) => (
                    <div key={p.id} className={`phase ${p.is_completed ? 'done' : i === 0 ? 'active' : 'next'}`}>
                      <span className="p-dot">{p.is_completed ? <DI.Check/> : String(i + 1).padStart(2, '0')}</span>
                      <div className="p-body">
                        <div className="p-row"><span>{p.name}</span></div>
                        <div className="p-desc">{p.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'ai' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Copilot suggestions</h3></div>
              {suggestions.length === 0 ? (
                <p style={{ color: 'var(--fg-2)' }}>No AI suggestions yet. Ask Copilot to generate some.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {suggestions.map(s => (
                    <div key={s.id} className="sug-card">
                      <span className="s-label"><DI.Sparkles/> {s.suggestion_type}</span>
                      <div className="s-body">{s.suggestion_text || s.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'comp' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Competitors · {competitors.length} mapped</h3></div>
              {competitors.length === 0 ? (
                <p style={{ color: 'var(--fg-2)' }}>No competitor research yet. Run a scan from Competitor Intelligence.</p>
              ) : (
                competitors.map((c, idx) => {
                  const name = String(c.competitor_name || c.name || `Competitor ${idx + 1}`)
                  const meta = String(c.market_position || c.description || '')
                  const conf = Math.round(Number(c.confidence_score) || 50)
                  return (
                    <div key={String(c.id || idx)} className="pricing-row">
                      <span className="ci-logo">{name[0]}</span>
                      <span><div className="nm">{name}</div><div className="meta">{meta}</div></span>
                      <div style={{ width: 80 }}><div className="ci-bar"><div className="fill" style={{ width: `${conf}%` }}/></div></div>
                      <span className="pr">{conf}</span>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div className="id-right">
          <div className="id-right-card">
            <div className="r-head"><DI.Spark/> Live from API</div>
            <p style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.55 }}>
              Features, phases, AI suggestions, and competitors load from your workspace API.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
