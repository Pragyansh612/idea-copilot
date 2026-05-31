'use client'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import {
  AIAPI,
  CompetitorAPI,
  FeatureAPI,
  IdeaAPI,
  PhaseAPI,
  type AIGenerateRequest,
  type AISuggestion,
  type Feature,
  type Idea,
  type Phase,
} from '@/lib/api/idea'
import { AttachmentAPI, type Attachment } from '@/lib/api/attachments'
import { ExportAPI } from '@/lib/api/export'
import { CopilotAPI } from '@/lib/api/copilot'
import { MarketGapResults } from '@/components/dashboard/MarketGapResults'
import { Toast } from '@/components/dashboard/Toast'
import { normalizeGaps, type GapItem } from '@/lib/dashboard/gaps'
import { hasGapRun, loadGapsForIdea, saveGapsForIdea } from '@/lib/dashboard/gap-storage'
import { suggestionBody, suggestionItemType } from '@/lib/dashboard/suggestions'
import { formatDate, ideaScore, priorityShort, statusLabel, timeAgo } from '@/lib/dashboard/format'
import { useDashboardChrome } from '@/components/dashboard/DashboardChromeContext'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const VALID_TABS = ['overview', 'roadmap', 'intelligence', 'copilot', 'attachments'] as const
const SUGGESTION_TYPES: AIGenerateRequest['suggestion_type'][] = ['features', 'phases', 'improvements', 'marketing', 'validation']

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
  const [tab, setTab] = useState<'overview' | 'roadmap' | 'intelligence' | 'copilot' | 'attachments'>('overview')
  const [idea, setIdea] = useState<Idea | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [competitors, setCompetitors] = useState<Array<Record<string, unknown>>>([])
  const [gaps, setGaps] = useState<GapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newPhaseDesc, setNewPhaseDesc] = useState('')
  const [featureDraftByPhase, setFeatureDraftByPhase] = useState<Record<string, string>>({})
  const [suggestionType, setSuggestionType] = useState<AIGenerateRequest['suggestion_type']>('features')
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([])
  const [copilotInput, setCopilotInput] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [marketGapDone, setMarketGapDone] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [exportBusy, setExportBusy] = useState<'markdown' | 'pdf' | null>(null)
  const { setIdeaDetailTitle } = useDashboardChrome()

  useEffect(() => {
    return () => setIdeaDetailTitle(null)
  }, [setIdeaDetailTitle])

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setToast('Idea created. Use the readiness checklist below for your next steps.')
      router.replace(routes.idea(ideaId), { scroll: false })
    }
  }, [searchParams, ideaId, router])

  useEffect(() => {
    const t = searchParams.get('tab')
    const mapped =
      t === 'phases' ? 'roadmap' :
      t === 'comp' ? 'intelligence' :
      t === 'ai' ? 'copilot' :
      t === 'features' ? 'overview' :
      t === 'attachments' ? 'attachments' :
      t
    if (mapped && (VALID_TABS as readonly string[]).includes(mapped)) {
      setTab(mapped as typeof tab)
    }
  }, [searchParams])

  const showExportPanel = searchParams.get('action') === 'export'

  useEffect(() => {
    if (searchParams.get('action') === 'export') {
      setTab('overview')
    }
  }, [searchParams])

  useEffect(() => {
    if (!ideaId) return
    setGaps(loadGapsForIdea(ideaId))
    setMarketGapDone(hasGapRun(ideaId))
  }, [ideaId])

  const load = useCallback(async () => {
    if (!ideaId) return
    try {
      setLoading(true)
      setError(null)
      const detail = await IdeaAPI.getIdea(ideaId)
      const [sugs, comp, atts] = await Promise.all([
        AIAPI.getSuggestions(ideaId).catch(() => []),
        CompetitorAPI.getCompetitorResearch(ideaId).catch(() => ({ research: [] })),
        AttachmentAPI.listForIdea(ideaId).catch(() => []),
      ])
      setIdea(detail.idea)
      setIdeaDetailTitle(detail.idea.title)
      setFeatures(detail.features || [])
      setPhases(detail.phases || [])
      setSuggestions(sugs)
      setCompetitors(comp.research || comp.competitors || [])
      setAttachments(atts)
      setGaps(loadGapsForIdea(ideaId))
      setMarketGapDone(hasGapRun(ideaId))
      setCopilotMessages([])
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

  async function createPhase() {
    if (!newPhaseName.trim()) return
    try {
      setBusyAction('phase')
      const phase = await PhaseAPI.createPhase(ideaId, {
        name: newPhaseName.trim(),
        description: newPhaseDesc.trim() || undefined,
        order_index: phases.length,
      })
      setPhases(prev => [...prev, phase])
      setNewPhaseName('')
      setNewPhaseDesc('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create phase')
    } finally {
      setBusyAction(null)
    }
  }

  async function addFeatureToPhase(phaseId: string) {
    const title = (featureDraftByPhase[phaseId] || '').trim()
    if (!title) return
    try {
      setBusyAction(`feature:${phaseId}`)
      const feature = await FeatureAPI.createFeatureForPhase(phaseId, { title, priority: 'medium' })
      setFeatures(prev => [...prev, feature])
      setFeatureDraftByPhase(prev => ({ ...prev, [phaseId]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add feature')
    } finally {
      setBusyAction(null)
    }
  }

  async function generateSuggestions() {
    try {
      setBusyAction('suggest')
      await AIAPI.generateSuggestions({ idea_id: ideaId, suggestion_type: suggestionType })
      const fresh = await AIAPI.getSuggestions(ideaId)
      setSuggestions(fresh)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI suggestions')
    } finally {
      setBusyAction(null)
    }
  }

  async function addSuggestionToIdea(s: AISuggestion) {
    try {
      setBusyAction(`apply:${s.id}`)
      const itemType = suggestionItemType(s)
      await AIAPI.createFromSuggestion({ suggestion_id: s.id, item_type: itemType, idea_id: ideaId })
      await load()
      setToast(`Added to your idea as a ${itemType}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add suggestion')
    } finally {
      setBusyAction(null)
    }
  }

  async function discoverCompetitors() {
    try {
      setBusyAction('discover')
      await IdeaAPI.discoverCompetitors(ideaId)
      const comp = await CompetitorAPI.getCompetitorResearch(ideaId).catch(() => ({ research: [] }))
      setCompetitors(comp.research || comp.competitors || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover competitors')
    } finally {
      setBusyAction(null)
    }
  }

  async function runCompetitorAnalysis() {
    try {
      setBusyAction('comp-analysis')
      await IdeaAPI.runCompetitorAnalysis(ideaId)
      const comp = await CompetitorAPI.getCompetitorResearch(ideaId).catch(() => ({ research: [] }))
      setCompetitors(comp.research || comp.competitors || [])
      setToast('Competitor analysis complete.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed competitor analysis')
    } finally {
      setBusyAction(null)
    }
  }

  async function analyzeCompetitor(c: Record<string, unknown>) {
    const url = String(c.competitor_url || c.url || '')
    try {
      setBusyAction(`analyze:${c.id}`)
      if (url) {
        await CompetitorAPI.scrapeCompetitors({ idea_id: ideaId, urls: [url], analyze: true })
      } else {
        await runCompetitorAnalysis()
        return
      }
      const comp = await CompetitorAPI.getCompetitorResearch(ideaId).catch(() => ({ research: [] }))
      setCompetitors(comp.research || comp.competitors || [])
      setToast('Competitor analyzed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze competitor')
    } finally {
      setBusyAction(null)
    }
  }

  async function runMarketGapAnalysis() {
    try {
      setBusyAction('gap')
      const result = await IdeaAPI.marketGapAnalysis(ideaId)
      const normalized = normalizeGaps(result)
      setGaps(normalized)
      saveGapsForIdea(ideaId, normalized)
      setMarketGapDone(true)
      setToast('Market gap analysis complete.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed market gap analysis')
    } finally {
      setBusyAction(null)
    }
  }

  async function uploadAttachment(file: File) {
    try {
      setBusyAction('upload')
      const att = await AttachmentAPI.upload(ideaId, file)
      setAttachments(prev => [att, ...prev])
      setToast('File uploaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusyAction(null)
    }
  }

  async function downloadMarkdownExport() {
    try {
      setExportBusy('markdown')
      const { markdown } = await ExportAPI.exportMarkdown(ideaId)
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${idea?.title || 'idea'}.md`
      a.click()
      URL.revokeObjectURL(url)
      setToast('Markdown export downloaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExportBusy(null)
    }
  }

  async function downloadPdfExport() {
    try {
      setExportBusy('pdf')
      const { pdfBase64 } = await ExportAPI.exportPdf(ideaId)
      const bin = atob(pdfBase64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${idea?.title || 'idea'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setToast('PDF export downloaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed')
    } finally {
      setExportBusy(null)
    }
  }

  async function sendCopilot(message?: string) {
    const text = (message ?? copilotInput).trim()
    if (!text) return
    setCopilotInput('')
    setBusyAction('copilot')
    setCopilotMessages(prev => [...prev, { role: 'user', text }])
    try {
      const res = await CopilotAPI.chat({ query: text, idea_id: ideaId })
      setCopilotMessages(prev => [...prev, { role: 'ai', text: res.response }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copilot request failed')
    } finally {
      setBusyAction(null)
    }
  }

  const featuresByPhase = useMemo(() => {
    const byPhase: Record<string, { total: number; done: number }> = {}
    for (const f of features) {
      if (!f.phase_id) continue
      if (!byPhase[f.phase_id]) byPhase[f.phase_id] = { total: 0, done: 0 }
      byPhase[f.phase_id].total += 1
      if (f.is_completed) byPhase[f.phase_id].done += 1
    }
    return byPhase
  }, [features])

  const marketGapAnalyzed = gaps.length > 0 || marketGapDone

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

  const score = ideaScore(idea)
  const readiness = [
    { label: 'Idea described', done: Boolean(idea.description?.trim()), action: () => setTab('overview') },
    {
      label: 'Features added',
      done: features.length > 0,
      action: () => {
        setTab('overview')
        setSuggestionType('features')
        void generateSuggestions()
      },
    },
    { label: 'Roadmap created', done: phases.length > 0, action: () => setTab('roadmap') },
    {
      label: 'Competitors researched',
      done: competitors.length > 0,
      action: () => {
        setTab('intelligence')
        void discoverCompetitors()
      },
    },
    {
      label: 'Market gap analyzed',
      done: marketGapAnalyzed,
      action: () => {
        setTab('intelligence')
        void runMarketGapAnalysis()
      },
    },
  ]
  const copilotPrompts = [
    `Generate features for ${idea.title}`,
    `Find market gaps for ${idea.title}`,
    `What should I build first in ${idea.title}?`,
  ]

  return (
    <div className="page">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
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
            aria-current={showExportPanel ? 'true' : undefined}
          >
            <DI.Export/> Export
          </button>
          <button
            type="button"
            className="btn-sm ghost"
            title="Attachments for this idea"
            onClick={() => router.push(routes.ideaAttachments(ideaId))}
          >
            <DI.Folder/> Attachments
          </button>
          <button type="button" className="btn-sm solid" onClick={() => router.push(routes.copilotForIdea(ideaId))}>
            <DI.Spark/> Ask Copilot
          </button>
        </div>
      </div>

      {showExportPanel && (
        <div className="idea-export-banner dash-card">
          <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Export idea</div>
          <p style={{ color: 'var(--fg-2)', fontSize: 14, marginBottom: 12 }}>
            Download this idea from your workspace via the export API.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn-sm solid" onClick={() => void downloadMarkdownExport()} disabled={exportBusy !== null}>
              <DI.Export /> {exportBusy === 'markdown' ? 'Exporting…' : 'Markdown'}
            </button>
            <button type="button" className="btn-sm ghost" onClick={() => void downloadPdfExport()} disabled={exportBusy !== null}>
              <DI.Doc /> {exportBusy === 'pdf' ? 'Exporting…' : 'PDF'}
            </button>
            <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.copilotForIdea(ideaId))}>
              <DI.Spark/> Draft with Copilot
            </button>
          </div>
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
              { id: 'overview', label: 'Overview', count: '' },
              { id: 'roadmap', label: 'Roadmap', count: String(phases.length) },
              { id: 'intelligence', label: 'Intelligence', count: String(competitors.length) },
              { id: 'copilot', label: 'Copilot', count: '' },
              { id: 'attachments', label: 'Attachments', count: String(attachments.length) },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`id-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => {
                  setTab(t.id as typeof tab)
                  router.replace(routes.ideaTab(ideaId, t.id), { scroll: false })
                }}
              >
                {t.label} {t.count && <span className="count">{t.count}</span>}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="id-panel">
              <div className="id-panel-head">
                <h3>Overview</h3>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="dash-card" style={{ padding: 12 }}>
                  <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Scores</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
                    {[
                      ['Effort', idea.effort_score ?? '—'],
                      ['Impact', idea.impact_score ?? '—'],
                      ['Interest', idea.interest_score ?? '—'],
                      ['Overall', idea.overall_score ?? score],
                    ].map(([k, v]) => (
                      <div key={String(k)} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px' }}>
                        <div className="eyebrow-mono">{k}</div>
                        <div style={{ marginTop: 4, fontSize: 16, fontWeight: 500 }}>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="dash-card" style={{ padding: 12 }}>
                  <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Startup readiness checklist</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {readiness.map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 16, height: 16, borderRadius: 99, border: `1px solid ${item.done ? 'var(--accent)' : 'var(--line-3)'}`, background: item.done ? 'var(--accent)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.done && <DI.Check style={{ width: 10, height: 10, color: 'white' }} />}
                          </span>
                          {item.label}
                        </span>
                        {!item.done && (
                          <button type="button" className="btn-sm ghost" onClick={item.action}>Fix</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="dash-card" style={{ padding: 12 }}>
                  <div className="eyebrow-mono" style={{ marginBottom: 10 }}>Generate AI Suggestions</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <select className="dash-select" value={suggestionType} onChange={e => setSuggestionType(e.target.value as typeof suggestionType)}>
                      {SUGGESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button type="button" className="btn-sm solid" onClick={generateSuggestions} disabled={busyAction === 'suggest'}>
                      <DI.Sparkles /> {busyAction === 'suggest' ? 'Generating…' : 'Generate'}
                    </button>
                  </div>
                  {suggestions.length === 0 ? (
                    <p style={{ color: 'var(--fg-2)' }}>No suggestions yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {suggestions.map(s => (
                        <div key={s.id} className="sug-card">
                          <span className="s-label"><DI.Sparkles/> {s.suggestion_type}</span>
                          <div className="s-body">{suggestionBody(s)}</div>
                          <div className="s-actions">
                            <button type="button" className="s-act accept" onClick={() => addSuggestionToIdea(s)} disabled={busyAction === `apply:${s.id}`}>
                              {busyAction === `apply:${s.id}` ? 'Adding…' : 'Add to Idea'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="dash-card" style={{ padding: 12 }}>
                  <div className="id-panel-head" style={{ marginBottom: 10, padding: 0, border: 0 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 500 }}>Feature scope</h3>
                  </div>
                  {features.length === 0 ? (
                    <p style={{ color: 'var(--fg-2)' }}>No features yet. Generate suggestions above or add them on the Roadmap tab.</p>
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
              </div>
            </div>
          )}

          {tab === 'roadmap' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Roadmap</h3></div>
              <div className="dash-card" style={{ padding: 12 }}>
                <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Add Phase</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
                    placeholder="Phase name"
                    value={newPhaseName}
                    onChange={e => setNewPhaseName(e.target.value)}
                  />
                  <textarea
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
                    placeholder="Phase description"
                    value={newPhaseDesc}
                    onChange={e => setNewPhaseDesc(e.target.value)}
                    rows={2}
                  />
                  <button type="button" className="btn-sm solid" onClick={createPhase} disabled={busyAction === 'phase'}>
                    <DI.Plus /> {busyAction === 'phase' ? 'Adding…' : 'Add Phase'}
                  </button>
                </div>
              </div>
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
                        <div className="p-meta">
                          <span>
                            <b>{featuresByPhase[p.id]?.done ?? 0}</b>/{featuresByPhase[p.id]?.total ?? 0} features complete
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input
                            style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
                            placeholder="Add feature to this phase"
                            value={featureDraftByPhase[p.id] ?? ''}
                            onChange={e => setFeatureDraftByPhase(prev => ({ ...prev, [p.id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="btn-sm ghost"
                            onClick={() => addFeatureToPhase(p.id)}
                            disabled={busyAction === `feature:${p.id}`}
                          >
                            {busyAction === `feature:${p.id}` ? 'Adding…' : 'Add feature'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'intelligence' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Intelligence</h3></div>
              <div className="dash-card ci-intel-banner" style={{ padding: 14, marginBottom: 12 }}>
                <div className="eyebrow-mono" style={{ marginBottom: 6 }}>Full intelligence workspace</div>
                <p style={{ color: 'var(--fg-2)', fontSize: 14, marginBottom: 12 }}>
                  Compare features side-by-side, view market positioning, and generate strategic insights on the Competitors page.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn-sm solid" onClick={() => router.push(routes.competitorsForIdea(ideaId))}>
                    <DI.Radar /> Open intelligence workspace
                  </button>
                  <button type="button" className="btn-sm ghost" onClick={discoverCompetitors} disabled={busyAction === 'discover'}>
                    <DI.Radar /> {busyAction === 'discover' ? 'Discovering…' : 'Discover competitors'}
                  </button>
                </div>
              </div>
              <div className="dash-card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                  <div className="eyebrow-mono">Competitors</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="btn-sm solid" onClick={discoverCompetitors} disabled={busyAction === 'discover'}>
                      <DI.Radar /> {busyAction === 'discover' ? 'Discovering…' : 'Discover Competitors'}
                    </button>
                    <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.competitorsForIdea(ideaId))}>
                      <DI.Radar /> View Competitors
                    </button>
                    <button type="button" className="btn-sm ghost" onClick={runCompetitorAnalysis} disabled={busyAction === 'comp-analysis'}>
                      <DI.Sparkles /> {busyAction === 'comp-analysis' ? 'Analyzing…' : 'Run Analysis'}
                    </button>
                  </div>
                </div>
                {competitors.length === 0 ? (
                  <p style={{ color: 'var(--fg-2)' }}>No competitor research yet.</p>
                ) : (
                  competitors.map((c, idx) => {
                    const name = String(c.competitor_name || c.name || `Competitor ${idx + 1}`)
                    const meta = String(c.market_position || c.description || '')
                    const conf = Math.round(Number(c.confidence_score) || 50)
                    const cid = String(c.id || idx)
                    return (
                      <div key={cid} className="pricing-row" style={{ gridTemplateColumns: '36px 1fr auto auto auto' }}>
                        <span className="ci-logo">{name[0]}</span>
                        <span><div className="nm">{name}</div><div className="meta">{meta}</div></span>
                        <div style={{ width: 80 }}><div className="ci-bar"><div className="fill" style={{ width: `${conf}%` }}/></div></div>
                        <button
                          type="button"
                          className="btn-sm ghost"
                          onClick={() => void analyzeCompetitor(c)}
                          disabled={Boolean(busyAction)}
                        >
                          {busyAction === `analyze:${c.id}` ? '…' : 'Analyze'}
                        </button>
                        <span className="pr">{conf}</span>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="dash-card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                  <div className="eyebrow-mono">Market gap analysis</div>
                  <button type="button" className="btn-sm solid" onClick={runMarketGapAnalysis} disabled={busyAction === 'gap'}>
                    <DI.Target /> {busyAction === 'gap' ? 'Running…' : 'Run Market Gap Analysis'}
                  </button>
                </div>
                {gaps.length === 0 ? (
                  <p style={{ color: 'var(--fg-2)' }}>No market gap results yet. Run analysis to see opportunity cards.</p>
                ) : (
                  <MarketGapResults gaps={gaps} ideaId={ideaId} />
                )}
              </div>
            </div>
          )}

          {tab === 'copilot' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Copilot</h3></div>
              <div className="cp-suggestions" style={{ padding: 0 }}>
                {copilotPrompts.map(prompt => (
                  <button key={prompt} type="button" className="cp-sugg" onClick={() => setCopilotInput(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="cp-stream" style={{ maxHeight: 360, border: '1px solid var(--line)', borderRadius: 10 }}>
                {copilotMessages.length === 0 ? (
                  <p style={{ color: 'var(--fg-2)' }}>No messages yet. Use a prompt above or ask directly.</p>
                ) : (
                  copilotMessages.map((m, idx) => (
                    <div key={idx} className={`cp-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                      <div className="av" />
                      <div className="cp-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="cp-input-wrap" style={{ padding: 0, borderTop: 0 }}>
                <div className="cp-input">
                  <textarea
                    value={copilotInput}
                    onChange={e => setCopilotInput(e.target.value)}
                    rows={1}
                    placeholder={`Ask about ${idea.title}...`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void sendCopilot()
                      }
                    }}
                  />
                  <button type="button" className="cp-send" onClick={() => void sendCopilot()} disabled={busyAction === 'copilot' || !copilotInput.trim()}>
                    <DI.Send />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'attachments' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Attachments</h3></div>
              <div className="dash-card" style={{ padding: 12 }}>
                <div className="eyebrow-mono" style={{ marginBottom: 10 }}>Upload file</div>
                <input
                  type="file"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) void uploadAttachment(file)
                    e.target.value = ''
                  }}
                  disabled={busyAction === 'upload'}
                />
                <p style={{ color: 'var(--fg-3)', fontSize: 12, marginTop: 8 }}>Images, PDF, Office docs, text — max 20 MB.</p>
              </div>
              {attachments.length === 0 ? (
                <p style={{ color: 'var(--fg-2)' }}>No attachments yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {attachments.map(a => (
                    <div key={a.id} className="dash-card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 14 }}>{a.file_name}</div>
                        {a.file_size != null && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                            {Math.round(a.file_size / 1024)} KB
                          </div>
                        )}
                      </div>
                      {a.signed_url && (
                        <a href={a.signed_url} target="_blank" rel="noreferrer" className="btn-sm ghost">
                          <DI.Export /> Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
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
