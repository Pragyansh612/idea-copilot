'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatImportModal } from '@/components/dashboard/ChatImportModal'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

/** Compact shortcuts shown on dashboard for returning users. */
export function QuickActionsBar() {
  const router = useRouter()
  const [showImport, setShowImport] = useState(false)

  return (
    <>
      {showImport && (
        <ChatImportModal
          onClose={() => setShowImport(false)}
          onDone={() => {
            setShowImport(false)
            router.push(routes.ideas)
          }}
        />
      )}
      <div className="quick-actions-bar">
        <button type="button" className="quick-action" onClick={() => router.push(routes.newIdea)}>
          <DI.Plus /> New idea
        </button>
        <button type="button" className="quick-action" onClick={() => setShowImport(true)}>
          <DI.Chat /> Import chat
        </button>
        <button type="button" className="quick-action" onClick={() => router.push(routes.copilot)}>
          <DI.Spark /> Ask Copilot
        </button>
        <button type="button" className="quick-action" onClick={() => router.push(routes.competitors)}>
          <DI.Radar /> Competitors
        </button>
        <button type="button" className="quick-action" onClick={() => router.push(routes.exports)}>
          <DI.Export /> Export
        </button>
      </div>
    </>
  )
}
