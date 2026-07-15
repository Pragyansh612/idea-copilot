'use client'
import './dashboard.css'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import { WorkspaceSearch } from '@/components/dashboard/WorkspaceSearch'
import { DashboardChromeProvider, useDashboardChrome } from '@/components/dashboard/DashboardChromeContext'
import { isUuid } from '@/lib/dashboard/format'
import { useAuth } from '@/hooks/useAuth'
import { IdeaAPI } from '@/lib/api/idea'
import { NotificationAPI } from '@/lib/api/notification'
import { AuthAPI } from '@/lib/api/auth'
import { UserAPI, type UserProfile } from '@/lib/api/user'
import { displayName } from '@/lib/dashboard/format'
import { redirectToLogin } from '@/lib/auth/session'
import { TokenManager } from '@/lib/auth/tokens'
import { getCached, setCached } from '@/lib/dashboard/query-cache'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const ROUTES = [
  { id: 'home',     label: 'Dashboard',     icon: <DI.Home/>,   section: 'Workspace',     href: routes.dashboard, countKey: null as string | null },
  { id: 'ideas',    label: 'My Ideas',      icon: <DI.Bulb/>,   section: 'Workspace',     href: routes.ideas, countKey: 'ideas' },
  { id: 'roadmaps', label: 'Roadmaps',      icon: <DI.Route/>,  section: 'Workspace',     href: routes.roadmaps, countKey: null },
  { id: 'exports',  label: 'Exports',       icon: <DI.Export/>, section: 'Workspace',     href: routes.exports, countKey: null },
  { id: 'intel',    label: 'Intelligence',  icon: <DI.Radar/>,  section: 'Intelligence',  href: routes.intelligence, countKey: null },
  { id: 'copilot',  label: 'Copilot',       icon: <DI.Spark/>,  section: 'AI',            href: routes.copilot, countKey: null },
  { id: 'notifs',   label: 'Notifications', icon: <DI.Bell/>,   section: 'Account',       href: routes.notifications, countKey: 'notifs' },
  { id: 'achieve',  label: 'Achievements',  icon: <DI.Bolt/>,   section: 'Account',       href: routes.achievements, countKey: null },
  { id: 'settings', label: 'Settings',      icon: <DI.Cog/>,    section: 'Account',       href: routes.settings, countKey: null },
] as const

const NAV_SECTIONS = ['Workspace', 'Intelligence', 'AI', 'Account'] as const

function getActiveId(pathname: string): string {
  if (pathname === routes.dashboard) return 'home'
  if (pathname.startsWith('/dashboard/ideas')) return 'ideas'
  if (pathname === routes.roadmaps || pathname.startsWith(`${routes.roadmaps}/`)) return 'roadmaps'
  if (pathname === routes.exports) return 'exports'
  if (pathname.startsWith('/dashboard/intelligence')) return 'intel'
  if (pathname.startsWith('/dashboard/competitors')) return 'intel'
  if (pathname.startsWith('/dashboard/gaps')) return 'intel'
  if (pathname.startsWith('/dashboard/copilot')) return 'copilot'
  if (pathname.startsWith('/dashboard/notifications')) return 'notifs'
  if (pathname === routes.achievements) return 'achieve'
  if (pathname.startsWith('/dashboard/settings')) return 'settings'
  return 'home'
}

