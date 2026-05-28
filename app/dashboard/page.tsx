'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthAPI, type AuthUser } from '@/lib/api/auth'
import { IdeaAPI, PhaseAPI, type Idea } from '@/lib/api/idea'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { displayName, statusBadge, timeAgo } from '@/lib/dashboard/format'
import { phaseProgress } from '@/lib/dashboard/phase-progress'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

type NextAction = {
  label: string
  detail: string
  cta: string
  run: () => void
}

function getGapRunMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('ic-gap-runs') || '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

function saveGapRun(id: string): void {
  if (typeof window === 'undefined') return
  const map = getGapRunMap()
  map[id] = true
  localStorage.setItem('ic-gap-runs', JSON.stringify(map))
}

export default function DashboardHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [recentProgress, setRecentProgress] = useState<Record<string, ReturnType<typeof phaseProgress>>>({})
  const [nextAction, setNextAction] = useState<NextAction | null>(null)
  const [competitorNudge, setCompetitorNudge] = useState<{ id: string; title: string } | null>(null)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [me, stats, ideasData] = await Promise.all([
        AuthAPI.getMe(),
        import('@/lib/api/user').then(m => m.UserAPI.getStats()).catch(() => null),
        IdeaAPI.getIdeas({ limit: 20, sort_by: 'updated_at', sort_order: 'desc' }),
      ])
      setAuthUser(me)
      setIdeas(ideasData.ideas)
      setXp(stats?.total_xp ?? 0)
      setLevel(stats?.current_level ?? 1)

      const recent = ideasData.ideas.slice(0, 3)
      const progressPairs = await Promise.all(
        recent.map(async idea => {
          const phases = await PhaseAPI.getPhases(idea.id).catch(() => [])
          return [idea.id, phaseProgress(phases)] as const
        }),
      )
      setRecentProgress(Object.fromEntries(progressPairs))

      const activeIdeas = ideasData.ideas.filter(i => !i.is_archived && i.status !== 'archived')
      const nudgeChecks = await Promise.all(
        activeIdeas.slice(0, 12).map(async idea => {
          const comp = await import('@/lib/api/idea').then(m =>
            m.CompetitorAPI.getCompetitorResearch(idea.id).catch(() => ({ research: [] })),
          )
          const count = ((comp.research || comp.competitors || []) as unknown[]).length
          return { idea, count }
        }),
      )
      const withoutResearch = nudgeChecks.find(x => x.count === 0)
      setCompetitorNudge(withoutResearch ? { id: withoutResearch.idea.id, title: withoutResearch.idea.title } : null)

      const topIdea = ideasData.ideas[0]
      if (!topIdea) {
        setNextAction(null)
      } else {
        const [detail, comp] = await Promise.all([
          IdeaAPI.getIdea(topIdea.id),
          import('@/lib/api/idea').then(m => m.CompetitorAPI.getCompetitorResearch(topIdea.id)).catch(() => ({ research: [] })),
        ])
        const gapRun = getGapRunMap()[topIdea.id]
        const competitors = (comp.research || comp.competitors || []) as unknown[]
        if ((detail.features?.length ?? 0) === 0) {
          setNextAction({
            label: 'Generate features',
            detail: `${topIdea.title} has no features yet.`,
            cta: 'Generate now',
            run: () => router.push(routes.ideaTab(topIdea.id, 'overview')),
          })
        } else if ((detail.phases?.length ?? 0) === 0) {
          setNextAction({
            label: 'Build roadmap',
            detail: `${topIdea.title} has no phases yet.`,
            cta: 'Create phases',
            run: () => router.push(routes.ideaTab(topIdea.id, 'roadmap')),
          })
        } else if (competitors.length === 0) {
          setNextAction({
            label: 'Run competitor research',
            detail: `${topIdea.title} has no competitor research yet.`,
            cta: 'Open competitors',
            run: () => router.push(routes.competitorsForIdea(topIdea.id)),
          })
        } else if (!gapRun) {
          setNextAction({
            label: 'Analyze market gap',
            detail: `${topIdea.title} has no recent market gap analysis.`,
            cta: 'Run analysis',
            run: async () => {
              await IdeaAPI.marketGapAnalysis(topIdea.id).catch(() => undefined)
              saveGapRun(topIdea.id)
              router.push(routes.gaps)
            },
          })
        } else {
          setNextAction({
            label: 'Continue building',
            detail: `${topIdea.title} is ready for the next execution step.`,
            cta: 'Open idea',
            run: () => router.push(routes.idea(topIdea.id)),
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const name = displayName(authUser?.email, undefined)
  const recentIdeas = useMemo(() => ideas.slice(0, 3), [ideas])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Dashboard</div>
          <h1>Welcome back, <em>{name}</em>.</h1>
          <div className="ph-sub">Focused workspace for what to do next, not vanity metrics.</div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}><DI.Plus/> New idea</button>
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.ideas)}>View all ideas</button>
        </div>
      </div>

      {error && <PageError message={error} onRetry={load} />}

      {loading && !error && <PageLoading label="Loading your workspace…" />}

      {!loading && !error && (
      <>
      {competitorNudge && (
        <div className="dash-card competitor-nudge" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Competitor intelligence</div>
              <h3 style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 4 }}>
                You haven&apos;t researched competitors for <em>{competitorNudge.title}</em> yet.
              </h3>
              <p style={{ color: 'var(--fg-2)', fontSize: 14 }}>Discover who you&apos;re up against and compare features in one workspace.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn-sm solid" onClick={() => router.push(routes.competitorsForIdea(competitorNudge.id))}>
                <DI.Radar /> Start now
              </button>
              <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.ideaTab(competitorNudge.id, 'intelligence'))}>
                Open intelligence tab
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Recommended next step</div>
        {nextAction ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 4 }}>{nextAction.label}</h3>
              <p style={{ color: 'var(--fg-2)', fontSize: 14 }}>{nextAction.detail}</p>
            </div>
            <button type="button" className="btn-sm solid" onClick={nextAction.run}>{nextAction.cta}</button>
          </div>
        ) : (
          <PageEmpty
            icon={<DI.Bulb />}
            title="Capture your first idea"
            description="Create an idea and we'll suggest the best next action here."
            action={<button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}><DI.Plus /> New idea</button>}
          />
        )}
      </div>

      <div className="section-block">
        <div className="section-block-head">
          <h2>Recent <em>ideas</em></h2>
        </div>
        {recentIdeas.length === 0 ? (
          <PageEmpty
            icon={<DI.Bulb />}
            title="No ideas yet"
            description="Create your first idea to begin the guided founder flow."
            action={
              <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
                <DI.Plus /> New idea
              </button>
            }
          />
        ) : (
          <div className="ideas-grid">
            {recentIdeas.map(i => {
              const badge = statusBadge(i.status)
              const progress = recentProgress[i.id] ?? { total: 0, completed: 0, percent: 0 }
              return (
                <div key={i.id} className="idea">
                  <div className="i-row1">
                    <span className={`i-tag ${badge.kind}`}>{badge.text}</span>
                    <span className="i-score">phases · <b>{progress.completed}/{progress.total}</b></span>
                  </div>
                  <h3>{i.title}</h3>
                  <p className="i-desc">{i.description || 'No description yet.'}</p>
                  <div className="i-prog"><div className="bar" style={{ width: `${progress.percent}%` }}/></div>
                  <div className="i-foot">
                    <span>{progress.percent}% roadmap progress</span>
                    <span className="sep"/>
                    <span>{timeAgo(i.updated_at)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="button" className="btn-sm solid" onClick={() => router.push(routes.idea(i.id))}>Continue</button>
                    <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.ideaTab(i.id, 'overview'))}>Overview</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="dash-card founder-progress">
        <div className="founder-progress-main">
          <div className="founder-progress-ring">L{level}</div>
          <div>
            <p className="founder-progress-title">Founder Progress</p>
            <p className="founder-progress-meta">{xp} XP · level {level}</p>
          </div>
        </div>
        <div className="founder-progress-achievements">
          <span className="founder-achievement-pill">{ideas.length} ideas tracked</span>
          <span className="founder-achievement-pill">{recentIdeas.filter(i => i.status === 'in_progress').length} active ideas</span>
          <span className="founder-achievement-pill">{recentIdeas.length} recently updated</span>
        </div>
      </div>
      </>
      )}
    </div>
  )
}
