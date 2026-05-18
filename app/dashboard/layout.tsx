'use client'
import './dashboard.css'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'
import * as DI from '@/components/dashboard/Icons'

const ROUTES = [
  { id: 'home',     label: 'Dashboard',               icon: <DI.Home/>,   section: 'Workspace',     href: '/dashboard' },
  { id: 'ideas',    label: 'My Ideas',                icon: <DI.Bulb/>,   section: 'Workspace',     href: '/dashboard/ideas',        count: 24 },
  { id: 'copilot',  label: 'AI Copilot',              icon: <DI.Spark/>,  section: 'Intelligence',  href: '/dashboard/copilot' },
  { id: 'comp',     label: 'Competitor Intelligence', icon: <DI.Radar/>,  section: 'Intelligence',  href: '/dashboard/competitors' },
  { id: 'gaps',     label: 'Market Gaps',             icon: <DI.Target/>, section: 'Intelligence',  href: '/dashboard/gaps',         count: 3 },
  { id: 'roadmaps', label: 'Roadmaps',                icon: <DI.Route/>,  section: 'Intelligence',  href: '/dashboard/roadmaps' },
  { id: 'notifs',   label: 'Notifications',           icon: <DI.Bell/>,   section: 'Account',       href: '/dashboard/notifications', count: 5 },
  { id: 'exports',  label: 'Exports',                 icon: <DI.Export/>, section: 'Account',       href: '/dashboard/exports' },
  { id: 'settings', label: 'Settings',                icon: <DI.Cog/>,    section: 'Account',       href: '/dashboard/settings' },
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

function getCrumbs(pathname: string): string[] {
  if (pathname === '/dashboard') return ['Dashboard']
  if (pathname.startsWith('/dashboard/ideas/')) {
    const id = decodeURIComponent(pathname.split('/dashboard/ideas/')[1])
    return ['My Ideas', id]
  }
  const r = ROUTES.find(r => r.href === pathname)
  return r ? [r.label] : ['Dashboard']
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [theme, toggleTheme] = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const activeId = getActiveId(pathname)
  const crumbs = getCrumbs(pathname)
  const contentRef = useRef<HTMLDivElement>(null)

  // scroll content to top on route change
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [pathname])

  function logout() {
    document.cookie = 'ic-auth=; path=/; max-age=0'
    router.push('/login')
  }

  const sections = ['Workspace', 'Intelligence', 'Account']

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sb">
        <div className="sb-brand">
          <span className="mark" />
          <span>IdeaCopilot</span>
          <span className="sb-ind">live</span>
        </div>

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
                  {r.count != null && <span className="sb-count">{r.count}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="sb-foot">
          <div className="sb-upgrade">
            <div className="ub-title">Upgrade to <em>Founder</em></div>
            <div className="ub-desc">Unlimited Copilot calls, live competitor pull, priority models.</div>
            <a className="ub-cta" style={{ cursor: 'pointer' }}>Start free trial <DI.Arrow/></a>
          </div>
          <div className="sb-ws">
            <div className="ws-icon">AB</div>
            <div className="ws-meta">
              <div className="ws-name">Alex&apos;s Lab</div>
              <div className="ws-plan">FREE · 3/3 ideas</div>
            </div>
            <span className="ws-caret"><DI.Caret/></span>
          </div>
          <div className="sb-user" onClick={logout} title="Click to sign out">
            <div className="av" />
            <div className="who">
              <div className="name">Alex Brennan</div>
              <div className="role">founder · solo</div>
            </div>
            <span className="menu"><DI.Dots/></span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Topbar */}
        <div className="tb">
          <div className="tb-crumbs">
            <a href="/" style={{ color: 'var(--fg-3)' }}>Site</a>
            <span className="sep">/</span>
            <span>Alex&apos;s Lab</span>
            {crumbs.map((c, i) => (
              <span key={i}>
                <span className="sep">/</span>
                <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
              </span>
            ))}
          </div>

          <div className="tb-search">
            <DI.Search />
            <input placeholder="Search ideas, competitors, the workspace…" />
            <span className="kbd">⌘ K</span>
          </div>

          <div className="tb-actions">
            <button className="tb-cta" onClick={() => router.push('/dashboard/ideas')}>
              <DI.Plus /> New idea
            </button>
            <div className="tb-divider" />
            <button className="tb-btn" title="AI Command"><DI.Bolt /></button>
            <button className="tb-btn has-dot" onClick={() => router.push('/dashboard/notifications')} title="Notifications">
              <DI.Bell />
            </button>
            <button className="tb-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <DI.Moon /> : <DI.Sun />}
            </button>
          </div>
        </div>

        <div className="content" ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  )
}