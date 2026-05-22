import type { Metadata } from 'next'
import MarketingShell from '@/components/marketing/MarketingShell'
import ProblemSection from '@/components/ProblemSection'

export const metadata: Metadata = {
  title: 'The problem — IdeaCopilot',
  description: 'Why founders need IdeaCopilot.',
}

export default function ProblemPage() {
  return (
    <MarketingShell
      compactHero
      eyebrow="The problem"
      title={<>Ideas everywhere. <em>Clarity</em> nowhere.</>}
      description="Founders drown in fragments — voice memos, Notion docs, tabs, and half-finished projects. IdeaCopilot turns noise into structured, validated work."
    >
      <ProblemSection />
    </MarketingShell>
  )
}
