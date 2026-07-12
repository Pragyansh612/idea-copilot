'use client'

import { useEffect, useState } from 'react'
import { useInView, usePrefersReducedMotion } from '@/components/landing/hooks'
import NavigationInstrument from '@/components/landing/NavigationInstrument'

interface GapMomentPanelProps {
  gapPhrase?: string
}

/* =========================================================================
   The Gap Moment Panel — the emotional peak of the page. Five competitors
   converge on a shared boundary and stop; the idea crosses it and
   continues. The staged reveal turns the discovery's tension into a
   single payoff.
   ========================================================================= */
export default function GapMomentPanel({ gapPhrase = '' }: GapMomentPanelProps) {
  const [ref, seen] = useInView({ threshold: 0.3 })
  const reduce = usePrefersReducedMotion()
  const [reveal, setReveal] = useState(false)

  useEffect(() => {
    if (reduce) {
      setReveal(true)
      return
    }
    if (!seen) return
    const t = setTimeout(() => setReveal(true), 520)
    return () => clearTimeout(t)
  }, [seen, reduce])

  return (
    <div className="gmp" ref={ref} aria-label="The gap this idea fills">
      <div className={`gmp-instr ${reveal ? 'in' : ''}`}>
        <NavigationInstrument state={reveal ? 'lock' : 'search'} showLabel={false} />
      </div>
      <p className={`gmp-phrase ${reveal ? 'in' : ''}`}>{gapPhrase}</p>
    </div>
  )
}
