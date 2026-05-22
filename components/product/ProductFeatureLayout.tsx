'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ProductDemo, { type ProductDemoVariant } from '@/components/product/ProductDemo'
import { routes } from '@/lib/routes'

type ProductFeatureLayoutProps = {
  variant: ProductDemoVariant
  eyebrow: string
  title: ReactNode
  description: string
  bullets: string[]
  highlights?: { title: string; desc: string }[]
}

export default function ProductFeatureLayout({
  variant,
  eyebrow,
  title,
  description,
  bullets,
  highlights = [],
}: ProductFeatureLayoutProps) {
  return (
    <>
      <Nav />
      <main className="product-page">
        <div className="wrap product-page-grid">
          <div className="product-page-copy">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="product-page-title">{title}</h1>
            <p className="product-page-desc">{description}</p>

            <ul className="product-page-bullets">
              {bullets.map(b => (
                <li key={b}>{b}</li>
              ))}
            </ul>

            {highlights.length > 0 && (
              <div className="product-page-highlights">
                {highlights.map(h => (
                  <div key={h.title} className="product-page-highlight">
                    <div className="product-page-highlight-title">{h.title}</div>
                    <div className="product-page-highlight-desc">{h.desc}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="product-page-ctas">
              <Link className="btn btn-primary" href={routes.signup}>Start free →</Link>
              <Link className="btn btn-ghost" href={routes.login}>Log in to workspace</Link>
            </div>
            <p className="product-page-footnote">
              Already signed in?{' '}
              <Link href={routes.dashboard}>Open your dashboard</Link>
            </p>
          </div>

          <div className="product-page-visual">
            <ProductDemo variant={variant} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
