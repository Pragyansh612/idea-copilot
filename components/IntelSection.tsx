export default function IntelSection() {
  const competitors = [
    { name: 'Notable',   logo: 'N',  market: 'Notes-first',        funding: '$12M · Series A', score: 72 },
    { name: 'FieldKit',  logo: 'F',  market: 'Mobile founders',    funding: '$4M · Seed',      score: 58 },
    { name: 'Brieflab',  logo: 'B',  market: 'Validation, agency', funding: 'Bootstrapped',    score: 81 },
    { name: 'Trace',     logo: 'T',  market: 'Research-first',     funding: '$22M · Series B', score: 64 },
    { name: 'Foundry09', logo: 'F9', market: 'PM tooling',         funding: '$8M · Series A',  score: 49 },
  ]

  return (
    <section className="section" id="intel">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">03 — Competitor intelligence</span>
          <h2>The market, <em>mapped</em>.<br />Every competitor. Every gap. In seconds.</h2>
          <p>Type the shape of an idea. IdeaCopilot pulls competitors from public sources, parses their positioning, and surfaces the white space where you can win.</p>
        </div>

        <div className="intel-layout">
          <div className="panel">
            <div className="panel-head">
              <span>Competitor radar · 14 found</span>
              <span className="live">live scrape</span>
            </div>
            <div className="panel-body">
              {competitors.map((c) => (
                <div key={c.name} className="comp-row">
                  <span className="comp-logo">{c.logo}</span>
                  <div className="comp-info">
                    <div className="name">{c.name}</div>
                    <div className="meta">{c.market} · {c.funding}</div>
                  </div>
                  <div className="comp-bar" style={{ '--w': `${c.score}%` } as React.CSSProperties} />
                  <span className="comp-score">{c.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="gap-card accent">
              <div className="gc-label">Market gap · high signal</div>
              <h4>No competitor combines async voice with neighborhood-level moderation.</h4>
              <p>Established players index on broadcast and identity. The wedge sits in trust + ephemerality — a niche that maps to dense urban beta markets.</p>
              <div className="gap-meta">
                <span>signal <strong className="v-good">HIGH</strong></span>
                <span>confidence <strong>92%</strong></span>
                <span>TAM <strong>$2.4B</strong></span>
              </div>
            </div>
            <div className="gap-card">
              <div className="gc-label">Positioning · best variant</div>
              <h4>&ldquo;Snapchat for blocks&rdquo; is the strongest framing — clear, memorable, defensible.</h4>
              <p>Five tested variants. This one indexes highest on memorability and lowest on category confusion.</p>
              <div className="gap-meta">
                <span>variants <strong>5</strong></span>
                <span>winner <strong>v3</strong></span>
              </div>
            </div>
            <div className="gap-card">
              <div className="gc-label">Watchlist · move fast</div>
              <h4>Trace just shipped a community feature in their last release.</h4>
              <p>≈3 weeks of runway before the gap narrows. Recommended: ship the moderation primitive first.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}