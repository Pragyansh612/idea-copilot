import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingShell from '@/components/marketing/MarketingShell'
import CopilotSection from '@/components/CopilotSection'
import { routes } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'AI Copilot — IdeaCopilot',
  description: 'Your AI product strategist inside IdeaCopilot.',
}

export default function CopilotPage() {
  return (
    <MarketingShell
      compactHero
      eyebrow="AI Copilot"
      title={<>Strategy on <em>demand</em>.</>}
      description="Ask anything about your ideas, market, or roadmap. Copilot uses your live workspace context — not generic startup advice."
    >
      <CopilotSection />
      <div className="wrap" style={{ padding: '0 0 64px', textAlign: 'center' }}>
        <Link className="btn btn-primary" href={routes.productCopilot}>
          See Copilot in the product →
        </Link>
      </div>
    </MarketingShell>
  )
}
