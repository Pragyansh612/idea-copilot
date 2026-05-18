'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import * as DI from '@/components/dashboard/Icons'

const FEATURES = [
  { p: 'P0', label: 'Async voice notes (≤60s)',       done: true,  est: '2w' },
  { p: 'P0', label: 'Block-verified address gating',  done: true,  est: '1w' },
  { p: 'P0', label: 'Ephemeral 24-hour feed',         done: false, est: '1w' },
  { p: 'P0', label: 'Anonymous reactions + reports',  done: false, est: '3d' },
  { p: 'P1', label: 'Moderation primitives',          done: false, est: '2w' },
  { p: 'P1', label: 'Onboarding · organizer-first',   done: false, est: '1w' },
  { p: 'P1', label: 'Quiet hours · per-block',        done: false, est: '3d' },
  { p: 'P2', label: 'Voice-to-text caption',          done: false, est: 'later' },
  { p: 'P2', label: 'Audio reactions (laughs/claps)', done: false, est: 'later' },
]

const PHASES = [
  { name: 'Validate',      when: 'Week 1–2',  state: 'done',   desc: '12 interviews with apartment-block organizers across 4 cities.',            meta: { Interviews: 12, Cities: 4 } },
  { name: 'Prototype',     when: 'Week 3–5',  state: 'done',   desc: 'Voice memo MVP in a 3-block radius. Internal alpha with 8 testers.',        meta: { Testers: 8, Crashes: 0 } },
  { name: 'Closed beta',   when: 'Week 6–10', state: 'active', desc: '200 users · 4 neighborhoods. Organizer-led recruitment.',                   meta: { Users: 200, Retention: '62%' } },
  { name: 'Studio launch', when: 'Week 11–14',state: 'next',   desc: 'Self-serve onboarding for new buildings. Founder-led GTM in 3 cities.',     meta: { Target: '1k users' } },
  { name: 'Moderation API',when: 'Q1',        state: 'next',   desc: 'Trust + safety primitives exposed as a small API for adjacent products.',   meta: { Market: '$300M' } },
]

const SUGGESTIONS = [
  { label: 'POSITIONING · v3',   body: <>&ldquo;Snapchat for blocks&rdquo;. Memorability 8.4/10. Lowest category confusion across 5 tested variants.</> },
  { label: 'WEDGE · ship first', body: <>Block-verified address gating is the moat. Ship it before async voice — competitors can&apos;t fake the proximity layer.</> },
  { label: 'RISK · move fast',   body: <>Trace shipped a community feature last week. ≈3 weeks of runway before the gap narrows.</> },
]

