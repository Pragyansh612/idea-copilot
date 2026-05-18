export default function ProblemSection() {
  const notes = [
    { top: 14, left: 24, rot: -8, text: 'voice memo · 2:14' },
    { top: 38, left: 90, rot: 4, text: 'tweet thread idea' },
    { top: 76, left: 36, rot: -3, text: 'Notion · drafts /22' },
    { top: 110, left: 110, rot: 6, text: 'slack · #ideas' },
    { top: 24, right: 30, rot: 5, text: 'back of napkin' },
    { top: 68, right: 60, rot: -4, text: 'iCloud · scratch' },
    { top: 130, right: 22, rot: 7, text: 'loom · 0:48' },
  ]

  return (
    <section className="section" id="problem">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">01 — The problem</span>
          <h2>Every founder lives in <em>fragments</em>.<br />Notes everywhere. Clarity nowhere.</h2>
          <p>You have hundreds of ideas, dozens of unfinished projects, and zero infrastructure for thinking about them seriously. The good ones get lost in the noise.</p>
        </div>

        <div className="problem-grid">
          <div className="problem-card pc-scatter">
            <span className="pc-tag">01</span>
            <div className="scatter-vis">
              {notes.map((n, i) => (
                <span
                  key={i}
                  className="scatter-note"
                  style={{ top: n.top, left: n.left, right: n.right, transform: `rotate(${n.rot}deg)` }}
                >{n.text}</span>
              ))}
            </div>
            <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto' }}>
              <h3>Ideas scattered everywhere</h3>
              <p>iCloud notes, Notion docs, Slack DMs to yourself, voice memos that never get transcribed.</p>
            </div>
          </div>

          <div className="problem-card pc-noval">
            <span className="pc-tag">02</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.08em' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warn)' }} />
              UNVALIDATED · NO SIGNAL
            </div>
            <div style={{ flex: 1 }} />
            <h3>No validation, no signal</h3>
            <p>You don&apos;t know if anyone wants it, who else is building it, or whether the wedge is real.</p>
          </div>

          <div className="problem-card pc-chaos">
            <span className="pc-tag">03</span>
            <div className="chaos-tabs">
              <div className="chaos-tab" style={{ width: '60%' }} />
              <div className="chaos-tab" style={{ width: '30%' }} />
              <div className="chaos-tab" style={{ width: '80%' }} />
              <div className="chaos-tab" style={{ width: '20%' }} />
              <div className="chaos-tab" style={{ width: '50%' }} />
              <div className="chaos-tab" style={{ width: '15%' }} />
            </div>
            <h3 style={{ marginTop: 'auto' }}>Tabs everywhere</h3>
            <p>Twelve research threads, none synthesized.</p>
          </div>

          <div className="problem-card pc-unfin">
            <span className="pc-tag">04</span>
            <div className="unfin-bars">
              <div className="unfin-bar b1" />
              <div className="unfin-bar b2" />
              <div className="unfin-bar b3" />
              <div className="unfin-bar b4" />
            </div>
            <h3>Projects that stall</h3>
            <p>Every project stalls at the same step — when strategy stops and execution should start.</p>
          </div>

          <div className="problem-card pc-clarity">
            <span className="pc-tag">05</span>
            <div className="fog-q">
              <span style={{ top: 10, left: 30 }}>?</span>
              <span style={{ top: 60, right: 40, fontSize: 96 }}>?</span>
              <span style={{ bottom: 30, left: 80, fontSize: 48 }}>?</span>
            </div>
            <h3 style={{ position: 'relative', zIndex: 1, marginTop: 'auto' }}>No clarity, no compass</h3>
            <p style={{ position: 'relative', zIndex: 1 }}>Which idea matters? What&apos;s the wedge? Who&apos;s the buyer? Where do you even start?</p>
          </div>

          <div className="problem-card pc-roadmap">
            <span className="pc-tag">06</span>
            <svg className="broken-path" viewBox="0 0 240 60" style={{ width: '100%', height: 50 }}>
              <path d="M0,30 L70,30" stroke="var(--accent)" strokeWidth="2" fill="none"/>
              <path d="M90,30 L150,30" stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="4 4"/>
              <path d="M170,30 L240,30" stroke="var(--line-3)" strokeWidth="2" fill="none" strokeDasharray="2 6"/>
              <circle cx="0" cy="30" r="4" fill="var(--accent)"/>
              <circle cx="70" cy="30" r="4" fill="var(--accent)"/>
              <circle cx="90" cy="30" r="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5"/>
              <circle cx="150" cy="30" r="4" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
              <circle cx="170" cy="30" r="4" fill="none" stroke="var(--line-3)" strokeWidth="1.5"/>
              <circle cx="240" cy="30" r="4" fill="none" stroke="var(--line-3)" strokeWidth="1.5"/>
            </svg>
            <h3>No real roadmap</h3>
            <p>A list of features isn&apos;t a plan. You need sequence, dependencies and rationale.</p>
          </div>
        </div>
      </div>
    </section>
  )
}