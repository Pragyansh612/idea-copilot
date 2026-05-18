'use client'
import { useState, useEffect, ReactNode } from 'react'
import { IconCapture, IconSpark, IconRadar, IconTarget, IconStack, IconRoute } from './Icons'

function PreviewCapture() {
  return (
    <>
      <div className="pv-chrome">
        <div className="dots"><span/><span/><span/></div>
        <span style={{ marginLeft: 6 }}>composer · new idea</span>
      </div>
      <div className="pv-inner">
        <div className="cap-input">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--fg-3)', textTransform: 'uppercase' }}>The spark</div>
          <div className="placeholder">
            &ldquo;Hyperlocal audio for blocks — like a neighborhood radio but async, anonymous, and only within a 3-block radius<span className="caret"/>
          </div>
          <div className="cap-chips">
            <span className="cap-chip">
              <svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="2" fill="currentColor"/><path d="M2 6h2M8 6h2M6 2v2M6 8v2" stroke="currentColor" strokeWidth="1"/></svg>
              voice memo · 2:14
            </span>
            <span className="cap-chip">
              <svg viewBox="0 0 12 12" fill="none"><path d="M5 7 7 5M4 8 2 6a2 2 0 0 1 0-3 2 2 0 0 1 3 0L7 5M8 4l2 2a2 2 0 0 1 0 3 2 2 0 0 1-3 0L5 7" stroke="currentColor" strokeWidth="1"/></svg>
              ref.link · twitter.com/…
            </span>
            <span className="cap-chip">
              <svg viewBox="0 0 12 12" fill="none"><rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1"/><path d="M4 5h4M4 7h2" stroke="currentColor" strokeWidth="1"/></svg>
              notion · drafts /22
            </span>
          </div>
        </div>
        <div className="cap-grid">
          <div className="cap-tile"><span className="label">tagged</span><span className="val">Consumer · Social · Voice</span></div>
          <div className="cap-tile"><span className="label">filed under</span><span className="val">Hyperlocal audio</span></div>
          <div className="cap-tile"><span className="label">next step</span><span className="val">AI refinement →</span></div>
        </div>
      </div>
    </>
  )
}

function PreviewRefine() {
  return (
    <>
      <div className="pv-chrome">
        <div className="dots"><span/><span/><span/></div>
        <span style={{ marginLeft: 6 }}>refinement · positioning</span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>v3 / 5</span>
      </div>
      <div className="pv-inner">
        <div className="refine-grid">
          <div className="refine-panel before">
            <span className="label">Raw idea</span>
            <p className="raw">A hyperlocal audio app for neighborhoods. Like a radio but you can post voice notes and only people nearby can hear them. Maybe like Snapchat but for blocks.</p>
          </div>
          <div className="refine-arrow">
            <svg viewBox="0 0 16 16" width="22" height="22" fill="none"><path d="M3 8h10M13 8l-4-4M13 8l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="refine-panel after">
            <span className="label">Refined positioning</span>
            <div className="bullet"><b>HOOK</b><span>&ldquo;Snapchat for blocks&rdquo;</span></div>
            <div className="bullet"><b>WEDGE</b><span>Async voice + ephemerality, 3-block radius</span></div>
            <div className="bullet"><b>BUYER</b><span>Apartment-block organizers, dense urban</span></div>
            <div className="bullet"><b>MOAT</b><span>Trust from proximity, not identity</span></div>
          </div>
        </div>
      </div>
    </>
  )
}

