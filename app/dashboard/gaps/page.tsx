'use client'
import { useRouter } from 'next/navigation'
import * as DI from '@/components/dashboard/Icons'
import React from 'react'

const GAP_OPPS = [
  { rank: '01 · HIGH SIGNAL', title: <>No competitor combines <em>async voice</em> with neighborhood-level moderation.</>, desc: 'Established players index on broadcast and identity. Wedge: trust + ephemerality, mapped to dense urban beta markets.', conf: 92, tam: '$2.4B', urgency: 'HIGH' },
  { rank: '02',  title: <>Apartment-block <em>organizers</em> are 4× more responsive than residents.</>, desc: 'Beta should target organizers, not residents. Land-and-expand from one organizer per building.', conf: 86, tam: '$840M', urgency: 'MED' },
  { rank: '03',  title: 'AI-drafted grant packets for indie researchers — no incumbent.', desc: 'Long-tail academia. Manual workflow today, perfect for AI auto-fill. $1k–$5k per indie applicant willing to pay.', conf: 78, tam: '$340M', urgency: 'LOW' },
  { rank: '04',  title: <>Webhook <em>digest</em> tooling — a quiet API for the Slack-fatigued.</>, desc: 'Devs drown in webhook noise. Digest layer routes the right alerts to the right humans on the right cadence.', conf: 71, tam: '$520M', urgency: 'MED' },
  { rank: '05',  title: 'Field-note CRM for in-person sellers — no field-first incumbent.', desc: 'Reps record after a meeting; AI fills in the CRM. Verticals: solar, home services.', conf: 64, tam: '$1.1B', urgency: 'MED' },
  { rank: '06',  title: 'Permit Copilot for small contractors.', desc: 'Submits, tracks and chases municipal permits. AI fills forms; humans approve.', conf: 58, tam: '$280M', urgency: 'LOW' },
]

const dots = [
  { x: 18, y: 26, name: 'Notable' }, { x: 28, y: 38, name: 'Trace' }, { x: 22, y: 64, name: 'Beacon' },
  { x: 38, y: 18, name: 'Notable+' }, { x: 12, y: 80, name: 'FieldKit' }, { x: 50, y: 70, name: 'Foundry09' },
  { x: 30, y: 86, name: 'Atelier' }, { x: 82, y: 75, name: 'You', you: true },
]

export default function GapsPage() {
  const router = useRouter()

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Market gaps · live across the workspace</div>
          <h1>The <em>white space</em> in your category.</h1>
          <div className="ph-sub">Auto-detected from your ideas + competitor scans. Sorted by confidence × urgency. Each gap is reasoned, not generated.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost"><DI.Export/> Export gaps</button>
          <button className="btn-sm solid"><DI.Spark/> Generate fresh</button>
        </div>
      </div>

      <div className="gaps-hero">
        <div className="gap-big">
          <span className="gb-label"><DI.Target/> Top gap · across your portfolio</span>
          <h2>The <em>wedge</em>: trust + ephemerality, in a 3-block radius.</h2>
          <p>No competitor combines async voice with neighborhood-level moderation. Established players are stuck on broadcast and identity — the unclaimed quadrant is proximity-first, anonymous, ephemeral.</p>
          <div className="gb-meta">
            <span>confidence <strong>92%</strong></span>
            <span>TAM <strong>$2.4B</strong></span>
            <span>urgency <strong style={{ color: 'var(--warn)' }}>HIGH</strong></span>
            <span style={{ marginLeft: 'auto' }}>Hyper-local audio</span>
          </div>
          <button className="btn-sm solid gb-cta" onClick={() => router.push('/dashboard/ideas/Hyper-local%20audio')}>
            Open in idea <DI.Arrow/>
          </button>
        </div>

        <div className="gap-map-big">
          <div className="gmb-head">
            <span>Positioning map · trust ↔ identity</span>
            <span className="h-r">white space detected</span>
          </div>
          <div className="gmb-body">
            <div style={{ position: 'absolute', inset: 22, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)', backgroundSize: '25% 25%' }}/>
              <span style={{ position: 'absolute', top: 8, left: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>↑ ephemeral</span>
              <span style={{ position: 'absolute', bottom: 8, left: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>identity-first</span>
              <span style={{ position: 'absolute', bottom: 8, right: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>proximity-first →</span>
              <div style={{ position: 'absolute', left: '60%', top: '55%', right: '8%', bottom: '10%', border: '1px dashed var(--accent-line)', borderRadius: 12, background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
                <span style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--bg-2)', padding: '2px 8px', border: '1px solid var(--accent-line)', borderRadius: 999, whiteSpace: 'nowrap' }}>White space</span>
              </div>
              {dots.map((d, i) => (
                <React.Fragment key={i}>
                  <span style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -160%)', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: d.you ? 'var(--accent)' : 'var(--fg-3)', fontWeight: d.you ? 500 : 400, whiteSpace: 'nowrap' }}>{d.name}</span>
                  <span style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, width: d.you ? 14 : 10, height: d.you ? 14 : 10, transform: 'translate(-50%, -50%)', borderRadius: '50%', background: d.you ? 'var(--accent)' : 'var(--fg-2)', border: '2px solid var(--bg-2)', boxShadow: d.you ? '0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent)' : 'none' }}/>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="section-block">
        <div className="section-block-head">
          <h2>Opportunity <em>queue</em></h2>
          <span className="sb-sub">5 lower-signal gaps · refresh hourly</span>
        </div>
        <div className="opps">
          {GAP_OPPS.slice(1).map(o => (
            <div key={o.rank} className="opp">
              <div className="op-rank">{o.rank}</div>
              <h4>{o.title}</h4>
              <p>{o.desc}</p>
              <div className="op-meter">
                <span className="ring">
                  <span className="arc" style={{ '--p': `${o.conf}%` } as React.CSSProperties}/>
                  conf<b>{o.conf}%</b>
                </span>
                <span>TAM<b>{o.tam}</b></span>
                <span>urgency<b style={{ color: o.urgency === 'HIGH' ? 'var(--warn)' : o.urgency === 'MED' ? 'var(--accent)' : 'var(--fg-3)' }}>{o.urgency}</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}