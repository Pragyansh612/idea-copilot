'use client'

import Link from 'next/link'
import type { WorkspaceHealth } from '@/lib/dashboard/workspace-intelligence'

type Props = {
  health: WorkspaceHealth
}

export function WorkspaceHealthCard({ health }: Props) {
  return (
    <div className="dash-card workspace-health-card">
      <div className="workspace-health-main">
        <div>
          <div className="eyebrow-mono">Workspace Health</div>
          <p className="workspace-health-sub">How active and validated your idea portfolio is.</p>
        </div>
        <div className="workspace-health-score" aria-label={`Workspace health ${health.score} percent`}>
          <span className="workspace-health-pct">{health.score}</span>
          <span className="workspace-health-of">/ 100</span>
        </div>
      </div>
      {health.score < 100 && health.reasons.length > 0 && (
        <ul className="workspace-health-reasons">
          {health.reasons.map(r => (
            <li key={r.id}>
              <Link href={r.href}>{r.label}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
