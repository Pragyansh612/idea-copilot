'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { Toast } from '@/components/dashboard/Toast'
import * as DI from '@/components/dashboard/Icons'
import {
  CompetitorAPI,
  FeatureAPI,
  IdeaAPI,
  type Feature,
  type Phase,
  type PriorityEnum,
} from '@/lib/api/idea'
import {
  competitorApiId,
  competitorDescription,
  competitorDisplayName,
  competitorScrapeQuality,
  competitorWebsite,
  dedupeCompetitorsByUrl,
  type CompetitorFeature,
  type CompetitorRow,
} from '@/lib/dashboard/competitor-intel'
import { routes } from '@/lib/routes'

function CompetitorDetailContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const competitorId = params.competitorId as string
  const ideaId = searchParams.get('idea') || ''

  const [competitor, setCompetitor] = useState<CompetitorRow | null>(null)
  const [features, setFeatures] = useState<CompetitorFeature[]>([])
  const [ideaFeatures, setIdeaFeatures] = useState<Feature[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [ideaTitle, setIdeaTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')
  const [targetPhaseId, setTargetPhaseId] = useState('')
  const [addPriority, setAddPriority] = useState<PriorityEnum>('medium')

  const load = useCallback(async () => {
    if (!ideaId || !competitorId) {
      setError('Missing idea or competitor.')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const [detail, compData, featRes] = await Promise.all([
        IdeaAPI.getIdea(ideaId),
        CompetitorAPI.getCompetitorResearch(ideaId),
        CompetitorAPI.getCompetitorFeatures(competitorId),
      ])
      const rows = dedupeCompetitorsByUrl(
        (compData.research || compData.competitors || []) as CompetitorRow[],
      )
      const found = rows.find(c => competitorApiId(c) === competitorId) || null
      if (!found) {
        setError('Competitor not found for this idea.')
        setCompetitor(null)
        return
      }
      setCompetitor(found)
      setIdeaTitle(detail.idea.title)
      setIdeaFeatures(detail.features || [])
      setPhases(detail.phases || [])
      setFeatures((featRes.features || []) as CompetitorFeature[])
      if (detail.phases?.[0]) setTargetPhaseId(detail.phases[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load competitor')
    } finally {
      setLoading(false)
    }
  }, [ideaId, competitorId])

  useEffect(() => {
    void load()
  }, [load])

  const existingTitles = useMemo(
    () => new Set(ideaFeatures.map(f => f.title.trim().toLowerCase())),
    [ideaFeatures],
  )

  const selectedFeatures = useMemo(
    () => features.filter(f => selected.has(f.id)),
    [features, selected],
  )

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === features.length) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(features.map(f => f.id)))
  }

  async function analyzeAgain() {
    try {
      setBusy('analyze')
      await CompetitorAPI.analyzeCompetitor(competitorId)
      await load()
      setToastVariant('success')
      setToast('Competitor re-analyzed.')
    } catch (err) {
      setToastVariant('error')
      setToast(err instanceof Error ? err.message : 'Analyze failed')
    } finally {
      setBusy(null)
    }
  }

  async function addSelected(mode: 'scope' | 'phase') {
    if (selectedFeatures.length === 0) {
      setToastVariant('error')
      setToast('Select at least one feature.')
      return
    }
    if (mode === 'phase' && !targetPhaseId) {
      setToastVariant('error')
      setToast('Create a phase on the idea first, or add to Feature scope.')
      return
    }
    try {
      setBusy(mode)
      let added = 0
      let skipped = 0
      for (const f of selectedFeatures) {
        const title = f.feature_name.trim()
        if (!title) continue
        if (existingTitles.has(title.toLowerCase())) {
          skipped += 1
          continue
        }
        const payload = {
          title,
          description: f.description
            ? `From competitor · ${f.description}`
            : `Imported from ${competitorDisplayName(competitor || {}, 0)}`,
          priority: addPriority,
        }
        if (mode === 'phase') {
          await FeatureAPI.createFeatureForPhase(targetPhaseId, payload)
        } else {
          await FeatureAPI.createFeatureForIdea(ideaId, payload)
        }
        existingTitles.add(title.toLowerCase())
        added += 1
      }
      const detail = await IdeaAPI.getIdea(ideaId)
      setIdeaFeatures(detail.features || [])
      setPhases(detail.phases || [])
      setSelected(new Set())
      setToastVariant('success')
      setToast(
        added > 0
          ? `Added ${added} feature${added === 1 ? '' : 's'}${skipped ? ` (${skipped} already in scope)` : ''}.`
          : skipped
            ? 'Those features are already in your scope.'
            : 'Nothing to add.',
      )
    } catch (err) {
      setToastVariant('error')
      setToast(err instanceof Error ? err.message : 'Failed to add features')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <PageLoading label="Loading competitor…" />
      </div>
    )
  }

  if (error || !competitor) {
    return (
      <div className="page">
        <PageError message={error || 'Not found'} onRetry={() => void load()} />
        <button
          type="button"
          className="btn-sm ghost"
          style={{ marginTop: 12 }}
          onClick={() => router.push(ideaId ? routes.intelligenceForIdea(ideaId) : routes.intelligence)}
        >
          Back to Intelligence
        </button>
      </div>
    )
  }

  const name = competitorDisplayName(competitor)
  const site = competitorWebsite(competitor)
  const desc = competitorDescription(competitor)
  const quality = competitorScrapeQuality(competitor)
  const strengths = Array.isArray(competitor.strengths)
    ? (competitor.strengths as unknown[]).map(String).filter(Boolean)
    : []
  const weaknesses = Array.isArray(competitor.weaknesses)
    ? (competitor.weaknesses as unknown[]).map(String).filter(Boolean)
    : []
  const diffs = Array.isArray(competitor.differentiation_opportunities)
    ? (competitor.differentiation_opportunities as unknown[]).map(String).filter(Boolean)
    : []

  return (
    <div className="page">
      {toast && (
        <Toast message={toast} variant={toastVariant} onDismiss={() => setToast(null)} />
      )}
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">
            Intelligence · {ideaTitle || 'Idea'} · Competitor
          </div>
          <h1>
            <em>{name}</em>
          </h1>
          {site && (
            <a
              href={site.startsWith('http') ? site : `https://${site}`}
              target="_blank"
              rel="noreferrer"
              className="ph-sub"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              {site.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
        <div className="page-head-actions">
          <button
            type="button"
            className="btn-sm ghost"
            onClick={() => router.push(routes.intelligenceForIdea(ideaId))}
          >
            <DI.CaretRight style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
          <button
            type="button"
            className="btn-sm solid"
            onClick={() => void analyzeAgain()}
            disabled={busy === 'analyze'}
          >
            <DI.Sparkles /> {busy === 'analyze' ? 'Analyzing…' : 'Re-analyze'}
          </button>
        </div>
      </div>

      <div className="comp-detail-layout">
        <div className="dash-card comp-detail-main">
          <div className="comp-detail-meta">
            {quality !== 'ok' && (
              <span className={`i-tag ${quality === 'low_confidence' ? 'warn' : ''}`}>
                {quality === 'thin' ? 'Limited data' : quality === 'blocked' ? 'Site blocked' : 'Low confidence'}
              </span>
            )}
            {typeof competitor.market_position === 'string' && competitor.market_position.trim() ? (
              <span className="i-tag">{competitor.market_position}</span>
            ) : null}
            {competitor.confidence_score != null && (
              <span className="i-tag">
                Confidence {Math.round(Number(competitor.confidence_score) * 100)}%
              </span>
            )}
          </div>
          {desc && <p className="comp-detail-desc">{desc}</p>}

          {(strengths.length > 0 || weaknesses.length > 0 || diffs.length > 0) && (
            <div className="comp-detail-lists">
              {strengths.length > 0 && (
                <div>
                  <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Strengths</div>
                  <ul className="comp-detail-bullets">
                    {strengths.map(s => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div>
                  <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Weaknesses</div>
                  <ul className="comp-detail-bullets">
                    {weaknesses.map(s => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {diffs.length > 0 && (
                <div>
                  <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Differentiation</div>
                  <ul className="comp-detail-bullets">
                    {diffs.map(s => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="comp-detail-features-head">
            <div>
              <div className="eyebrow-mono">Extracted features</div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-3)' }}>
                Select features to copy into your idea’s Feature scope or a roadmap phase.
              </p>
            </div>
            {features.length > 0 && (
              <button type="button" className="btn-sm ghost" onClick={toggleAll}>
                {selected.size === features.length ? 'Clear selection' : 'Select all'}
              </button>
            )}
          </div>

          {features.length === 0 ? (
            <PageEmpty
              icon={<DI.List />}
              title="No features yet"
              description="Run Analyze to extract features from this competitor’s site."
              action={
                <button type="button" className="btn-sm solid" onClick={() => void analyzeAgain()} disabled={busy === 'analyze'}>
                  <DI.Sparkles /> Analyze
                </button>
              }
            />
          ) : (
            <ul className="comp-feature-select-list">
              {features.map(f => {
                const already = existingTitles.has(f.feature_name.trim().toLowerCase())
                return (
                  <li key={f.id} className={already ? 'already' : ''}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selected.has(f.id)}
                        onChange={() => toggle(f.id)}
                        disabled={already}
                      />
                      <span>
                        <span className="comp-feat-name">{f.feature_name}</span>
                        {f.description && (
                          <span className="comp-feat-desc">{f.description}</span>
                        )}
                        {already && <span className="comp-feat-badge">Already in scope</span>}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <aside className="dash-card comp-detail-aside">
          <div className="eyebrow-mono" style={{ marginBottom: 10 }}>Add to your idea</div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>
            {selected.size} selected · {ideaFeatures.length} features on idea
          </p>
          <label className="comp-aside-label">
            Priority for new features
            <select
              className="dash-select"
              value={addPriority}
              onChange={e => setAddPriority(e.target.value as PriorityEnum)}
            >
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </label>
          <button
            type="button"
            className="btn-sm solid"
            style={{ width: '100%', marginTop: 10 }}
            disabled={busy !== null || selected.size === 0}
            onClick={() => void addSelected('scope')}
          >
            <DI.Plus /> {busy === 'scope' ? 'Adding…' : 'Add to Feature scope'}
          </button>

          <div className="eyebrow-mono" style={{ margin: '18px 0 8px' }}>Or add to a phase</div>
          {phases.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-3)' }}>
              No phases yet.{' '}
              <button
                type="button"
                className="btn-sm ghost"
                onClick={() => router.push(routes.ideaTab(ideaId, 'roadmap'))}
              >
                Open roadmap
              </button>
            </p>
          ) : (
            <>
              <select
                className="dash-select"
                value={targetPhaseId}
                onChange={e => setTargetPhaseId(e.target.value)}
                style={{ width: '100%' }}
              >
                {phases.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-sm ghost"
                style={{ width: '100%', marginTop: 10 }}
                disabled={busy !== null || selected.size === 0}
                onClick={() => void addSelected('phase')}
              >
                <DI.Plus /> {busy === 'phase' ? 'Adding…' : 'Add to phase'}
              </button>
            </>
          )}

          <button
            type="button"
            className="btn-sm ghost"
            style={{ width: '100%', marginTop: 18 }}
            onClick={() => router.push(routes.idea(ideaId))}
          >
            View idea overview
          </button>
        </aside>
      </div>
    </div>
  )
}

export default function CompetitorDetailPage() {
  return (
    <Suspense fallback={<div className="page"><PageLoading label="Loading competitor…" /></div>}>
      <CompetitorDetailContent />
    </Suspense>
  )
}
