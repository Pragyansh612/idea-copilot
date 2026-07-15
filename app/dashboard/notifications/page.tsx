'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NotificationAPI, type Notification } from '@/lib/api/notification'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { timeAgo } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'
import type { ReactNode } from 'react'

const FILTERS = ['All', 'Unread', 'Competitors', 'Market', 'AI'] as const
type Filter = (typeof FILTERS)[number]

function notifIcon(type: string): ReactNode {
  const t = type.toLowerCase()
  if (t.includes('gap') || t.includes('market')) return <DI.Target/>
  if (t.includes('compet')) return <DI.Radar/>
  if (t.includes('suggest') || t.includes('ai')) return <DI.Sparkles/>
  if (t.includes('win') || t.includes('streak') || t.includes('achievement')) return <DI.Bolt/>
  return <DI.Bell/>
}

function matchesFilter(n: Notification, filter: Filter): boolean {
  const t = n.type.toLowerCase()
  if (filter === 'Unread') return !n.is_read
  if (filter === 'Competitors') return t.includes('compet')
  if (filter === 'Market') return t.includes('gap') || t.includes('market')
  if (filter === 'AI') return t.includes('suggest') || t.includes('ai') || t.includes('copilot')
  return true
}

function notificationHref(n: Notification): string | null {
  if (n.action_url?.startsWith('/dashboard')) return n.action_url
  if (n.related_idea_id) return routes.idea(n.related_idea_id)
  return null
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading notifications…" />}>
      <NotificationsContent />
    </Suspense>
  )
}

function NotificationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter')
  const [filter, setFilter] = useState<Filter>(
    FILTERS.includes(initialFilter as Filter) ? (initialFilter as Filter) : 'All',
  )
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const result = await NotificationAPI.getNotifications(false)
      setNotifications(result.notifications ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function markAllRead() {
    const unread = notifications.filter(n => !n.is_read)
    try {
      await Promise.all(unread.map(n => NotificationAPI.markAsRead(n.id)))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read')
    }
  }

  async function openNotification(n: Notification) {
    if (!n.is_read) {
      try {
        await NotificationAPI.markAsRead(n.id)
        setNotifications(prev => prev.map(item =>
          item.id === n.id ? { ...item, is_read: true } : item,
        ))
      } catch {
        // still navigate if mark-read fails
      }
    }
    const href = notificationHref(n)
    if (href) router.push(href)
  }

  const filtered = notifications.filter(n => matchesFilter(n, filter))
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
          <button className="btn-sm ghost" onClick={() => void markAllRead()} disabled={unread === 0}><DI.Check/> Mark all read</button>
          <button className="btn-sm ghost" onClick={() => router.push(routes.settingsSection('notifs'))}><DI.Cog/> Settings</button>
        </div>
      </div>

      {error && <PageError message={error} onRetry={load} />}

      <div className="ideas-filterbar">
        <div className="chips">
          {FILTERS.map(f => (
            <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
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
        ) : filtered.map((n, i) => {
          const href = notificationHref(n)
          return (
            <button
              key={n.id}
              type="button"
              className="notif-row"
              style={{
                borderBottom: i === filtered.length - 1 ? 0 : '1px solid var(--line)',
                background: n.is_read ? 'transparent' : 'color-mix(in srgb, var(--accent) 4%, transparent)',
                cursor: href ? 'pointer' : 'default',
              }}
              onClick={() => void openNotification(n)}
            >
              <span className="notif-icon">
                {notifIcon(n.type)}
              </span>
              <div className="notif-body">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 14, color: 'var(--fg)' }}>{n.title}</span>
                  {!n.is_read && <span className="notif-unread-dot"/>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4, textAlign: 'left' }}>{n.message}</div>
                {href && (
                  <span style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, display: 'inline-block' }}>
                    Open related idea →
                  </span>
                )}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>{timeAgo(n.created_at)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
