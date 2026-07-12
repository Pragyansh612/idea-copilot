'use client'

import { useEffect, useState } from 'react'
import { useInView, usePrefersReducedMotion } from '@/components/landing/hooks'
import { COP_RESPONSE, COP_CITE } from '@/components/landing/data'

/* =========================================================================
   Copilot thread — streams word by word. When "Enterpret" appears it gets
   a one-second highlight: the proof the system still holds the competitor
   found in the discovery section above. Notices the missing GTM phase.
   ========================================================================= */
export default function CopilotThread() {
  const [ref, seen] = useInView({ threshold: 0.35 })
  const reduce = usePrefersReducedMotion()
  const words = COP_RESPONSE.split(' ')
  const isCiteWord = (w: string) => COP_CITE.some((n) => w.indexOf(n) !== -1)

  const [count, setCount] = useState(0)
  const [flashIdx, setFlashIdx] = useState(-1)
  const done = count >= words.length

  useEffect(() => {
    if (reduce) {
      setCount(words.length)
      return
    }
    if (!seen) return
    let i = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    const tick = () => {
      i += 1
      setCount(i)
      if (isCiteWord(words[i - 1])) {
        const at = i - 1
        setFlashIdx(at)
        timers.push(setTimeout(() => setFlashIdx((cur) => (cur === at ? -1 : cur)), 1050))
      }
      if (i < words.length) {
        const w = words[i - 1]
        const pause = /[.,—:]$/.test(w) ? 240 : 52 + Math.random() * 46
        timers.push(setTimeout(tick, pause))
      }
    }
    timers.push(setTimeout(tick, 560))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, reduce])

  return (
    <div className="cop-thread" ref={ref}>
      <div className="cop-ctx">
        <span className="cx-lab">Copilot has your full workspace open</span>
        <div className="cx-rows">
          <div className="cx-row">
            <span className="cx-k">Idea</span>
            <span className="cx-v">Feedback intelligence · idea #2</span>
          </div>
          <div className="cx-row">
            <span className="cx-k">Scan</span>
            <span className="cx-v">
              5 competitors · <b>Enterpret 73%</b> · <i>Unwrap.ai analyzing</i>
            </span>
          </div>
          <div className="cx-row">
            <span className="cx-k">Roadmap</span>
            <span className="cx-v">
              <span className="miss">no GTM phase</span> · closed beta is next
            </span>
          </div>
          <div className="cx-row">
            <span className="cx-k">Readiness</span>
            <span className="cx-v">
              <b>64%</b> · validation gap
            </span>
          </div>
        </div>
      </div>

      <div className="cop-msg user">
        <span className="cop-av">YOU</span>
        <div className="cop-bubble">Is my roadmap ready to start building against?</div>
      </div>

      <div className="cop-msg ai">
        <span className="cop-av" />
        <div className="cop-bubble">
          <span className="cop-stream">
            {words.slice(0, count).map((w, idx) => {
              if (w === '¶') return <span key={idx} className="cop-break" />
              const cite = isCiteWord(w)
              return (
                <span key={idx} className={cite ? `cite ${flashIdx === idx ? 'flashing' : ''}` : undefined}>
                  {w}
                  {idx < count - 1 ? ' ' : ''}
                </span>
              )
            })}
            {!done && <span className="stream-caret" />}
          </span>

          {done && (
            <div className="cop-context appear">
              <span className="cc-lab">Connected in this answer</span>
              <span className="cop-chip">
                <span className="d" />
                competitor · Enterpret
              </span>
              <span className="cop-chip">
                <span className="d" />
                competitor · Dovetail
              </span>
              <span className="cop-chip">
                <span className="d amber" />
                scan · Unwrap.ai analyzing
              </span>
              <span className="cop-chip">
                <span className="d amber" />
                roadmap · GTM phase missing
              </span>
              <span className="cop-chip">
                <span className="d green" />
                roadmap · closed beta
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
