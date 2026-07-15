'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthAPI, type AuthUser } from '@/lib/api/auth'
import { IdeaAPI, PhaseAPI, type Idea } from '@/lib/api/idea'
import { FounderSummaryStrip } from '@/components/dashboard/FounderSummaryStrip'
import { GettingStartedCard } from '@/components/dashboard/GettingStartedCard'
import { InsightFeed } from '@/components/dashboard/InsightFeed'
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar'
import { PageError, PageLoading } from '@/components/dashboard/PageState'
import { StartupReadinessScore } from '@/components/dashboard/StartupReadinessScore'
import { WorkspaceHealthCard } from '@/components/dashboard/WorkspaceHealthCard'
import { displayName, statusBadge, timeAgo } from '@/lib/dashboard/format'
import { phaseProgress } from '@/lib/dashboard/phase-progress'
import {
  buildDashboardNextAction,
  dashboardNextActionRoute,
  emptySignals,
  fetchReadinessMapForIdeas,
  pickLowestReadinessIdea,
  type ReadinessSignals,
} from '@/lib/dashboard/readiness'
import {
  computeFounderSummary,
  computeWorkspaceHealth,
  generateWorkspaceInsights,
} from '@/lib/dashboard/workspace-intelligence'
import { getCached, peekStale, setCached } from '@/lib/dashboard/query-cache'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const DASH_CACHE_KEY = 'dashboard:home'
const DASH_TTL_MS = 90_000

type DashSnapshot = {
  authUser: AuthUser | null
  ideas: Idea[]
  readinessEntries: [string, ReadinessSignals][]
  recentProgress: Record<string, ReturnType<typeof phaseProgress>>
  nextAction: ReturnType<typeof buildDashboardNextAction>
  nextActionIdeaId: string | null
  nextActionPercent: number
  competitorNudge: { id: string; title: string } | null
  profileName?: string
  recentAchievements: Array<{ title: string; icon?: string }>
  xp: number
  level: number
}

