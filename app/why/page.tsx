import type { Metadata } from 'next'
import MarketingShell from '@/components/marketing/MarketingShell'
import WhySection from '@/components/WhySection'

export const metadata: Metadata = {
  title: 'Why IdeaCopilot — IdeaCopilot',
  description: 'Why IdeaCopilot is different from notes apps and PM tools.',
}

export default function WhyPage() {
  return (
    <MarketingShell
      compactHero
      eyebrow="Why IdeaCopilot"
      title={<>Not notes. An <em>operating system</em> for founders.</>}
      description="Notes store text. PM tools track tasks. IdeaCopilot reasons about your wedge, competitors, and sequence — with traceable AI outputs."
    >
      <WhySection />
    </MarketingShell>
  )
}
