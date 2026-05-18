'use client'
import * as DI from '@/components/dashboard/Icons'
import type { ReactNode } from 'react'

const formats: { name: string; desc: string; icon: ReactNode; fmt: string }[] = [
  { name: 'Pitch deck',        desc: '10 slides · hook, wedge, market, plan, roadmap.',        icon: <DI.Doc/>,    fmt: 'PDF · PPTX' },
  { name: 'Strategy memo',     desc: 'Long-form positioning brief with reasoning trace.',       icon: <DI.Doc/>,    fmt: 'PDF · DOCX' },
  { name: 'Competitor brief',  desc: 'Live competitor table + feature parity + pricing.',       icon: <DI.Radar/>,  fmt: 'PDF · CSV' },
  { name: 'Roadmap export',    desc: 'Phased roadmap with dependencies and rationale.',         icon: <DI.Route/>,  fmt: 'PDF · CSV · Linear' },
  { name: 'Market gap report', desc: 'Top gaps across the portfolio with TAM + urgency.',       icon: <DI.Target/>, fmt: 'PDF · JSON' },
  { name: 'Idea bundle',       desc: 'Everything for one idea — overview, features, notes.',   icon: <DI.Folder/>, fmt: 'Notion · Markdown' },
]

const history = [
  { name: 'Hyper-local audio · pitch deck',    fmt: 'PDF',  when: '2h ago',    size: '1.4 MB' },
  { name: 'Competitor brief · weekly',         fmt: 'CSV',  when: 'yesterday', size: '82 KB' },
  { name: 'Strategy memo · v3 positioning',    fmt: 'DOCX', when: '3d ago',    size: '240 KB' },
  { name: 'Roadmap · Q3 phases',               fmt: 'PDF',  when: '1w ago',    size: '620 KB' },
]

export default function ExportsPage() {
  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Exports · share what you&apos;ve built</div>
          <h1>Take it <em>outside</em> the workspace.</h1>
          <div className="ph-sub">Generated reports, pitches and briefs — refreshed automatically from the latest state of each idea.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm solid"><DI.Plus/> Custom export</button>
        </div>
      </div>

      <div className="section-block">
        <div className="section-block-head"><h2>Export <em>templates</em></h2><span className="sb-sub">6 ready · auto-refreshed</span></div>
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
                <button className="btn-sm ghost" style={{ height: 28, padding: '0 10px', fontSize: 12 }}><DI.Export/> Generate</button>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>est. 8s</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-block">
        <div className="section-block-head"><h2>Recent <em>exports</em></h2><span className="sb-sub">stored 90 days</span></div>
        <div className="card" style={{ padding: 0 }}>
          {history.map((h, i) => (
            <div key={i} className="pricing-row">
              <span className="ci-logo"><DI.Export/></span>
              <span><div className="nm">{h.name}</div><div className="meta">{h.fmt} · {h.size}</div></span>
              <span className="meta" style={{ fontFamily: 'var(--font-mono)' }}>{h.when}</span>
              <button className="btn-sm ghost" style={{ height: 28, padding: '0 12px', fontSize: 12 }}><DI.Export/> Download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}