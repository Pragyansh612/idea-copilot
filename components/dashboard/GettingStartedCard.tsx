'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatImportModal } from '@/components/dashboard/ChatImportModal'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

export function GettingStartedCard() {
  const router = useRouter()
  const [showImport, setShowImport] = useState(false)

  const steps = [
    {
      icon: <DI.Plus />,
      title: 'Capture an idea',
      desc: 'Name your spark and we’ll guide you through validation.',
      action: 'New idea',
      onClick: () => router.push(routes.newIdea),
      primary: true,
    },
    {
      icon: <DI.Chat />,
      title: 'Import from AI chat',
      desc: 'Paste a ChatGPT, Claude, or Gemini thread — we extract ideas for you.',
      action: 'Import chat',
      onClick: () => setShowImport(true),
      primary: false,
    },
    {
      icon: <DI.Spark />,
      title: 'Brainstorm with Copilot',
      desc: 'Talk through your idea and refine it before you file it.',
      action: 'Open Copilot',
      onClick: () => router.push(routes.copilot),
      primary: false,
    },
  ]

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
      <div className="dash-card getting-started-card">
        <div className="getting-started-head">
          <div className="eyebrow-mono">Getting started</div>
          <h2>Your workspace is <em>ready</em>.</h2>
          <p>Pick one path below — most founders start with a single idea and follow the checklist.</p>
        </div>
        <div className="getting-started-grid">
          {steps.map(step => (
            <button
              key={step.title}
              type="button"
              className={`getting-started-step ${step.primary ? 'primary' : ''}`}
              onClick={step.onClick}
            >
              <span className="getting-started-icon">{step.icon}</span>
              <span className="getting-started-title">{step.title}</span>
              <span className="getting-started-desc">{step.desc}</span>
              <span className="getting-started-action">{step.action} →</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
