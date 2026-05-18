'use client'
import * as DI from '@/components/dashboard/Icons'

const COMP_LIST = [
  { n: 'Notable',   c: 'Note-first',        f: '$12M · Series A', emp: '32 ppl', s: 72 },
  { n: 'FieldKit',  c: 'Mobile founders',   f: '$4M · Seed',      emp: '8 ppl',  s: 58 },
  { n: 'Brieflab',  c: 'Validation, agency',f: 'Bootstrapped',    emp: '5 ppl',  s: 81 },
  { n: 'Trace',     c: 'Research-first',    f: '$22M · Series B', emp: '64 ppl', s: 64 },
  { n: 'Foundry09', c: 'PM tooling',        f: '$8M · Series A',  emp: '21 ppl', s: 49 },
  { n: 'Atelier',   c: 'Solo dev studio',   f: 'Seed',            emp: '3 ppl',  s: 38 },
  { n: 'Beacon',    c: 'B2B notes',         f: '$30M · Series B', emp: '90 ppl', s: 56 },
  { n: 'Quill',     c: 'Indie zine',        f: 'Indie',           emp: '2 ppl',  s: 28 },
]

const MAT_ROWS = [
  { name: 'Async voice notes',         n: '—', fk: '—', b: '—', t: '—', you: 'Y' },
  { name: 'Block-verified addresses',  n: '—', fk: '—', b: '—', t: 'P', you: 'Y' },
  { name: 'Ephemeral feed',            n: '—', fk: '—', b: '—', t: '—', you: 'Y' },
  { name: 'Anonymous interactions',    n: 'P', fk: '—', b: '—', t: 'P', you: 'Y' },
  { name: 'Moderation primitives',     n: 'Y', fk: '—', b: '—', t: 'Y', you: 'P' },
  { name: 'Live competitor pull',      n: '—', fk: '—', b: '—', t: '—', you: 'Y' },
]

function Cell({ v }: { v: string }) {
  if (v === 'Y') return <span className="y"><DI.Check/></span>
  if (v === 'P') return <span className="partial">partial</span>
  return <span className="n">—</span>
}

export default function CompetitorsPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Competitor intelligence · live scan</div>
          <h1>The market, <em>mapped</em>.</h1>
          <div className="ph-sub">14 competitors pulled from the public web — funding, positioning, recent shipping, feature parity. Refreshed in real time.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost"><DI.Export/> Export brief</button>
          <button className="btn-sm solid"><DI.Radar/> Run new scan</button>
        </div>
      </div>

      <div className="ci-grid">
        <div className="ci-panel">
          <div className="ci-panel-head">
            <span>Competitor table · 14 found</span>
            <span className="live">live scrape · 3.2s</span>
          </div>
          <div className="ci-table">
            <div className="ci-row h">
              <span/><span>Company</span><span>Funding</span><span>Team</span><span>Threat</span>
              <span style={{ textAlign: 'right' }}>Score</span>
            </div>
            {COMP_LIST.map(c => (
              <div key={c.n} className="ci-row">
                <span className="ci-logo">{c.n[0]}</span>
                <span className="ci-name">{c.n}<span className="sub">{c.c}</span></span>
                <span className="ci-mark">{c.f}</span>
                <span className="ci-mark">{c.emp}</span>
                <div><div className="ci-bar"><div className="fill" style={{ width: `${c.s}%` }}/></div></div>
                <span className="ci-score">{c.s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ci-side">
          <div className="ci-strat">
            <span className="l"><DI.Target/> Strategic position</span>
            <h4>You sit in the <em>unclaimed quadrant</em> — proximity-first, ephemeral, anonymous.</h4>
            <p>Notable owns identity-first broadcast. Trace owns research-first community. Neither has shipped the address-gating layer.</p>
            <div style={{ display: 'flex', gap: 14, paddingTop: 12, borderTop: '1px solid var(--accent-line)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
              <span>defensibility <strong style={{ color: 'var(--fg)', marginLeft: 4 }}>HIGH</strong></span>
              <span>differentiation <strong style={{ color: 'var(--fg)', marginLeft: 4 }}>87%</strong></span>
            </div>
          </div>
          <div className="ci-strat" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
            <span className="l" style={{ color: 'var(--warn)' }}><DI.Bolt/> Watchlist</span>
            <h4>Trace shipped community last week. ≈3 weeks before they map your wedge.</h4>
            <p>Recommended: ship the moderation primitive first to lock proximity-aware trust before they reach it.</p>
          </div>
          <div className="ci-strat" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
            <span className="l" style={{ color: 'var(--fg-3)' }}><DI.Trend/> Market shape</span>
            <h4>14 players. Avg score 56. Top quintile owns 62% of mindshare.</h4>
            <p>The category is mid-density: room for one more well-positioned wedge before saturation.</p>
          </div>
        </div>
      </div>

      <div className="section-block" style={{ marginTop: 28 }}>
        <div className="section-block-head">
          <h2>Feature parity · <em>where you win</em></h2>
          <span className="sb-sub">vs top 4 competitors · you outperform on 4 of 6 features</span>
        </div>
        <div className="feature-mat">
          <div className="fm-grid">
            <div className="fm-cell head" style={{ justifyContent: 'flex-start' }}>Feature</div>
            <div className="fm-cell head">Notable</div>
            <div className="fm-cell head">FieldKit</div>
            <div className="fm-cell head">Brieflab</div>
            <div className="fm-cell head">Trace</div>
            <div className="fm-cell head you">You</div>
            {MAT_ROWS.flatMap(r => [
              <div key={r.name + 'n'} className="fm-cell row-head">{r.name}</div>,
              <div key={r.name + '1'} className="fm-cell"><Cell v={r.n}/></div>,
              <div key={r.name + '2'} className="fm-cell"><Cell v={r.fk}/></div>,
              <div key={r.name + '3'} className="fm-cell"><Cell v={r.b}/></div>,
              <div key={r.name + '4'} className="fm-cell"><Cell v={r.t}/></div>,
              <div key={r.name + '5'} className="fm-cell"><Cell v={r.you}/></div>,
            ])}
          </div>
        </div>
      </div>

      <div className="section-block">
        <div className="section-block-head">
          <h2>Pricing · <em>positioning</em></h2>
          <span className="sb-sub">premium positioning sits at $18–$24 / mo founder tier</span>
        </div>
        <div className="ci-panel" style={{ padding: 0 }}>
          {[
            { n: 'Notable',       m: 'Note-first · creator tools',         pr: '$15',  c: 'free + paid',  note: 'high-volume seats' },
            { n: 'FieldKit',      m: 'Mobile-first · founder',             pr: '$22',  c: 'founder tier', note: 'no team plan' },
            { n: 'Brieflab',      m: 'Agency · validation packs',          pr: '$199', c: 'one-time',     note: 'no recurring' },
            { n: 'Trace',         m: 'Research · multi-seat',              pr: '$28',  c: 'per seat',     note: '5-seat minimum' },
            { n: 'You · Founder', m: 'AI strategist + radar + roadmap',    pr: '$24',  c: 'per founder',  note: 'unlimited ideas' },
          ].map(p => (
            <div key={p.n} className="pricing-row">
              <span className="ci-logo">{p.n[0]}</span>
              <span><div className="nm">{p.n}</div><div className="meta">{p.m}</div></span>
              <span className="pr">{p.pr} <small>/ {p.c}</small></span>
              <span className="meta">{p.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}