'use client'

/* ============================================================
   The Navigation Instrument — IdeaCopilot's signature element.

   A bearing dial, not a progress bar. Scattered signals sit around
   a "you are here" origin; a needle searches, then locks onto the one
   destination that matters. It evolves across the page:

     state="search"   — uncertain. The needle drifts. A question.
     state="lock"     — the system found something. The needle eases
                        to a bearing, candidate paths fade, a route lights.
     state="resolved" — one direction, locked and bright. An answer.

   Lines and circles only. CSS/WAAPI motion, reduced-motion safe.
   ============================================================ */

export type NavInstrumentState = 'search' | 'lock' | 'resolved'

interface NavInstrumentProps {
  state?: NavInstrumentState
  className?: string
  showLabel?: boolean
}

const NI_CX = 120
const NI_CY = 120
const NI_NODES = [
  { x: 178, y: 76, r: 2.8, dest: true }, // up-right — "the one"
  { x: 52, y: 158, r: 2.4 }, // down-left
  { x: 66, y: 72, r: 2.2 }, // up-left
  { x: 172, y: 172, r: 2.4 }, // down-right
  { x: 110, y: 196, r: 2.0 }, // bottom
]
const NI_DEST = NI_NODES.find((n) => n.dest)!
const NI_BEARING = (Math.atan2(NI_DEST.y - NI_CY, NI_DEST.x - NI_CX) * 180) / Math.PI // CSS-clockwise deg

export default function NavigationInstrument({ state = 'search', className = '', showLabel = true }: NavInstrumentProps) {
  const ticks = []
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    const long = i % 6 === 0
    const r1 = 94
    const r2 = long ? 83 : 88
    /* Rounded to a fixed precision — Math.sin/cos can differ in the last
       bit between Node's V8 (SSR) and the browser's V8 (hydration),
       which React flags as a hydration mismatch. Imperceptible visually. */
    ticks.push({
      x1: +(NI_CX + r1 * Math.cos(a)).toFixed(3),
      y1: +(NI_CY + r1 * Math.sin(a)).toFixed(3),
      x2: +(NI_CX + r2 * Math.cos(a)).toFixed(3),
      y2: +(NI_CY + r2 * Math.sin(a)).toFixed(3),
      long,
    })
  }

  return (
    <div
      className={`navinstrument ni-${state} ${className}`}
      style={{ '--ni-bearing': `${NI_BEARING.toFixed(2)}deg` } as React.CSSProperties}
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 240" fill="none">
        <circle className="ni-ring outer" cx={NI_CX} cy={NI_CY} r="94" />
        <circle className="ni-ring mid" cx={NI_CX} cy={NI_CY} r="62" />
        <circle className="ni-ring inner" cx={NI_CX} cy={NI_CY} r="32" />

        <g className="ni-ticks">
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={t.long ? 'long' : ''} />
          ))}
        </g>

        <g className="ni-bearings">
          {NI_NODES.map((n, i) => (
            <line key={i} x1={NI_CX} y1={NI_CY} x2={n.x} y2={n.y} className={n.dest ? 'is-dest' : ''} />
          ))}
        </g>

        <line className="ni-route" x1={NI_CX} y1={NI_CY} x2={NI_DEST.x} y2={NI_DEST.y} />

        <g className="ni-nodes">
          {NI_NODES.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r={n.r} className={n.dest ? 'is-dest' : ''} />
          ))}
        </g>

        <g className="ni-needle">
          <line x1={NI_CX} y1={NI_CY} x2={NI_CX + 86} y2={NI_CY} />
          <circle className="ni-tip" cx={NI_CX + 86} cy={NI_CY} r="3" />
        </g>

        <circle className="ni-dest-halo" cx={NI_DEST.x} cy={NI_DEST.y} r="9" />
        <circle className="ni-origin-halo" cx={NI_CX} cy={NI_CY} r="9" />
        <circle className="ni-origin" cx={NI_CX} cy={NI_CY} r="3.4" />
      </svg>

      {showLabel && (
        <span className="ni-label">
          <span className="ni-label-search">
            <span className="ni-dot" />
            searching for a bearing
          </span>
          <span className="ni-label-resolved">
            <span className="ni-dot" />
            next move · locked
          </span>
        </span>
      )}
    </div>
  )
}
