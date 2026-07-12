'use client'

import { useEffect, useState } from 'react'
import NavigationInstrument from '@/components/landing/NavigationInstrument'
import { SIGNAL_SOURCES } from '@/components/landing/data'
import { IconArrow } from '@/components/landing/icons'

/* =========================================================================
   Hero ambient — the workspace quietly running behind the words.
   PROCESS ONLY: one idea being analyzed, the instrument searching, and
   named signal sources being read. Two sources stay in motion indefinitely
   — the work never completes. No competitor names, no scores, no
   recommendations. Peripheral by design.
   ========================================================================= */
function HeroAmbient() {
  const [n, setN] = useState(4820)

  useEffect(() => {
    const m = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)')
    if (m && m.matches) return
    const id = setInterval(() => setN((v) => v + Math.floor(3 + Math.random() * 7)), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="hero-ambient" aria-label="Workspace analyzing an idea — reading signal sources">
      <div className="hp-head">
        <span className="hp-lab">
          <span className="mark hp-mk" />
          Workspace · analyzing idea #2
        </span>
        <span className="hp-live">
          <i />
          live
        </span>
      </div>

      <div className="ha-idea">
        <div className="ha-idea-lab">Analyzing</div>
        <div className="ha-idea-ttl">Feedback intelligence — every ticket, review &amp; call into ranked product signals</div>
      </div>

      <div className="ha-instrument">
        <div className="ha-instr-dial">
          <NavigationInstrument state="search" showLabel={true} />
        </div>
      </div>

      <div className="ha-sources">
        <div className="ha-src-lab">
          <span className="ha-th-dot" />
          reading signal sources · {n.toLocaleString()} read
        </div>
        <div className="ha-src-list">
          {SIGNAL_SOURCES.map((s) => (
            <div className={`ha-src ${s.state}`} key={s.name}>
              <span className="ha-src-ico">
                {s.state === 'done' ? (
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M3 7.4 6 10.3 11.4 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="ha-src-spin" />
                )}
              </span>
              <span className="ha-src-name">{s.name}</span>
              <span className="ha-src-status">{s.state === 'done' ? 'read' : 'reading'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   1 · Hero — a large typographic statement beside a live workspace preview.
   ========================================================================= */
export default function HeroSection() {
  return (
    <section id="top" className="chapter hero2" data-screen-label="Hero">
      <div className="wrapc wide landing-hero-grid">
        <div className="hero-copy">
          <span className="kicker">A workspace for founders with too many ideas</span>
          <h1>
            You don&apos;t have an idea problem. You have <span className="cond">eleven ideas</span> — and no
            honest way to know which one is worth the next six months.
          </h1>
          <p className="hero-sub">
            IdeaCopilot answers one question on repeat: of everything you could build,
            <b> what should you build next</b> — and how do you know it isn&apos;t already taken, or already a
            graveyard?
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#discovery">
              See what it found <IconArrow />
            </a>
            <span className="hero-note">No signup to look. The scan is real.</span>
          </div>
        </div>
        <div className="hero-demo">
          <HeroAmbient />
        </div>
      </div>
    </section>
  )
}