function getCrumbs(pathname: string, ideaDetailTitle: string | null): string[] {
  if (pathname === '/dashboard') return ['Dashboard']
  if (pathname === routes.newIdea) return ['My Ideas', 'New idea']
  if (pathname.startsWith('/dashboard/ideas/')) {
    const id = decodeURIComponent(pathname.split('/dashboard/ideas/')[1]?.split('?')[0] || '')
    if (id === 'new') return ['My Ideas', 'New idea']
    const label = ideaDetailTitle || (isUuid(id) ? 'Idea' : id)
    return ['My Ideas', label]
  }
  if (pathname === routes.roadmaps) return ['Roadmaps']
  if (pathname.startsWith('/dashboard/intelligence')) return ['Intelligence']
  if (pathname.startsWith('/dashboard/competitors')) return ['Intelligence']
  if (pathname.startsWith('/dashboard/gaps')) return ['Intelligence']
  if (pathname === routes.copilot) return ['Copilot']
  if (pathname === routes.notifications) return ['Notifications']
  if (pathname === routes.achievements) return ['Achievements']
  if (pathname === routes.settings) return ['Settings']
  if (pathname === routes.exports) return ['Exports']
  const r = ROUTES.find(item => item.href === pathname)
  return r ? [r.label] : ['Dashboard']
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { ideaDetailTitle } = useDashboardChrome()
  const activeId = getActiveId(pathname)
  const crumbs = getCrumbs(pathname, ideaDetailTitle)
  const contentRef = useRef<HTMLDivElement>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [accountEmail, setAccountEmail] = useState<string>('')
  const [ideaCount, setIdeaCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    document.body.classList.add('app-body')
    return () => document.body.classList.remove('app-body')
  }, [])

  useEffect(() => {
    let cancelled = false
    async function guard() {
      const { ensureAuthCookies } = await import('@/lib/auth/session')
      // Refresh + sync cookies when access JWT expired but refresh remains.
      if (TokenManager.getRefreshToken() || TokenManager.isAuthenticated()) {
        const ok = await ensureAuthCookies()
        if (cancelled) return
        if (ok && TokenManager.isAuthenticated()) return
      }
      if (!cancelled) await redirectToLogin(pathname)
    }
    void guard()
    return () => {
      cancelled = true
    }
  }, [pathname])

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    let cancelled = false
    const cacheKey = 'nav:meta'

    type NavMeta = {
      profile: UserProfile | null
      accountEmail: string
      ideaCount: number
      unreadCount: number
    }

    const cached = getCached<NavMeta>(cacheKey)
    if (cached) {
      setProfile(cached.profile)
      setAccountEmail(cached.accountEmail)
      setIdeaCount(cached.ideaCount)
      setUnreadCount(cached.unreadCount)
      // Fresh enough — skip re-fetch on every nav click
      return () => { cancelled = true }
    }

    async function loadNavMeta() {
      try {
        const [prof, ideas, notifs, me] = await Promise.all([
          UserAPI.getProfile(),
          IdeaAPI.getIdeas({ limit: 1 }),
          NotificationAPI.getNotifications(true),
          AuthAPI.getMe().catch(() => null),
        ])
        if (cancelled) return
        const next: NavMeta = {
          profile: prof,
          accountEmail: me?.email ?? prof.email ?? '',
          ideaCount: ideas.total,
          unreadCount: notifs.unread_count,
        }
        setProfile(next.profile)
        setAccountEmail(next.accountEmail)
        setIdeaCount(next.ideaCount)
        setUnreadCount(next.unreadCount)
        setCached(cacheKey, next, 45_000)
      } catch {
        if (!cancelled) {
          setProfile(null)
          setIdeaCount(0)
          setUnreadCount(0)
        }
      }
    }
    void loadNavMeta()
    return () => { cancelled = true }
  }, [pathname])

  const name = displayName(accountEmail || profile?.email, profile?.display_name)

  function routeCount(key: string | null) {
    if (!key) return undefined
    if (key === 'ideas' && ideaCount > 0) return ideaCount
    if (key === 'notifs' && unreadCount > 0) return unreadCount
    return undefined
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sb">
        <Link href={routes.dashboard} className="sb-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="mark" />
          <span>IdeaCopilot</span>
          <span className="sb-ind">live</span>
        </Link>

        <div className="sb-nav">
          {NAV_SECTIONS.map(sec => (
            <div key={sec}>
              <div className="sb-section">{sec}</div>
              {ROUTES.filter(r => r.section === sec).map(r => (
                <button
                  key={r.id}
                  className={`sb-item ${activeId === r.id ? 'active' : ''}`}
                  onClick={() => router.push(r.href)}
                >
                  {r.icon}
                  <span>{r.label}</span>
                  {routeCount(r.countKey) != null && <span className="sb-count">{routeCount(r.countKey)}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="sb-foot">
          {/* Pricing / upgrade hidden while everything is free */}
          <button
            type="button"
            className="sb-account"
            onClick={() => router.push(routes.settings)}
            aria-label="Account settings"
          >
            <div className="ws-icon">{name.slice(0, 2).toUpperCase()}</div>
            <div className="ws-meta">
              <div className="ws-name">{name}</div>
              <div className="ws-hint">Account & settings</div>
            </div>
            <span className="ws-caret"><DI.Caret/></span>
          </button>
          <button type="button" className="sb-signout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Topbar */}
        <div className="tb">
          <div className="tb-crumbs">
            <Link href={routes.dashboard} style={{ color: 'var(--fg-3)' }}>Dashboard</Link>
            <span className="sep">/</span>
            <span>{name}</span>
            {crumbs.map((c, i) => (
              <span key={i}>
                <span className="sep">/</span>
                <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
              </span>
            ))}
          </div>

          <WorkspaceSearch />

          <div className="tb-actions">
            <button className="tb-cta" onClick={() => router.push(routes.newIdea)}>
              <DI.Plus /> New idea
            </button>
            <div className="tb-divider" />
            <button className="tb-btn" title="AI Copilot" onClick={() => router.push(routes.copilot)}><DI.Bolt /></button>
            <button
              className={`tb-btn ${unreadCount > 0 ? 'has-dot' : ''}`}
              onClick={() => router.push(routes.notifications)}
              title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            >
              <DI.Bell />
            </button>
            <ThemeToggle className="tb-btn" />
          </div>
        </div>

        <div className="content" ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardChromeProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardChromeProvider>
  )
}