export default function IdeaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ideaId = decodeURIComponent(params.id as string)
  const [tab, setTab] = useState('features')
  const [feats, setFeats] = useState(FEATURES)

  const toggle = (idx: number) => setFeats(prev => prev.map((f, i) => i === idx ? { ...f, done: !f.done } : f))
  const completed = feats.filter(f => f.done).length

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Idea · {ideaId}</div>
          <h1><em>Hyper-local</em> audio for neighborhoods</h1>
          <div className="ph-sub">Async voice notes in a 3-block radius. Trust from proximity, not identity. Snapchat for blocks.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost" onClick={() => router.push('/dashboard/ideas')}>
            <DI.CaretRight style={{ transform: 'rotate(180deg)' }}/> Back
          </button>
          <button className="btn-sm ghost"><DI.Export/> Export</button>
          <button className="btn-sm solid" onClick={() => router.push('/dashboard/copilot')}>
            <DI.Spark/> Ask Copilot
          </button>
        </div>
      </div>

      <div className="idea-detail">
        {/* LEFT */}
        <div className="id-left">
          <div className="id-hero">
            <span className="id-tag">Hot wedge · active</span>
            <h2><em>Snapchat</em> for blocks.</h2>
            <p>Async voice + ephemerality. Trust from proximity, not identity. Dense urban beta markets, apartment-block organizers as the first buyer.</p>
            <div className="id-scorebar">
              <div className="label"><span>Viability</span><span>87 / 100</span></div>
              <div className="bar"><div className="fill" style={{ width: '87%' }}/></div>
            </div>
            <div className="id-scorebar">
              <div className="label"><span>Defensibility</span><span>74 / 100</span></div>
              <div className="bar"><div className="fill" style={{ width: '74%' }}/></div>
            </div>
            <div className="id-scorebar warn">
              <div className="label"><span>Time pressure</span><span>HIGH</span></div>
              <div className="bar"><div className="fill" style={{ width: '82%' }}/></div>
            </div>
          </div>

          <div className="card">
            <div className="id-meta">
              <div className="row"><span className="key">Status</span><span className="val pill accent">Active</span></div>
              <div className="row"><span className="key">Stage</span><span className="val">Closed beta</span></div>
              <div className="row"><span className="key">Owner</span><span className="val">Alex Brennan</span></div>
              <div className="row"><span className="key">Category</span><span className="val">Consumer · Social · Voice</span></div>
              <div className="row"><span className="key">Created</span><span className="val">14 Apr 2026</span></div>
              <div className="row"><span className="key">Last refined</span><span className="val">2 minutes ago</span></div>
              <div className="row"><span className="key">Reminder</span><span className="val pill good">Friday · review</span></div>
            </div>
          </div>

          <div className="card">
            <div className="eyebrow-mono" style={{ marginBottom: 12 }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Consumer','Voice','Social','Ephemeral','Hyperlocal','MVP-ready'].map(t => (
                <span key={t} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  padding: '3px 9px', borderRadius: 999,
                  background: 'color-mix(in srgb, var(--fg) 4%, transparent)',
                  border: '1px solid var(--line-2)',
                  color: 'var(--fg-2)', letterSpacing: 0.02,
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="id-center">
          <div className="id-tabs">
            {[
              { id: 'features', label: `Features`, count: `${completed}/${feats.length}` },
              { id: 'phases',   label: 'Phases',   count: '5' },
              { id: 'ai',       label: 'AI suggestions', count: '3' },
              { id: 'comp',     label: 'Competitors', count: '14' },
              { id: 'notes',    label: 'Notes', count: null },
            ].map(t => (
              <button key={t.id} className={`id-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label} {t.count && <span className="count">{t.count}</span>}
              </button>
            ))}
          </div>

          {tab === 'features' && (
            <div className="id-panel">
              <div className="id-panel-head">
                <h3>Feature scope <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11, marginLeft: 8 }}>{completed} of {feats.length} done · {Math.round(completed / feats.length * 100)}%</span></h3>
                <div className="mini-actions">
                  <span className="ma">add ↵</span>
                  <span className="ma"><DI.Filter/></span>
                  <span className="ma"><DI.Dots/></span>
                </div>
              </div>
              <div className="feat-list">
                {feats.map((f, i) => (
                  <div key={i} className={`feat-item ${f.done ? 'done' : ''}`} onClick={() => toggle(i)}>
                    <span className="ck">{f.done && <DI.Check/>}</span>
                    <span className={`prio ${f.p.toLowerCase()}`}>{f.p}</span>
                    <span className="label">{f.label}</span>
                    <span className="meta-est">{f.est}</span>
                    <span className="meta-owner"/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'phases' && (
            <div className="id-panel">
              <div className="id-panel-head">
                <h3>Roadmap · phased</h3>
                <div className="mini-actions">
                  <span className="ma">add phase ↵</span>
                  <span className="ma">re-sequence</span>
                </div>
              </div>
              <div className="phases">
                {PHASES.map((p, i) => (
                  <div key={p.name} className={`phase ${p.state}`}>
                    <span className="p-dot">{p.state === 'done' ? <DI.Check/> : String(i + 1).padStart(2, '0')}</span>
                    <div className="p-body">
                      <div className="p-row"><span>{p.name}</span><span className="when">{p.when}</span></div>
                      <div className="p-desc">{p.desc}</div>
                      <div className="p-meta">
                        {Object.entries(p.meta).map(([k, v]) => <span key={k}>{k} <b>{v}</b></span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="id-panel">
              <div className="id-panel-head">
                <h3>Copilot suggestions</h3>
                <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>refreshed 12s ago</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SUGGESTIONS.map((s, i) => (
                  <div key={i} className="sug-card">
                    <span className="s-label"><DI.Sparkles/> {s.label}</span>
                    <div className="s-body">{s.body}</div>
                    <div className="s-actions">
                      <button className="s-act accept"><DI.Check/> Accept</button>
                      <button className="s-act">Dismiss</button>
                      <button className="s-act"><DI.Spark/> Ask Copilot to explain</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'comp' && (
            <div className="id-panel">
              <div className="id-panel-head">
                <h3>Competitors · 14 mapped</h3>
                <span style={{ color: 'var(--good)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>● live scrape</span>
              </div>
              {[
                { n: 'Notable',   m: 'Note-first · $12M Series A',  s: 72 },
                { n: 'FieldKit',  m: 'Mobile founders · $4M Seed',  s: 58 },
                { n: 'Brieflab',  m: 'Validation · bootstrapped',   s: 81 },
                { n: 'Trace',     m: 'Research-first · $22M',       s: 64 },
                { n: 'Foundry09', m: 'PM tooling · $8M Series A',   s: 49 },
              ].map(c => (
                <div key={c.n} className="pricing-row">
                  <span className="ci-logo">{c.n[0]}</span>
                  <span><div className="nm">{c.n}</div><div className="meta">{c.m}</div></span>
                  <div style={{ width: 80 }}>
                    <div className="ci-bar"><div className="fill" style={{ width: `${c.s}%` }}/></div>
                  </div>
                  <span className="pr">{c.s}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'notes' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Workspace notes</h3></div>
              <div className="empty" style={{ padding: '40px 20px', border: 0 }}>
                <div className="em-icon"><DI.Doc/></div>
                <h3>Drop a thought</h3>
                <p>Voice memos, scratch notes, links — the Copilot files them into the right idea.</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="id-right">
          <div className="id-right-card">
            <div className="r-head"><DI.Target/> Market gap · live</div>
            <div className="mini-insight">
              <div className="mi-title">Async voice + neighborhood moderation — no competitor owns this.</div>
              <div className="mi-meta">signal HIGH · 92% conf</div>
            </div>
            <div className="mini-insight">
              <div className="mi-title">Apartment-block organizers index 4× higher on early-adopter signals.</div>
              <div className="mi-meta">lift 4.0× · effort low</div>
            </div>
          </div>
          <div className="id-right-card">
            <div className="r-head"><DI.Radar/> Competitor moves</div>
            <div className="mini-insight">
              <div className="mi-title">Trace shipped a community feature in their last release.</div>
              <div className="mi-meta">3w runway · ship moderation first</div>
            </div>
            <div className="mini-insight">
              <div className="mi-title">Notable expanded into voice — but still identity-first.</div>
              <div className="mi-meta">3d ago · low overlap</div>
            </div>
          </div>
          <div className="id-right-card">
            <div className="r-head"><DI.Bolt/> Quick wins</div>
            <div className="mini-insight">
              <div className="mi-title">Run an organizer-led referral loop in beta — 4× expected lift.</div>
              <div className="mi-meta">effort low · est +280 users</div>
            </div>
            <div className="mini-insight">
              <div className="mi-title">Ship a Tuesday digest of best block voices.</div>
              <div className="mi-meta">retention +12pp expected</div>
            </div>
          </div>
          <div className="id-right-card" style={{ background: 'linear-gradient(160deg, var(--accent-soft), transparent 80%) var(--surface)', borderColor: 'var(--accent-line)' }}>
            <div className="r-head"><DI.Spark/> Summary · this week</div>
            <p style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.55, letterSpacing: '-0.005em' }}>
              The wedge is tightening — competitors are circling. Ship the moderation primitive next, lock the organizer-first beta, and re-test positioning at week 8.
            </p>
            <button className="btn-sm solid" style={{ height: 30, padding: '0 12px' }} onClick={() => router.push('/dashboard/copilot')}>
              Open in Copilot <DI.Arrow/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}