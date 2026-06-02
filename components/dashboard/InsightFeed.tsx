'use client'

import Link from 'next/link'
import type { WorkspaceInsight } from '@/lib/dashboard/workspace-intelligence'
import * as DI from '@/components/dashboard/Icons'

type Props = {
  insights: WorkspaceInsight[]
}

export function InsightFeed({ insights }: Props) {
  if (insights.length === 0) return null

  return (
    <div className="section-block">
      <div className="section-block-head">
        <h2>AI <em>insights</em></h2>
        <span className="live">rule-based · live</span>
      </div>
      <div className="insight-feed">
        {insights.map(insight => (
          <div key={insight.id} className="dash-card insight-card">
            <div className="insight-card-body">
              <DI.Sparkles />
              <p>{insight.message}</p>
            </div>
            <Link href={insight.href} className="btn-sm ghost insight-card-cta">
              {insight.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
