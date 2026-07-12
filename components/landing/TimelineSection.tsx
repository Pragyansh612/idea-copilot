'use client'

import { useInView, usePrefersReducedMotion } from '@/components/landing/hooks'
import { SESSION } from '@/components/landing/data'

/* =========================================================================
   The founder session timeline — one real afternoon, start to finish.
   A vertical rail with a dot at each entry. The gap-confirmed moment at
   09:05 is the payoff and looks unmistakably different from every other
   entry. Entries fade in on scroll with a ~100ms stagger; the gap entry
   fades a beat slower to create a brief pause before the payoff.
   Reduced motion → every entry visible immediately in final state.
   ========================================================================= */
function SessionTimeline() {
  const [ref, seen] = useInView({ threshold: 0.12 })
  const reduce = usePrefersReducedMotion()
  const show = seen || reduce
  return (
    <div className={`stimeline ${show ? 'in' : ''} ${reduce ? 'noanim' : ''}`} ref={ref}>
      {SESSION.map((e, i) => (
        <div className={`stl-entry ${e.gap ? 'gap' : ''}`} key={e.time} style={{ '--i': i } as React.CSSProperties}>
          <div className="stl-time">{e.time}</div>
          <div className="stl-rail">
            <span className="stl-dot" />
          </div>
          <div className="stl-body">
            <div className="stl-label">{e.label}</div>
            <div className="stl-data">{e.data}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* =========================================================================
   3 · The journey — one horizontal sequence, every stage visible at once,
   each carrying real data from the same session.
   ========================================================================= */
export default function TimelineSection() {
  return (
    <section id="journey" className="chapter" data-screen-label="The path">
      <div className="wrapc">
        <div className="chead stl-head">
          <h2>One afternoon. Start to finish.</h2>
        </div>
        <SessionTimeline />
      </div>
    </section>
  )
}
