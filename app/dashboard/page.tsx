'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IdeaAPI, type Idea } from '@/lib/api/idea'
import { NotificationAPI, type Notification } from '@/lib/api/notification'
import { UserAPI, type UserProfile, type UserStats } from '@/lib/api/user'
import { displayName, ideaScore, statusBadge, timeAgo } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

function Spark({ data, className }: { data: number[]; className?: string }) {
  const w = 72, h = 26
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const area = `0,${h} ${points} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

export default function DashboardHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [prof, userStats, ideasData, notifs] = await Promise.all([
          UserAPI.getProfile(),
          UserAPI.getStats(),
          IdeaAPI.getIdeas({ limit: 6, sort_by: 'updated_at', sort_order: 'desc' }),
          NotificationAPI.getNotifications(false),
        ])
        if (cancelled) return
        setProfile(prof)
        setStats(userStats)
        setRecentIdeas(ideasData.ideas)
        setNotifications(notifs.notifications.slice(0, 4))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const now = new Date()
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()]
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]
  const name = displayName(profile?.email, profile?.display_name)

  const statCards = stats ? [
    { label: 'Total ideas', icon: <DI.Bulb/>, value: String(stats.ideas_created ?? 0), delta: `${stats.ideas_completed ?? 0} completed`, spark: [2, 4, 6, 8, 10, 12, stats.ideas_created ?? 0] },
    { label: 'Current level', icon: <DI.Trend/>, value: String(stats.current_level ?? 1), delta: `${stats.total_xp ?? 0} XP`, spark: [1, 1, 2, 2, 3, stats.current_level ?? 1, stats.current_level ?? 1] },
    { label: 'Current streak', icon: <DI.Target/>, value: `${stats.current_streak ?? 0}d`, delta: `best ${stats.longest_streak ?? 0}d`, spark: [0, 1, 2, 3, stats.current_streak ?? 0, stats.current_streak ?? 0, stats.current_streak ?? 0] },
    { label: 'AI applied', icon: <DI.Sparkles/>, value: String(stats.ai_suggestions_applied ?? 0), delta: 'suggestions used', spark: [0, 1, 2, 4, 6, 8, stats.ai_suggestions_applied ?? 0] },
  ] : []

  return (
    <div className="page">
      <div className="hello">
        <div className="hello-grid"/>
        <div className="hello-inner">
          <div>
            <div className="hello-now">
              <span className="pulse"/>
              {dow}, {mon} {now.getDate()} · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <h1>Welcome back, <em>{name}</em>.</h1>
            <div className="h-sub">
              {loading ? 'Syncing your workspace…' : (
                <>
                  <b>{stats?.ideas_created ?? 0} ideas</b> in your lab.
                  {notifications.length > 0 && (
                    <> <b>{notifications.length}</b> recent notifications from Copilot.</>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="hello-actions">
            <button className="btn-sm solid" onClick={() => router.push(routes.newIdea)}><DI.Plus/> New idea</button>
            <button className="btn-sm ghost" onClick={() => router.push(routes.copilot)}><DI.Spark/> Ask Copilot</button>
            <button className="btn-sm ghost" onClick={() => router.push(routes.competitors)}><DI.Radar/> Competitors</button>
          </div>
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 16, color: 'var(--warn)' }}>{error}</div>}

      <div className="section-block">
        <div className="section-block-head">
          <h2>This <em>week</em>, at a glance</h2>
          <span className="sb-sub">from your account stats</span>
        </div>
        {loading ? (
          <p style={{ color: 'var(--fg-2)' }}>Loading stats…</p>
        ) : (
          <div className="stats">
            {statCards.map(s => (
              <div key={s.label} className="stat">
                <div className="s-label">{s.icon} {s.label}</div>
                <div className="s-value">{s.value}</div>
                <div className="s-delta"><DI.Up/> {s.delta}</div>
                <Spark className="s-spark" data={s.spark} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-block">
        <div className="section-block-head">
          <h2>Recent <em>ideas</em></h2>
          <a className="sb-link" onClick={() => router.push(routes.ideas)} style={{ cursor: 'pointer' }}>
            View all {stats?.ideas_created ?? recentIdeas.length} →
          </a>
        </div>
        {loading ? (
          <p style={{ color: 'var(--fg-2)' }}>Loading ideas…</p>
        ) : recentIdeas.length === 0 ? (
          <div className="empty">
            <h3>No ideas yet</h3>
            <p>Start a conversation with Copilot or add your first idea.</p>
          </div>
        ) : (
          <div className="ideas-grid">
            {recentIdeas.map(i => {
              const badge = statusBadge(i.status)
              const score = ideaScore(i)
              return (
                <div key={i.id} className="idea" onClick={() => router.push(routes.idea(i.id))}>
                  <div className="i-row1">
                    <span className={`i-tag ${badge.kind}`}>{badge.text}</span>
                    <span className="i-score">score · <b>{score}</b></span>
                  </div>
                  <h3>{i.title}</h3>
                  <p className="i-desc">{i.description || 'No description yet.'}</p>
                  <div className="i-prog"><div className="bar" style={{ width: `${i.progress_percentage}%` }}/></div>
                  <div className="i-foot">
                    <div className="tags">{(i.tags || []).slice(0, 3).map(t => <span key={t}>{t}</span>)}</div>
                    <span className="sep"/>
                    <span>{timeAgo(i.updated_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="section-block">
        <div className="section-block-head">
          <h2>Recent <em>notifications</em></h2>
          <span className="sb-sub">from Copilot & workspace</span>
        </div>
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--fg-2)' }}>No notifications yet.</p>
        ) : (
          <div className="insights">
            {notifications.map(n => (
              <div key={n.id} className={`insight ${n.is_read ? '' : 'accent'}`}>
                <span className="i-kind"><DI.Bell/> {n.type}</span>
                <h4>{n.title}</h4>
                <p>{n.message}</p>
                <div className="i-meta">
                  <span>{timeAgo(n.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
