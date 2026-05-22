import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingShell from '@/components/marketing/MarketingShell'
import IntelSection from '@/components/IntelSection'
import { routes } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Competitor intelligence — IdeaCopilot',
  description: 'Map competitors and market gaps with IdeaCopilot.',
}

export default function IntelPage() {
  return (
    <MarketingShell
      compactHero
      eyebrow="Intelligence"
      title={<>The market, <em>mapped</em>.</>}
      description="See how competitor radar and gap detection work in the product — then run live analysis on your own ideas after sign-up."
    >
      <IntelSection />
      <div className="wrap" style={{ padding: '0 0 64px', textAlign: 'center' }}>
        <Link className="btn btn-primary" href={routes.productCompetitors}>
          Explore competitor radar →
        </Link>
      </div>
    </MarketingShell>
  )
}
