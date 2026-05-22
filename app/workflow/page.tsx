import type { Metadata } from 'next'
import MarketingShell from '@/components/marketing/MarketingShell'
import WorkflowSection from '@/components/WorkflowSection'

export const metadata: Metadata = {
  title: 'Workflow — IdeaCopilot',
  description: 'See how IdeaCopilot takes you from capture to shipped product.',
}

export default function WorkflowPage() {
  return (
    <MarketingShell
      compactHero
      eyebrow="Workflow tour"
      title={<>From spark to <em>shipped</em>.</>}
      description="Capture fragments, refine with AI, map competitors, and sequence a roadmap — one continuous loop inside your workspace."
    >
      <WorkflowSection />
    </MarketingShell>
  )
}
