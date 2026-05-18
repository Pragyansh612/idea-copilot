import { IconSpark, IconRadar, IconRoute, IconTarget, IconStack, IconCapture } from './Icons'

export default function WhySection() {
  return (
    <section className="section" id="why">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">06 — Why it&apos;s different</span>
          <h2>Not a note-taking app.<br />The <em>operating system</em> for founders.</h2>
          <p>Notes, research, strategy, planning — collapsed into one workspace that reasons about your idea the way you should be reasoning about it.</p>
        </div>

        <div className="bento">
          <div className="bento-card bento-hero">
            <span className="bc-label"><IconSpark /> Reasoning, not summarizing</span>
            <h4>The Copilot <em>thinks</em> about your idea — instead of paraphrasing it back.</h4>
            <p>Every output cites the inputs that justify it: the competitors, the wedge, the buyer. You see why, not just what.</p>
            <div className="trace">
              <div className="trace-q">Why &ldquo;Snapchat for blocks&rdquo; over &ldquo;Nextdoor for sound&rdquo;?</div>
              <div className="trace-step">
                <span className="tag">01</span>
                <span>Nextdoor framing primes broadcast + identity — the exact shape competitors already own.</span>
              </div>
              <div className="trace-step">
                <span className="tag">02</span>
                <span>Snapchat framing primes ephemerality + intimacy — aligned with your wedge.</span>
              </div>
              <div className="trace-step">
                <span className="tag">03</span>
                <span>Memorability score: 8.4 vs 5.2. Category-fit: high vs medium.</span>
              </div>
              <div className="trace-out">
                <span className="mark-mini" />
                <span>Recommend &ldquo;Snapchat for blocks&rdquo; as the hook — defensible and category-aligned.</span>
              </div>
            </div>
          </div>

          <div className="bento-card">
            <span className="bc-label"><IconRadar /> Live competitor pull</span>
            <div className="bc-stat">14<span className="unit"> mapped</span></div>
            <p>The Copilot scans the public web every time you ask — funding, positioning, recent shipping.</p>
            <div className="bc-live"><span className="pulse"/>scanning · last refresh 3.2s ago</div>
          </div>

          <div className="bento-card bento-tall">
            <span className="bc-label"><IconRoute /> Sequenced execution</span>
            <h4>A roadmap with <em>rationale</em> — not a stacked feature list.</h4>
            <p>Dependencies, blockers, and reasoning baked in. You ship the next thing, not just the loudest thing.</p>
            <div className="seq-mini">
              {[
                { done: true,  nm: 'Validate',       meta: '12 interviews' },
                { done: true,  nm: 'Prototype',      meta: 'voice MVP' },
                { done: false, nm: 'Closed beta',    meta: '200 users' },
                { next: true,  nm: 'Studio launch',  meta: 'Q4' },
                { next: true,  nm: 'Moderation API', meta: 'later' },
              ].map((r, i) => (
                <div key={i} className={`seq-mini-row${r.done ? ' done' : ''}${r.next ? ' next' : ''}`}>
                  <span className="dot">{r.done ? '✓' : i + 1}</span>
                  <span className="nm">{r.nm}</span>
                  <span className="meta">{r.meta}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card">
            <span className="bc-label"><IconTarget /> Confidence, not guesses</span>
            <div className="bc-stat"><em>92</em><span className="unit">% confidence</span></div>
            <p>Every recommendation is scored. You see the math behind the wedge — not a vibe.</p>
          </div>

          <div className="bento-card bento-wide">
            <span className="bc-label"><IconStack /> vs the rest</span>
            <h4>Notes apps store. Linear ships. <em>IdeaCopilot reasons.</em></h4>
            <div className="compare">
              <div className="compare-row h">
                <span/><span>Notes</span><span>Notion</span><span>Linear</span>
                <span className="you">IdeaCopilot</span>
              </div>
              {[
                { label: 'Captures sparks',          n: [false, false, false], y: true },
                { label: 'Refines positioning',      n: [false, false, false], y: true },
                { label: 'Pulls competitors live',   n: [false, false, false], y: true },
                { label: 'Sequences with rationale', n: [false, false, true],  y: true },
              ].map((row) => (
                <div key={row.label} className="compare-row">
                  <span className="label">{row.label}</span>
                  {row.n.map((v, i) => (
                    v
                      ? <span key={i}><IconCheck /></span>
                      : <span key={i} className="cmp-n">—</span>
                  ))}
                  <span><IconCheck className="cmp-y" /></span>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card bento-wide">
            <span className="bc-label"><IconCapture /> Founder-shaped loop</span>
            <h4>Shaped around how founders <em>actually</em> think — fragments first, structure second.</h4>
            <div className="loop">
              <svg viewBox="0 0 520 110" preserveAspectRatio="xMidYMid meet" fill="none">
                <defs>
                  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/>
                  </marker>
                </defs>
                {[{ x: 30, t: 'Spark' },{ x: 130, t: 'Wedge' },{ x: 230, t: 'Map' },{ x: 330, t: 'Plan' },{ x: 430, t: 'Ship' }].map((n, i, arr) => (
                  <g key={n.t}>
                    <circle cx={n.x} cy="46" r="22" fill="var(--surface)" stroke="var(--accent-line)" strokeWidth="1.2"/>
                    <text x={n.x} y="50" textAnchor="middle" fontFamily="Geist, sans-serif" fontSize="12.5" fill="var(--fg)" letterSpacing="-0.3">{n.t}</text>
                    {i < arr.length - 1 && (
                      <path d={`M ${n.x + 23} 46 L ${arr[i+1].x - 28} 46`} stroke="var(--accent-line)" strokeWidth="1.2" markerEnd="url(#arr)"/>
                    )}
                    <text x={n.x} y="92" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="9" fill="var(--fg-3)" letterSpacing="0.08em">{['CAPTURE','REFINE','DISCOVER','PLAN','SEQUENCE'][i]}</text>
                  </g>
                ))}
                <path d="M 430 24 C 430 -10, 30 -10, 30 24" stroke="var(--accent-line)" strokeWidth="1.2" strokeDasharray="3 4" markerEnd="url(#arr)" fill="none"/>
                <text x="230" y="14" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="9.5" fill="var(--accent)" letterSpacing="0.08em">LEARN · ITERATE</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className} style={{ display: 'inline-block', width: 14, height: 14 }}>
      <path d="M3 7.5L6 10.5L11.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}