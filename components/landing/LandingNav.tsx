'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { routes } from '@/lib/routes'

/* =========================================================================
   Nav — minimal. Product name, where you are, one action. Same action as
   the closing CTA, always visible. Anchors into the sections of this page;
   distinct from the shared marketing Nav (components/Nav.tsx) which links
   between separate /workflow /intel /copilot pages still used elsewhere.
   ========================================================================= */
export default function LandingNav() {
  return (
    <nav className="nav">
      <Link className="nav-logo" href={routes.home}>
        <span className="mark" />
        <span>IdeaCopilot</span>
      </Link>
      <div className="nav-links">
        <a href="#discovery">Watch it work</a>
        <a href="#journey">The path</a>
        <a href="#workspace">In use</a>
      </div>
      <span className="nav-sep" />
      <ThemeToggle />
      <Link className="nav-cta" href={routes.login}>
        Open the workspace
      </Link>
    </nav>
  )
}
