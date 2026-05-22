'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { routes } from '@/lib/routes'

type MarketingShellProps = {
  eyebrow: string
  title: ReactNode
  description: string
  children: ReactNode
  compactHero?: boolean
}

export default function MarketingShell({
  eyebrow,
  title,
  description,
  children,
  compactHero = false,
}: MarketingShellProps) {
  return (
    <>
      <Nav />
      <main className={compactHero ? 'marketing-page marketing-page--compact' : 'marketing-page'}>
        <div className="wrap marketing-hero">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="marketing-hero-title">{title}</h1>
          <p className="marketing-hero-desc">{description}</p>
          <div className="marketing-hero-ctas">
            <Link className="btn btn-primary" href={routes.signup}>Start free →</Link>
            <Link className="btn btn-ghost" href={routes.login}>Log in</Link>
          </div>
        </div>
        <div className="marketing-body">{children}</div>
      </main>
      <Footer />
    </>
  )
}
