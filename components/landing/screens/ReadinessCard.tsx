import { READY_ITEMS } from '@/components/landing/data'
import { LandingIcon } from '@/components/landing/icons'
import NavigationInstrument from '@/components/landing/NavigationInstrument'

/* =========================================================================
   Startup Readiness — the thread + the proof. Sits at an honest 64%.
   ========================================================================= */
export default function ReadinessCard() {
  return (
    <div className="ready-card">
      <div className="ready-top">
        <div className="ready-ring" style={{ '--val': 64 } as React.CSSProperties}>
          <span className="num">
            64<small>/100</small>
          </span>
        </div>
        <div className="ready-meta">
          <div className="lab">Startup readiness · idea #2</div>
          <div className="ttl">Validation gap</div>
          <div className="diag">
            At 64%, a feedback-intelligence tool has a sharp wedge but zero demand proof — you&apos;ve mapped the
            market, not confirmed anyone will switch. The missing 36 points are all validation and GTM.
          </div>
        </div>
        <div className="ready-instr">
          <NavigationInstrument state="resolved" showLabel={false} />
        </div>
      </div>

      <div className="ready-next">
        <div className="rn-tag">{LandingIcon.target} Do this in the next 24 hours</div>
        <div className="rn-action">
          Interview 5 heads of product this week — ask how they triage feedback today, before you write a line of
          code.
        </div>
        <div className="rn-why">
          If they won&apos;t <em>act</em> on ranked themes — not just read them — the wedge is a feature, not a
          company. Confirm it now, not three months into the build.
        </div>
        <span className="rn-do">{LandingIcon.arrow} Open the interview kit</span>
      </div>

      <div className="ready-list">
        {READY_ITEMS.map((it) => (
          <div key={it.label} className={`ready-item ${it.state}`}>
            <span className="ready-box">{it.state === 'done' ? LandingIcon.check : it.state === 'block' ? LandingIcon.warn : null}</span>
            <div className="ri-body">
              <div className="ri-label">{it.label}</div>
              {it.meta && <div className="ri-meta">{it.meta}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
