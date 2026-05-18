'use client'
import { useRouter } from 'next/navigation'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'
import type { ReactNode } from 'react'

const formats: { name: string; desc: string; icon: ReactNode; fmt: string; href: string }[] = [
  { name: 'Pitch deck',        desc: '10 slides · hook, wedge, market, plan, roadmap.',        icon: <DI.Doc/>,    fmt: 'PDF · PPTX', href: routes.copilot },
  { name: 'Strategy memo',     desc: 'Long-form positioning brief with reasoning trace.',       icon: <DI.Doc/>,    fmt: 'PDF · DOCX', href: routes.copilot },
  { name: 'Competitor brief',  desc: 'Live competitor table + feature parity + pricing.',       icon: <DI.Radar/>,  fmt: 'PDF · CSV', href: routes.competitors },
  { name: 'Roadmap export',    desc: 'Phased roadmap with dependencies and rationale.',         icon: <DI.Route/>,  fmt: 'PDF · CSV', href: routes.roadmaps },
  { name: 'Market gap report', desc: 'Top gaps across the portfolio with TAM + urgency.',       icon: <DI.Target/>, fmt: 'PDF · JSON', href: routes.gaps },
  { name: 'Idea bundle',       desc: 'Everything for one idea — overview, features, notes.',   icon: <DI.Folder/>, fmt: 'Markdown', href: routes.ideas },
]

const history: { name: string; fmt: string; when: string; size: string }[] = []

export default function ExportsPage() {
  const router = useRouter()

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Exports · share what you&apos;ve built</div>
          <h1>Take it <em>outside</em> the workspace.</h1>
          <div className="ph-sub">Open the related workspace view to build content, then export from Copilot when ready.</div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-sm solid" onClick={() => router.push(routes.copilot)}>
            <DI.Plus/> Ask Copilot to export
          </button>
        </div>
      </div>

      <div className="section-block">
        <div className="section-block-head"><h2>Export <em>templates</em></h2><span className="sb-sub">jump to workspace</span></div>
        <div className="opps">
          {formats.map(f => (
            <div key={f.name} className="opp">
              <div className="op-rank" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</span>
                <span>{f.fmt}</span>
              </div>
              <h4>{f.name}</h4>
              <p>{f.desc}</p>
              <div className="op-meter" style={{ paddingTop: 12 }}>
                <button type="button" className="btn-sm ghost" style={{ height: 28, padding: '0 10px', fontSize: 12 }} onClick={() => router.push(f.href)}>
                  <DI.Export/> Open workspace
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-block">
        <div className="section-block-head"><h2>Recent <em>exports</em></h2><span className="sb-sub">stored 90 days</span></div>
        <div className="card" style={{ padding: 0 }}>
          {history.length === 0 ? (
            <p style={{ padding: 18, color: 'var(--fg-2)', fontSize: 13 }}>No exports yet. Use Copilot to generate a brief, then download from your idea.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
