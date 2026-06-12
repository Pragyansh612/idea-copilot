'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AchievementAPI,
  type Achievement,
  type AchievementDefinition,
} from '@/lib/api/achievement'
import { UserAPI } from '@/lib/api/user'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { timeAgo } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

type AchievementRow = AchievementDefinition & {
  unlocked: boolean
  unlockedAt?: string
}

export default function AchievementsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<AchievementRow[]>([])
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [definitions, unlocked, stats] = await Promise.all([
        AchievementAPI.getAllAchievements(),
        AchievementAPI.getUserAchievements(),
        UserAPI.getStats().catch(() => null),
      ])
      const byType = new Map<string, Achievement>()
      for (const a of unlocked) byType.set(a.achievement_type, a)

      setRows(
        definitions.map(def => {
          const u = byType.get(def.achievement_type)
          return {
            ...def,
            unlocked: Boolean(u),
            unlockedAt: u?.unlocked_at,
          }
        }),
      )
      setXp(stats?.total_xp ?? 0)
      setLevel(stats?.current_level ?? 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load achievements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    if (filter === 'unlocked') return rows.filter(r => r.unlocked)
    if (filter === 'locked') return rows.filter(r => !r.unlocked)
    return rows
  }, [rows, filter])

  const unlockedCount = rows.filter(r => r.unlocked).length

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Achievements · {unlockedCount}/{rows.length} unlocked</div>
          <h1>Founder <em>milestones</em>.</h1>
          <div className="ph-sub">
            Level {level} · {xp} XP earned across your workspace journey.
          </div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.dashboard)}>
            <DI.Home /> Dashboard
          </button>
        </div>
      </div>

      {error && <PageError message={error} onRetry={load} />}

      <div className="ideas-filterbar">
        <div className="chips">
          {(['all', 'unlocked', 'locked'] as const).map(f => (
            <button
              key={f}
              type="button"
              className={`chip ${filter === f ? 'on' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Locked'}
            </button>
          ))}
        </div>
      </div>

      {loading && !error && <PageLoading label="Loading achievements…" />}

      {!loading && !error && filtered.length === 0 && (
        <PageEmpty
          icon={<DI.Bolt />}
          title="No achievements in this view"
          description="Keep building ideas to unlock milestones."
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="achievements-grid">
          {filtered.map(row => (
            <div
              key={row.achievement_type}
              className={`achievement-card dash-card ${row.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">{row.icon || '🏆'}</div>
              <div className="achievement-body">
                <div className="achievement-title">{row.title}</div>
                <div className="achievement-desc">{row.description}</div>
                <div className="achievement-meta">
                  <span className="achievement-xp">+{row.xp_awarded} XP</span>
                  {row.unlocked && row.unlockedAt && (
                    <span className="achievement-when">Unlocked {timeAgo(row.unlockedAt)}</span>
                  )}
                  {!row.unlocked && (
                    <span className="achievement-condition">{row.unlock_condition}</span>
                  )}
                </div>
              </div>
              {row.unlocked && <span className="achievement-badge"><DI.Check /></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
