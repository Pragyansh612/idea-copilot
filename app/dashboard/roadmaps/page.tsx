'use client'
import { useRouter } from 'next/navigation'
import * as DI from '@/components/dashboard/Icons'

export default function RoadmapsPage() {
  const router = useRouter()
  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Roadmaps · all projects</div>
          <h1>Sequenced execution, <em>across every idea</em>.</h1>
          <div className="ph-sub">A unified view of every roadmap you&apos;ve sequenced — phases, dependencies, owners.</div>
        </div>
      </div>
      <div className="empty">
        <div className="em-icon"><DI.Route/></div>
        <h3>Pick an idea to see its roadmap</h3>
        <p>Roadmaps live alongside each idea. Open an idea and switch to the Phases tab.</p>
        <button className="btn-sm solid" onClick={() => router.push('/dashboard/ideas')}><DI.Bulb/> Go to My Ideas</button>
      </div>
    </div>
  )
}