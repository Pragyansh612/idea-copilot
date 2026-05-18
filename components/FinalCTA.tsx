import { IconArrow } from './Icons'

export default function FinalCTA() {
  return (
    <section className="final" id="cta">
      <div className="final-bg"><div className="final-grid" /></div>
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <span className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex' }}>Now in public beta</span>
        <h2>Build <em>smarter</em><br />ideas.</h2>
        <p>Your AI copilot for startup thinking, validation and execution. Bring the spark — we&apos;ll handle the strategy.</p>
        <div className="cta-row">
          <a className="btn btn-primary" href="#">Get started — free <IconArrow /></a>
          <a className="btn btn-ghost" href="#">Read the manifesto</a>
        </div>
      </div>
    </section>
  )
}