'use client'
import './dashboard.css'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import { DashboardChromeProvider, useDashboardChrome } from '@/components/dashboard/DashboardChromeContext'
import { isUuid } from '@/lib/dashboard/format'
import { useAuth } from '@/hooks/useAuth'
import { IdeaAPI } from '@/lib/api/idea'
import { NotificationAPI } from '@/lib/api/notification'
import { AuthAPI } from '@/lib/api/auth'
import { UserAPI, type UserProfile } from '@/lib/api/user'
import { displayName } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const ROUTES = [
  { id: 'home',     label: 'Dashboard',               icon: <DI.Home/>,   section: 'Workspace',     href: '/dashboard', countKey: null as string | null },
  { id: 'ideas',    label: 'My Ideas',                icon: <DI.Bulb/>,   section: 'Workspace',     href: '/dashboard/ideas', countKey: 'ideas' },
  { id: 'copilot',  label: 'AI Copilot',              icon: <DI.Spark/>,  section: 'Intelligence',  href: '/dashboard/copilot', countKey: null },
  { id: 'comp',     label: 'Competitor Intelligence', icon: <DI.Radar/>,  section: 'Intelligence',  href: '/dashboard/competitors', countKey: null },
  { id: 'gaps',     label: 'Market Gaps',             icon: <DI.Target/>, section: 'Intelligence',  href: '/dashboard/gaps', countKey: null },
  { id: 'roadmaps', label: 'Roadmaps',                icon: <DI.Route/>,  section: 'Intelligence',  href: '/dashboard/roadmaps', countKey: null },
  { id: 'notifs',   label: 'Notifications',           icon: <DI.Bell/>,   section: 'Account',       href: '/dashboard/notifications', countKey: 'notifs' },
  { id: 'exports',  label: 'Exports',                 icon: <DI.Export/>, section: 'Account',       href: '/dashboard/exports', countKey: null },
  { id: 'settings', label: 'Settings',                icon: <DI.Cog/>,    section: 'Account',       href: '/dashboard/settings', countKey: null },
]

function getActiveId(pathname: string) {
  if (pathname === '/dashboard') return 'home'
  if (pathname.startsWith('/dashboard/ideas')) return 'ideas'
  if (pathname.startsWith('/dashboard/copilot')) return 'copilot'
  if (pathname.startsWith('/dashboard/competitors')) return 'comp'
  if (pathname.startsWith('/dashboard/gaps')) return 'gaps'
  if (pathname.startsWith('/dashboard/roadmaps')) return 'roadmaps'
  if (pathname.startsWith('/dashboard/notifications')) return 'notifs'
  if (pathname.startsWith('/dashboard/exports')) return 'exports'
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
  const r = ROUTES.find(r => r.href === pathname)
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
    contentRef.current?.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    let cancelled = false
    async function loadNavMeta() {
      try {
        const [prof, ideas, notifs, me] = await Promise.all([
          UserAPI.getProfile(),
          IdeaAPI.getIdeas({ limit: 1 }),
          NotificationAPI.getNotifications(true),
          AuthAPI.getMe().catch(() => null),
        ])
        if (cancelled) return
        setProfile(prof)
        setAccountEmail(me?.email ?? prof.email ?? '')
        setIdeaCount(ideas.total)
        setUnreadCount(notifs.unread_count)
      } catch {
        if (!cancelled) {
          setProfile(null)
          setIdeaCount(0)
          setUnreadCount(0)
        }
      }
    }
    loadNavMeta()
    return () => { cancelled = true }
  }, [pathname])

  const name = displayName(accountEmail || profile?.email, profile?.display_name)
  const sections = ['Workspace', 'Intelligence', 'Account']

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
          {sections.map(sec => (
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

          <div className="tb-search" title="Search coming soon">
            <DI.Search />
            <input placeholder="Search (coming soon)" disabled aria-disabled="true" />
          </div>

          <div className="tb-actions">
            <button className="tb-cta" onClick={() => router.push(routes.newIdea)}>
              <DI.Plus /> New idea
            </button>
            <div className="tb-divider" />
            <button className="tb-btn" title="AI Copilot" onClick={() => router.push(routes.copilot)}><DI.Bolt /></button>
            <button className="tb-btn has-dot" onClick={() => router.push(routes.notifications)} title="Notifications">
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