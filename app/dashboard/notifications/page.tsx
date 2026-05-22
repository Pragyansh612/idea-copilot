'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationAPI, type Notification } from '@/lib/api/notification'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { timeAgo } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'
import type { ReactNode } from 'react'

function notifIcon(type: string): ReactNode {
  const t = type.toLowerCase()
  if (t.includes('gap') || t.includes('market')) return <DI.Target/>
  if (t.includes('compet')) return <DI.Radar/>
  if (t.includes('suggest') || t.includes('ai')) return <DI.Sparkles/>
  if (t.includes('win') || t.includes('streak')) return <DI.Bolt/>
  return <DI.Bell/>
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('All')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filters = ['All', 'Unread']

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const result = await NotificationAPI.getNotifications(false)
      setNotifications(result.notifications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.is_read)
    await Promise.all(unread.map(n => NotificationAPI.markAsRead(n.id)))
    await load()
  }

  const filtered = filter === 'Unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Notifications · {unread} unread</div>
          <h1>The Copilot&apos;s <em>watchtower</em>.</h1>
          <div className="ph-sub">Market gaps, competitor moves, fresh suggestions — from your live workspace.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost" onClick={markAllRead} disabled={unread === 0}><DI.Check/> Mark all read</button>
          <button className="btn-sm ghost" onClick={() => router.push(routes.settings)}><DI.Cog/> Settings</button>
        </div>
      </div>

      {error && <PageError message={error} onRetry={load} />}

      <div className="ideas-filterbar">
        <div className="chips">
          {filters.map(f => <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
        </div>
      </div>

      <div className="dash-card" style={{ padding: 0 }}>
        {loading ? (
          <PageLoading label="Loading notifications…" />
        ) : filtered.length === 0 ? (
          <PageEmpty
            icon={<DI.Bell />}
            title="No notifications"
            description="Copilot and workspace events will show up here."
          />
        ) : filtered.map((n, i) => (
          <div
            key={n.id}
            style={{
              display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14,
              padding: '14px 18px',
              borderBottom: i === filtered.length - 1 ? 0 : '1px solid var(--line)',
              alignItems: 'center',
              background: n.is_read ? 'transparent' : 'color-mix(in srgb, var(--accent) 4%, transparent)',
            }}
          >
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {notifIcon(n.type)}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--fg)' }}>{n.title}</span>
                {!n.is_read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}/>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>{n.message}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>{timeAgo(n.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
