export default function TestimonialsSection() {
  const t = [
    { quote: 'I went from a notes-app graveyard to a sequenced roadmap in an afternoon. It\'s the first AI tool that reasons about my idea, not just summarizes it.', name: 'Maya Okonkwo', role: 'Founder · Loomwise', av: 'linear-gradient(135deg,#e4a89c,#a36b58)' },
    { quote: 'The competitor radar caught two players I\'d never heard of. Saved me a month of validation. This is the unfair advantage I wanted.', name: 'Daniel Park', role: 'CEO · Brieflab', av: 'linear-gradient(135deg,#aab8f3,#5a6bcf)' },
    { quote: 'Replaced four tools and a Notion graveyard. The roadmap output alone is worth the price — it\'s the strategy doc I\'d never write.', name: 'Sara Lindqvist', role: 'Solo founder', av: 'linear-gradient(135deg,#9ec8a9,#3e7e58)' },
  ]
  return (
    <section className="section" id="testimonials">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">07 — Founders, on the record</span>
          <h2>Backed by the founders<br />who <em>actually</em> ship.</h2>
        </div>
        <div className="testimonials">
          {t.map((x) => (
            <div key={x.name} className="testimonial">
              <blockquote>{x.quote}</blockquote>
              <div className="who">
                <div className="who-av" style={{ background: x.av }} />
                <div>
                  <div className="who-name">{x.name}</div>
                  <div className="who-role">{x.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}