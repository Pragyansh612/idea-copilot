import DemoScan from '@/components/landing/screens/DemoScan'
import GapMomentPanel from '@/components/landing/screens/GapMomentPanel'

/* =========================================================================
   2 · Competitor discovery — the demo dominates the viewport at full width.
   Understandable from the screen alone.
   ========================================================================= */
export default function DiscoverySection() {
  return (
    <section id="discovery" className="chapter" data-screen-label="Competitor discovery">
      <div className="wrapc wide disc-owned">
        <div className="chead disc-head">
          <span className="kicker">Watch it work · live competitor scan</span>
          <h2>
            Type an idea. Watch <span className="em">who&apos;s already building it</span>.
          </h2>
        </div>

        <div className="disc-demo">
          <DemoScan truncated />
        </div>

        <GapMomentPanel gapPhrase="My idea starts where they all stopped." />

        <p className="disc-stakes">
          The difference between knowing on <span>day one</span> that five funded teams already own generic
          feedback analytics — and finding out <span>three months</span> after you&apos;ve built the wrong half of
          it.
        </p>
      </div>
    </section>
  )
}
