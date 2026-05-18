'use client'
import Link from 'next/link'
import { useTheme } from '@/hooks/useTheme'
import { IconSun, IconMoon } from './Icons'
import { routes } from '@/lib/routes'

export default function Nav() {
  const [theme, toggleTheme] = useTheme()
  return (
    <nav className="nav">
      <Link className="nav-logo" href={routes.home}>
        <span className="mark" />
        <span>IdeaCopilot</span>
      </Link>
      <div className="nav-links">
        <a href={routes.workflow}>Workflow</a>
        <a href={routes.intel}>Intelligence</a>
        <a href={routes.copilotSection}>Copilot</a>
        <a href={routes.pricing}>Pricing</a>
      </div>
      <span className="nav-sep" />
      <button
        className="nav-icon"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'}`}
      >
        {theme === 'light' ? <IconMoon /> : <IconSun />}
      </button>
      <Link className="nav-link-quiet" href={routes.login} style={{ fontSize: 13.5, color: 'var(--fg-2)', marginRight: 4 }}>
        Log in
      </Link>
      <Link className="nav-cta" href={routes.signup}>Start free</Link>
    </nav>
  )
}
