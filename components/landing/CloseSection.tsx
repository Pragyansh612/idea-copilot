import Link from 'next/link'
import { routes } from '@/lib/routes'
import NavigationInstrument from '@/components/landing/NavigationInstrument'
import { IconArrow } from '@/components/landing/icons'

/* =========================================================================
   6 · The close — full width, highest contrast, one action.
   ========================================================================= */
export default function CloseSection() {
  return (
    <section id="start" className="chapter close2" data-screen-label="The close">
      <div className="wrapc noted">
        <div className="whisper">
          <span className="wl">next move</span>
          <span className="wl">for one idea —</span>
          <b>locked</b>
        </div>
        <div>
          <div className="close2-instrument">
            <NavigationInstrument state="resolved" showLabel={true} />
          </div>
          <span className="kicker">One idea is enough to start</span>
          <h2>
            Stop guessing which idea <span className="cond">is the one</span>.
          </h2>
          <p className="close2-sub">
            Bring a single idea — the one that won&apos;t leave you alone. In an afternoon you&apos;ll know who&apos;s
            already building it, where the opening is, and the exact next thing to do.
          </p>
          <div className="close2-actions">
            <Link className="btn btn-primary" href={routes.login}>
              Open the workspace <IconArrow />
            </Link>
            <div className="close2-price">
              <span>
                <b>Free</b> while we&apos;re in beta
              </span>
              <span className="sep" />
              <span>
                one plan at launch · <b>$20/mo</b>, everything in
              </span>
              <span className="sep" />
              <span>no seats, no sales call</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
