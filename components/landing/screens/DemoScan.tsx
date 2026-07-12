'use client'

import { useEffect, useState } from 'react'
import { useInView, usePrefersReducedMotion } from '@/components/landing/hooks'
import { EXAMPLE, SOURCES } from '@/components/landing/data'
import { LandingIcon } from '@/components/landing/icons'
import AppFrame from '@/components/landing/AppFrame'

type Phase = 'idle' | 'reading' | 'scanning' | 'paused' | 'done'

interface DemoScanProps {
  truncated?: boolean
}

/* =========================================================================
   The cinematic demonstration — Typing → scan → competitors surface one by
   one → Unwrap.ai stays analyzing → the gap insight lands last. Triggers
   once on entry.
   ========================================================================= */
export default function DemoScan({ truncated = false }: DemoScanProps) {
  const [ref, seen] = useInView()
  const reduce = usePrefersReducedMotion()
  const total = EXAMPLE.competitors.length

  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [shown, setShown] = useState(0)
  const [showGap, setShowGap] = useState(false)
  const [readIdx, setReadIdx] = useState(0)

  /* reduced motion / no-JS → final static state immediately.
     Unwrap.ai keeps its analyzing state even in the resting frame. */
  useEffect(() => {
    if (!reduce) return
    setTyped(EXAMPLE.idea)
    setShown(total)
    if (truncated) {
      setPhase('paused')
    } else {
      setPhase('done')
      setShowGap(true)
    }
  }, [reduce, total, truncated])

  useEffect(() => {
    if (!seen || reduce) return
    const idea = EXAMPLE.idea
    const timers: ReturnType<typeof setTimeout>[] = []
    let i = 0
    const typeNext = () => {
      i += 1
      setTyped(idea.slice(0, i))
      if (i < idea.length) timers.push(setTimeout(typeNext, 14 + Math.random() * 26))
      else timers.push(setTimeout(() => setPhase('reading'), 520))
    }
    timers.push(setTimeout(typeNext, 420))
    return () => timers.forEach(clearTimeout)
  }, [seen, reduce])

  /* reading phase — brief real-source labels, ~0.8s each, then the scan. */
  useEffect(() => {
    if (phase !== 'reading') return
    const timers: ReturnType<typeof setTimeout>[] = []
    const per = 780
    SOURCES.forEach((_, k) => timers.push(setTimeout(() => setReadIdx(k), k * per)))
    timers.push(setTimeout(() => setPhase('scanning'), SOURCES.length * per + 180))
    return () => timers.forEach(clearTimeout)
  }, [phase])

  useEffect(() => {
    if (phase !== 'scanning') return
    const timers: ReturnType<typeof setTimeout>[] = []
    const step = 620
    for (let k = 1; k <= total; k++) timers.push(setTimeout(() => setShown(k), 240 + k * step))
    if (truncated) {
      /* hero: halt the moment the last competitor lands — before the gap
         insight, before any conclusion. The story stays visibly open. */
      timers.push(setTimeout(() => setPhase('paused'), 240 + total * step + 300))
      return () => timers.forEach(clearTimeout)
    }
    timers.push(setTimeout(() => setShowGap(true), 240 + total * step + 900))
    timers.push(setTimeout(() => setPhase('done'), 240 + total * step + 900))
    return () => timers.forEach(clearTimeout)
  }, [phase, total, truncated])

  return (
    <div className="demo-frame" ref={ref}>
      <AppFrame
        figN="Fig. 1"
        cap="Competitor discovery · live scan"
        note={
          <span className="af-status">
            <span className="d" />
            connected
          </span>
        }
      >
        <div className="demo-idea">
          <span className="glyph">{LandingIcon.capture}</span>
          <div className="field">
            <div className="lab">The idea, in your words</div>
            <div className="txt">
              {typed}
              {phase === 'idle' && <span className="caret" />}
            </div>
          </div>
        </div>

        <div className={`demo-scanline ${phase === 'idle' ? 'is-hidden' : ''}`}>
          <span className={`ping ${phase === 'done' ? 'off' : ''}`} />
          {phase === 'reading' ? (
            <span className="reading-line">
              reading <b className="src-name">{SOURCES[readIdx]}</b>
            </span>
          ) : phase === 'scanning' ? (
            <span>cross-referencing funding, positioning &amp; recent releases</span>
          ) : phase === 'done' || phase === 'paused' ? (
            <span>read {SOURCES.length} public sources — funding, positioning, releases</span>
          ) : (
            <span>preparing to read the market</span>
          )}
          <span className="rule" />
          <b>
            {phase === 'done'
              ? `${total} real overlaps · 3.4s`
              : phase === 'reading'
                ? `${readIdx + 1}/${SOURCES.length} sources`
                : phase === 'paused'
                  ? `${total} overlaps found`
                  : `${shown}/${total}…`}
          </b>
        </div>

        <div className="comp-list">
          {EXAMPLE.competitors.slice(0, shown).map((c) => {
            const analyzing = !!c.analyzing /* Unwrap.ai never resolves */
            const tier = c.overlap >= 66 ? 'high' : c.overlap >= 54 ? 'mid' : 'low'
            const weight =
              phase === 'done' && !analyzing ? (c.overlap >= 66 ? 'prominent' : c.overlap <= 54 ? 'recede' : '') : ''
            const top = c.overlap === 73 /* Enterpret — the top threat */
            return (
              <div className={`comp-item appear ${analyzing ? 'analyzing' : ''} ${weight}`} key={c.name}>
                <span className="comp-mark">{c.mark}</span>
                <div className="landing-comp-info">
                  <div className="comp-nameline">
                    <span className="comp-name">{c.name}</span>
                    <span className="comp-fund">{c.raised}</span>
                    {top && <span className="comp-top">top threat</span>}
                  </div>
                  <div className="comp-focus">{c.focus}</div>
                  {analyzing ? (
                    <div className="comp-stops live">
                      <span className="spin sm" />
                      still reading its product pages — not scored yet
                    </div>
                  ) : (
                    <div className="comp-stops">
                      <span className="stop-arw">{LandingIcon.arrow}</span>
                      {c.stops}
                    </div>
                  )}
                </div>
                <div className={`comp-overlap t-${tier} ${analyzing ? 'is-analyzing' : ''}`}>
                  {analyzing ? (
                    <span className="comp-analyzing">
                      <span className="spin" />
                      analyzing
                    </span>
                  ) : (
                    <>
                      <div className="ov-num">
                        <span className="pct">{c.overlap}%</span>
                        <span className="ov-lab">overlap</span>
                      </div>
                      <span className="track">
                        <span className="fill" style={{ width: `${c.overlap}%` }} />
                      </span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {showGap && (
          <div className="gap-flag appear-gap">
            <span className="gf-icon">{LandingIcon.target}</span>
            <div>
              <div className="gf-lab">The pattern across all five</div>
              <div className="gf-text">
                Every competitor above stops at the same place — <strong>tagging feedback, or storing it</strong>.
                Not one turns those themes into a <strong>ranked, roadmap-linked build order</strong>, so the founder
                still decides what to ship by hand. That&apos;s the gap you build directly into.
              </div>
            </div>
          </div>
        )}
      </AppFrame>
    </div>
  )
}
