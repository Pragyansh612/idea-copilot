'use client'

import Link from 'next/link'
import type { FounderSummary } from '@/lib/dashboard/workspace-intelligence'
import { routes } from '@/lib/routes'

type Props = {
  summary: FounderSummary
}

export function FounderSummaryStrip({ summary }: Props) {
  const { ready, work, attention } = summary
  const total = ready + work + attention
  if (total === 0) return null

  return (
    <div className="founder-summary-strip" role="status">
      <Link href={routes.ideasWithBucket('ready')} className="founder-summary-seg">
        <strong>{ready}</strong> ready to build
      </Link>
      <span className="founder-summary-dot" aria-hidden>·</span>
      <Link href={routes.ideasWithBucket('work')} className="founder-summary-seg">
        <strong>{work}</strong> need work
      </Link>
      <span className="founder-summary-dot" aria-hidden>·</span>
      <Link href={routes.ideasWithBucket('attention')} className="founder-summary-seg">
        <strong>{attention}</strong> need{attention === 1 ? 's' : ''} attention
      </Link>
    </div>
  )
}