export default function DashboardHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [readinessByIdea, setReadinessByIdea] = useState<Map<string, ReadinessSignals>>(new Map())
  const [recentProgress, setRecentProgress] = useState<Record<string, ReturnType<typeof phaseProgress>>>({})
  const [nextAction, setNextAction] = useState<ReturnType<typeof buildDashboardNextAction>>(null)
  const [nextActionIdeaId, setNextActionIdeaId] = useState<string | null>(null)
  const [nextActionPercent, setNextActionPercent] = useState(0)
  const [competitorNudge, setCompetitorNudge] = useState<{ id: string; title: string } | null>(null)
  const [profileName, setProfileName] = useState<string | undefined>()
  const [recentAchievements, setRecentAchievements] = useState<Array<{ title: string; icon?: string }>>([])
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const abortRef = useRef<AbortController | null>(null)

  function applySnapshot(snap: DashSnapshot) {
    setAuthUser(snap.authUser)
    setIdeas(snap.ideas)
    setReadinessByIdea(new Map(snap.readinessEntries))
    setRecentProgress(snap.recentProgress)
    setNextAction(snap.nextAction)
    setNextActionIdeaId(snap.nextActionIdeaId)
    setNextActionPercent(snap.nextActionPercent)
    setCompetitorNudge(snap.competitorNudge)
    setProfileName(snap.profileName)
    setRecentAchievements(snap.recentAchievements)
    setXp(snap.xp)
    setLevel(snap.level)
  }

  async function load(opts?: { soft?: boolean }) {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    const soft = Boolean(opts?.soft)
    try {
      if (soft) setRefreshing(true)
      else setLoading(true)
      setError(null)
      const [me, stats, ideasData, profile, achievements] = await Promise.all([
        AuthAPI.getMe(),
        import('@/lib/api/user').then(m => m.UserAPI.getStats()).catch(() => null),
        IdeaAPI.getIdeas({ limit: 50, sort_by: 'updated_at', sort_order: 'desc' }),
        import('@/lib/api/user').then(m => m.UserAPI.getProfile()).catch(() => null),
        import('@/lib/api/achievement').then(m => m.AchievementAPI.getUserAchievements()).catch(() => []),
      ])
      if (ac.signal.aborted) return

      const snapshots = await fetchReadinessMapForIdeas(ideasData.ideas, { activeOnly: true })
      if (ac.signal.aborted) return

      const recent = ideasData.ideas.slice(0, 3)
      const progressPairs = await Promise.all(
        recent.map(async idea => {
          const phases = await PhaseAPI.getPhases(idea.id).catch(() => [])
          return [idea.id, phaseProgress(phases)] as const
        }),
      )
      if (ac.signal.aborted) return

      const recentProgressMap = Object.fromEntries(progressPairs)
      const lowest = pickLowestReadinessIdea(ideasData.ideas, snapshots)
      const activeIdeas = ideasData.ideas.filter(i => !i.is_archived && i.status !== 'archived')
      const withoutResearch = activeIdeas.find(idea => {
        const s = snapshots.get(idea.id)
        return s && !s.hasCompetitors
      })

      const snap: DashSnapshot = {
        authUser: me,
        ideas: ideasData.ideas,
        readinessEntries: [...snapshots.entries()],
        recentProgress: recentProgressMap,
        nextAction: lowest ? buildDashboardNextAction(lowest.idea, lowest.signals) : null,
        nextActionIdeaId: lowest?.idea.id ?? null,
        nextActionPercent: lowest?.percent ?? 100,
        competitorNudge: withoutResearch ? { id: withoutResearch.id, title: withoutResearch.title } : null,
        profileName: profile?.display_name,
        recentAchievements: [...achievements]
          .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
          .slice(0, 3)
          .map(a => ({ title: a.title, icon: a.icon })),
        xp: stats?.total_xp ?? 0,
        level: stats?.current_level ?? 1,
      }
      applySnapshot(snap)
      setCached(DASH_CACHE_KEY, snap, DASH_TTL_MS)
    } catch (err) {
      if (ac.signal.aborted) return
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      if (!ac.signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    const fresh = getCached<DashSnapshot>(DASH_CACHE_KEY)
    const stale = fresh ?? peekStale<DashSnapshot>(DASH_CACHE_KEY)
    if (stale) {
      applySnapshot(stale)
      setLoading(false)
      void load({ soft: true })
    } else {
      void load()
    }
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const name = displayName(authUser?.email, profileName)
  const recentIdeas = useMemo(() => ideas.slice(0, 3), [ideas])

  const founderSummary = useMemo(
    () => computeFounderSummary(ideas, readinessByIdea),
    [ideas, readinessByIdea],
  )
  const workspaceHealth = useMemo(
    () => computeWorkspaceHealth(ideas, readinessByIdea),
    [ideas, readinessByIdea],
  )
  const insights = useMemo(
    () => generateWorkspaceInsights(ideas, readinessByIdea),
    [ideas, readinessByIdea],
  )

  const showCompetitorNudge =
    competitorNudge &&
    !(nextAction?.step === 'competitors' && nextActionIdeaId === competitorNudge.id) &&
    !insights.some(i => i.id === `missing-research-${competitorNudge.id}`)

  return (
    <div className="page">
      {!loading && !error && ideas.length > 0 && (
        <FounderSummaryStrip summary={founderSummary} />
      )}

      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Dashboard</div>
          <h1>Welcome back, <em>{name}</em>.</h1>
          <div className="ph-sub">
            Your workspace surfaces what needs attention — not just what exists.
            {refreshing && <span className="dash-refreshing"> · updating…</span>}
          </div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}><DI.Plus/> New idea</button>
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.ideas)}>View all ideas</button>
        </div>
      </div>

      {error && <PageError message={error} onRetry={() => void load()} />}

      {loading && !error && <PageLoading label="Loading your workspace…" />}

      {!loading && !error && (
      <>
      {ideas.length === 0 ? (
        <GettingStartedCard />
      ) : (
        <>
          <QuickActionsBar />
          <WorkspaceHealthCard health={workspaceHealth} />
        </>
      )}

      {ideas.length > 0 && (
      <div className="dash-card next-action-hero">
        <div className="eyebrow-mono">Recommended next step · {nextActionPercent}% ready</div>
        {nextAction ? (
          <>
            <h2>
              <em>{nextAction.actionLabel}</em> for {nextAction.ideaTitle}
            </h2>
            <p>{nextAction.detail}</p>
            <div className="next-action-hero-actions">
              <button
                type="button"
                className="btn-sm solid"
                onClick={() => {
                  if (!nextActionIdeaId) return
                  router.push(dashboardNextActionRoute(nextActionIdeaId, nextAction.step))
                }}
              >
                {nextAction.actionLabel}
              </button>
              <button
                type="button"
                className="btn-sm ghost"
                onClick={() => {
                  if (nextActionIdeaId) router.push(routes.idea(nextActionIdeaId))
                }}
              >
                Open idea
              </button>
              <div className="next-action-hero-score">
                <StartupReadinessScore
                  signals={readinessByIdea.get(nextActionIdeaId ?? '') ?? emptySignals()}
                  size="sm"
                />
              </div>
            </div>
          </>
        ) : ideas.length === 0 ? (
          <>
            <h2>Start your <em>first idea</em></h2>
            <p>Capture a spark and we&apos;ll guide you through features, roadmap, and market validation.</p>
            <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
              <DI.Plus /> New idea
            </button>
          </>
        ) : (
          <>
            <h2>All ideas are <em>launch-ready</em></h2>
            <p>Every active idea scored 100% Startup Readiness. Keep building or add a new idea.</p>
            <button type="button" className="btn-sm solid" onClick={() => router.push(routes.ideas)}>
              View ideas
            </button>
          </>
        )}
      </div>
      )}

      {ideas.length > 0 && <InsightFeed insights={insights} />}

      {ideas.length > 0 && showCompetitorNudge && competitorNudge && (
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
              <button type="button" className="btn-sm solid" onClick={() => router.push(routes.intelligenceDiscover(competitorNudge.id))}>
                <DI.Radar /> Discover competitors
              </button>
              <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.intelligenceForIdea(competitorNudge.id))}>
                Open intelligence
              </button>
            </div>
          </div>
        </div>
      )}

      {ideas.length > 0 && (
      <div className="section-block">
        <div className="section-block-head">
          <h2>Recent <em>ideas</em></h2>
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.ideas)}>View all</button>
        </div>
        <div className="ideas-grid">
          {recentIdeas.map(i => {
            const badge = statusBadge(i.status)
            const progress = recentProgress[i.id] ?? { total: 0, completed: 0, percent: 0 }
            const signals = readinessByIdea.get(i.id) ?? emptySignals()
            return (
              <div key={i.id} className="idea idea--clickable" onClick={() => router.push(routes.idea(i.id))} role="link" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') router.push(routes.idea(i.id)) }}>
                <div className="i-row1">
                  <span className={`i-tag ${badge.kind}`}>{badge.text}</span>
                </div>
                <h3>{i.title}</h3>
                <p className="i-desc">{i.description || 'No description yet.'}</p>
                <div className="i-prog"><div className="bar" style={{ width: `${progress.percent}%` }}/></div>
                <div className="i-foot">
                  <span>{progress.percent}% roadmap</span>
                  <span className="sep"/>
                  <span>{timeAgo(i.updated_at)}</span>
                </div>
                <div className="idea-card-readiness" onClick={e => e.stopPropagation()}>
                  <StartupReadinessScore signals={signals} size="sm" />
                  <button type="button" className="btn-sm solid" onClick={() => router.push(routes.idea(i.id))}>Continue</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      )}

      {ideas.length > 0 && (
      <div className="dash-card founder-progress">
        <div className="founder-progress-main">
          <div className="founder-progress-ring">L{level}</div>
          <div>
            <p className="founder-progress-title">Founder Progress</p>
            <p className="founder-progress-meta">{xp} XP · level {level}</p>
          </div>
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.achievements)}>
            <DI.Bolt /> All achievements
          </button>
        </div>
        <div className="founder-progress-achievements">
          {recentAchievements.length > 0 ? (
            recentAchievements.map(a => (
              <span key={a.title} className="founder-achievement-pill">
                {a.icon ? `${a.icon} ` : ''}{a.title}
              </span>
            ))
          ) : (
            <>
              <span className="founder-achievement-pill">{founderSummary.ready} ready to build</span>
              <span className="founder-achievement-pill">{founderSummary.work} need work</span>
              <span className="founder-achievement-pill">{founderSummary.attention} need attention</span>
            </>
          )}
        </div>
      </div>
      )}
      </>
      )}
    </div>
  )
}