function PreviewDiscover() {
  const comps = [
    { name: 'Notable',   meta: 'Notes · $12M', pill: 'BROADCAST' },
    { name: 'FieldKit',  meta: 'Mobile · $4M', pill: 'TEXT' },
    { name: 'Brieflab',  meta: 'Validation',   pill: 'AGENCY' },
    { name: 'Trace',     meta: 'Research · $22M', pill: 'RESEARCH' },
    { name: 'Foundry09', meta: 'PM · $8M',     pill: 'TOOLING' },
    { name: 'Atelier',   meta: 'Solo · seed',  pill: 'STUDIO' },
    { name: 'Beacon',    meta: 'B2B · $30M',   pill: 'PLATFORM' },
    { name: 'Quill',     meta: 'Indie',        pill: 'ZINE' },
  ]
  return (
    <>
      <div className="pv-chrome">
        <div className="dots"><span/><span/><span/></div>
        <span style={{ marginLeft: 6 }}>competitor scan</span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>14 found · 3.2s</span>
      </div>
      <div className="pv-inner">
        <span className="disc-status"><span className="ping"/>Scanning public web</span>
        <div className="disc-grid">
          {comps.map((c) => (
            <div key={c.name} className="disc-card">
              <span className="pill">{c.pill}</span>
              <span className="name">{c.name}</span>
              <span className="meta">{c.meta}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function PreviewGapMap() {
  const dots = [
    { x: 18, y: 24, name: 'Notable' },
    { x: 28, y: 38, name: 'Trace' },
    { x: 14, y: 60, name: 'FieldKit' },
    { x: 38, y: 18, name: 'Beacon' },
    { x: 46, y: 70, name: 'Quill' },
    { x: 30, y: 84, name: 'Atelier' },
    { x: 86, y: 78, name: 'You', you: true },
  ]
  return (
    <>
      <div className="pv-chrome">
        <div className="dots"><span/><span/><span/></div>
        <span style={{ marginLeft: 6 }}>positioning map</span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>gap detected</span>
      </div>
      <div className="pv-inner">
        <div className="gap-map">
          <span className="gm-axis y-t">↑ ephemeral</span>
          <span className="gm-axis x-l">identity-first</span>
          <span className="gm-axis x-r">proximity-first →</span>
          <div className="gm-region" style={{ left: '62%', top: '55%', right: '8%', bottom: '10%' }}>
            <span className="gm-tag">White space</span>
          </div>
          {dots.map((d, i) => (
            <span key={i}>
              <span className={`gm-label ${d.you ? 'you' : ''}`} style={{ left: `${d.x}%`, top: `${d.y}%` }}>{d.name}</span>
              <span className={`gm-dot ${d.you ? 'you' : ''}`} style={{ left: `${d.x}%`, top: `${d.y}%` }} />
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

function PreviewPlan() {
  const rows = [
    { p: 'P0', label: 'Async voice notes (≤60s)',       cost: '2w' },
    { p: 'P0', label: 'Block-verified address gating',  cost: '1w' },
    { p: 'P0', label: 'Ephemeral 24-hour feed',         cost: '1w' },
    { p: 'P1', label: 'Anonymous reactions + reports',  cost: '3d' },
    { p: 'P2', label: 'Moderation primitives · API',    cost: 'later' },
  ]
  return (
    <>
      <div className="pv-chrome">
        <div className="dots"><span/><span/><span/></div>
        <span style={{ marginLeft: 6 }}>MVP scope · v0.1</span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>12 cut, 5 kept</span>
      </div>
      <div className="pv-inner">
        <div className="plan-head">
          <span className="count">5 features</span>
          <span>scoped against wedge · auto-prioritized</span>
        </div>
        <div className="plan-rows">
          {rows.map((r, i) => (
            <div key={i} className="plan-row">
              <span className={`prio ${r.p.toLowerCase()}`}>{r.p}</span>
              <span className="label">{r.label}</span>
              <span className="cost">{r.cost}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function PreviewSequence() {
  const phases = [
    { name: 'Validate',  start: 0,   end: 1.5, kind: '' },
    { name: 'Prototype', start: 1,   end: 3,   kind: '' },
    { name: 'Beta',      start: 2.8, end: 5,   kind: 'muted' },
    { name: 'Studio',    start: 4.8, end: 6.5, kind: 'outline' },
    { name: 'API',       start: 6.2, end: 8,   kind: 'outline' },
  ]
  const cols = 8
  return (
    <>
      <div className="pv-chrome">
        <div className="dots"><span/><span/><span/></div>
        <span style={{ marginLeft: 6 }}>roadmap · 8 weeks</span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>2 dependencies</span>
      </div>
      <div className="pv-inner">
        <div className="seq-track">
          <div className="seq-axis">
            <span/>
            {Array.from({ length: cols }).map((_, i) => <span key={i}>W{i + 1}</span>)}
          </div>
          {phases.map((p) => (
            <div key={p.name} className="seq-row">
              <span className="seq-label">{p.name}</span>
              <div className="seq-bar-wrap">
                <div
                  className={`seq-bar ${p.kind}`}
                  style={{
                    left: `${(p.start / cols) * 100}%`,
                    width: `${((p.end - p.start) / cols) * 100}%`,
                  }}
                >
                  {p.name === 'Validate' ? '12 interviews' : p.name === 'Prototype' ? 'voice MVP' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

interface Step {
  num: string
  title: string
  glyph: ReactNode
  short: string
  headline: ReactNode
  desc: string
  stage: string
  preview: ReactNode
}

const WORKFLOW_STEPS: Step[] = [
  {
    num: '01', title: 'Capture', glyph: <IconCapture />,
    short: 'Drop a sentence, voice memo, or link.',
    headline: <>Drop the spark.<br />We&apos;ll <em>hold the rest</em>.</>,
    desc: 'Type a sentence. Record a voice memo. Paste a tweet. The Copilot tags, transcribes and files it into the right idea — without you ever opening a sidebar.',
    stage: 'ideas / hyperlocal-audio.md · drafted 2m ago',
    preview: <PreviewCapture />,
  },
  {
    num: '02', title: 'Refine', glyph: <IconSpark />,
    short: 'AI sharpens positioning and the wedge.',
    headline: <>Vague idea → <em>sharpened</em> positioning.</>,
    desc: 'The Copilot rewrites your raw idea into a wedge, a buyer, and a positioning hook. Five variants, scored on memorability and category fit.',
    stage: 'refining · positioning · v3 of 5',
    preview: <PreviewRefine />,
  },
  {
    num: '03', title: 'Discover', glyph: <IconRadar />,
    short: 'Auto-pull competitors across the web.',
    headline: <>The market, <em>pulled</em> in real time.</>,
    desc: 'Once the wedge is locked, IdeaCopilot scans the web — funding rounds, App Store listings, product pages — and parses positioning into a comparable shape.',
    stage: 'scanning · 14 competitors found · 3.2s',
    preview: <PreviewDiscover />,
  },
  {
    num: '04', title: 'Map gaps', glyph: <IconTarget />,
    short: 'Find the white space in the market.',
    headline: <>Plot the field. <em>Find</em> your wedge.</>,
    desc: 'Every competitor placed on a two-axis map. The white space gets highlighted — and the Copilot reasons about why it\'s defensible, not just empty.',
    stage: 'positioning · trust ↔ identity vs broadcast ↔ ephemeral',
    preview: <PreviewGapMap />,
  },
  {
    num: '05', title: 'Plan', glyph: <IconStack />,
    short: 'Feature scope and MVP, generated.',
    headline: <>From wedge to <em>shippable</em> scope.</>,
    desc: 'P0 → P2 features generated from your positioning. Each is sized, scored against the wedge, and tied to a measurable outcome.',
    stage: 'MVP v0.1 · 12 features · cut: 5 · scope: P0',
    preview: <PreviewPlan />,
  },
  {
    num: '06', title: 'Sequence', glyph: <IconRoute />,
    short: 'Roadmap with dependencies & rationale.',
    headline: <>A sequence, <em>not</em> a checklist.</>,
    desc: 'Phases ordered by dependency, with rationale baked in. You can ship the next thing, not just the most exciting thing.',
    stage: 'roadmap · Q3 · 5 phases · 2 dependencies',
    preview: <PreviewSequence />,
  },
]

export default function WorkflowSection() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => setActive(a => (a + 1) % WORKFLOW_STEPS.length), 4500)
    return () => clearTimeout(t)
  }, [active, playing])

  const step = WORKFLOW_STEPS[active]
  const progress = `${(active / (WORKFLOW_STEPS.length - 1)) * 100}%`

  return (
    <section className="section" id="workflow">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">02 — The workflow</span>
          <h2>From a sentence to a <em>strategy</em>,<br />in one intelligent surface.</h2>
          <p>Six stages, one loop. The Copilot moves with you — capturing, sharpening, validating, planning, sequencing. Click any stage, or watch it play.</p>
        </div>

        <div className="stepper">
          <div className="stepper-rail" style={{ '--rail-progress': progress } as React.CSSProperties}>
            {WORKFLOW_STEPS.map((s, i) => (
              <button
                key={s.num}
                className={`step-item ${i === active ? 'is-active' : ''} ${i < active ? 'is-done' : ''}`}
                onClick={() => { setActive(i); setPlaying(false) }}
              >
                <span className="si-bullet"><span className="si-glyph">{s.glyph}</span></span>
                <span className="si-body">
                  <span className="si-row">
                    <span className="num">{s.num}</span>
                    <span>{s.title}</span>
                  </span>
                  <span className="si-desc">{s.short}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="stepper-stage">
            <div className="stage-head">
              <span className="stage-meta">
                <span className="stage-counter">{step.num} / 06</span>
                <span>·</span>
                <span>{step.stage}</span>
              </span>
              <button className={`play-btn ${playing ? '' : 'paused'}`} onClick={() => setPlaying(p => !p)}>
                <span className="glyph" />
                {playing ? 'Auto-play' : 'Paused'}
              </button>
            </div>
            <div className="stage-body">
              <div className="stage-title">
                <h3>{step.headline}</h3>
                <p>{step.desc}</p>
              </div>
              <div className="stage-canvas">
                <div className="preview" key={active}>
                  {step.preview}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}