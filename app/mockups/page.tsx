import type { Metadata } from 'next'
import MarketingShell from '@/components/marketing/MarketingShell'
import MockupsSection from '@/components/MockupsSection'

export const metadata: Metadata = {
  title: 'Product mockups — IdeaCopilot',
  description: 'Explore the IdeaCopilot workspace UI.',
}

export default function MockupsPage() {
  return (
    <MarketingShell
      compactHero
      eyebrow="Product mockups"
      title={<>The workspace, <em>in detail</em>.</>}
      description="Scroll through the same UI patterns you get after sign-up — dashboard, feature board, roadmap, and strategy cards."
    >
      <MockupsSection />
    </MarketingShell>
  )
}
