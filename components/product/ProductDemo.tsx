'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MockDashboard = dynamic(() => import('@/components/mockups/MockDashboard'), { ssr: false })
const MockCompetitors = dynamic(() => import('@/components/mockups/MockCompetitors'), { ssr: false })
const MockChatMini = dynamic(() => import('@/components/mockups/MockChatMini'), { ssr: false })
const MockRoadmap = dynamic(() => import('@/components/mockups/MockRoadmap'), { ssr: false })

export type ProductDemoVariant = 'dashboard' | 'copilot' | 'competitors' | 'roadmaps'

const SCENES: Record<ProductDemoVariant, { label: string; hint: string }[]> = {
  dashboard: [
    { label: 'Overview', hint: 'Stats & viability at a glance' },
    { label: 'Ideas', hint: 'Every project in one sidebar' },
    { label: 'AI refine', hint: 'Structured refinement steps' },
  ],
  copilot: [
    { label: 'Ask', hint: 'Natural-language strategy' },
    { label: 'Context', hint: 'Tied to your active idea' },
    { label: 'Answer', hint: 'Actionable wedge & gaps' },
  ],
  competitors: [
    { label: 'Radar', hint: 'Live competitor table' },
    { label: 'Scores', hint: 'Confidence per player' },
    { label: 'Gaps', hint: 'Pair with market analysis' },
  ],
  roadmaps: [
    { label: 'Phases', hint: 'Sequenced execution' },
    { label: 'Progress', hint: 'Track completion' },
    { label: 'Ship', hint: 'From idea to launch' },
  ],
}

function DemoMock({ variant }: { variant: ProductDemoVariant }) {
  switch (variant) {
    case 'dashboard':
      return <MockDashboard />
    case 'copilot':
      return <MockChatMini />
    case 'competitors':
      return <MockCompetitors />
    case 'roadmaps':
      return <MockRoadmap />
  }
}

export default function ProductDemo({ variant }: { variant: ProductDemoVariant }) {
  const scenes = SCENES[variant]
  const [scene, setScene] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setScene(s => (s + 1) % scenes.length)
      setTick(t => t + 1)
    }, 4200)
    return () => clearInterval(id)
  }, [scenes.length])

  return (
    <div className="product-demo">
      <div className="product-demo-glow" aria-hidden />
      <div className="product-demo-chrome">
        <span className="product-demo-live">
          <span className="product-demo-pulse" /> Live preview
        </span>
        <div className="product-demo-scenes">
          {scenes.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={`product-demo-scene-btn ${i === scene ? 'active' : ''}`}
              onClick={() => setScene(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="product-demo-viewport" key={`${variant}-${scene}-${tick}`}>
        <div className="product-demo-slide">
          <div className="product-demo-frame">
            <DemoMock variant={variant} />
          </div>
          <p className="product-demo-hint">{scenes[scene].hint}</p>
        </div>
      </div>

      <div className="product-demo-progress">
        {scenes.map((_, i) => (
          <span key={i} className={`product-demo-dot ${i === scene ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  )
}
