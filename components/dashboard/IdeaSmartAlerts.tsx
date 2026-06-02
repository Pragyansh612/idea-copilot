'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  alertActionHref,
  buildIdeaAlerts,
  dismissAlert,
  getDismissedAlertIds,
  type IdeaAlert,
} from '@/lib/dashboard/idea-alerts'
import type { Feature, Idea, Phase } from '@/lib/api/idea'
import * as DI from '@/components/dashboard/Icons'

type Props = {
  ideaId: string
  idea: Idea
  phases: Phase[]
  features: Feature[]
  competitors: Array<Record<string, unknown>>
}

export function IdeaSmartAlerts({ ideaId, idea, phases, features, competitors }: Props) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(() => getDismissedAlertIds(ideaId))

  const visible = useMemo(() => {
    const all = buildIdeaAlerts({ idea, phases, features, competitors })
    return all.filter(a => !dismissed.has(a.id))
  }, [idea, phases, features, competitors, dismissed])

  if (visible.length === 0) return null

  function handleDismiss(alertId: string) {
    dismissAlert(ideaId, alertId)
    setDismissed(prev => new Set([...prev, alertId]))
  }

  function runAction(alert: IdeaAlert) {
    router.push(alertActionHref(ideaId, alert.action))
  }

  return (
    <div className="idea-smart-alerts">
      {visible.map(alert => (
        <div key={alert.id} className="idea-smart-alert dash-card">
          <DI.Bell />
          <p>{alert.message}</p>
          <div className="idea-smart-alert-actions">
            <button type="button" className="btn-sm solid" onClick={() => runAction(alert)}>
              {alert.cta}
            </button>
            <button type="button" className="btn-sm ghost" onClick={() => handleDismiss(alert.id)} aria-label="Dismiss">
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
