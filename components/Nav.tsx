'use client'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { routes } from '@/lib/routes'

export default function Nav() {
  return (
    <nav className="nav">
      <Link className="nav-logo" href={routes.home}>
        <span className="mark" />
        <span>IdeaCopilot</span>
      </Link>
      <div className="nav-links">
        <Link href={routes.workflow}>Workflow</Link>
        <Link href={routes.intel}>Intelligence</Link>
        <Link href={routes.copilotSection}>Copilot</Link>
        {/* <a href={routes.pricing}>Pricing</a> */}
      </div>
      <span className="nav-sep" />
      <ThemeToggle />
      <Link className="nav-link-quiet" href={routes.login} style={{ fontSize: 13.5, color: 'var(--fg-2)', marginRight: 4 }}>
        Log in
      </Link>
      <Link className="nav-cta" href={routes.signup}>Start free</Link>
    </nav>
  )
}
