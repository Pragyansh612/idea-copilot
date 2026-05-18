import Link from 'next/link'
import { IconCheck } from './Icons'
import { routes } from '@/lib/routes'

export default function PricingSection() {
  const tiers = [
    { name: 'Spark', price: '$0', cadence: 'free forever', desc: 'For the first sketch of an idea.', cta: 'Get started', href: routes.signup, features: ['3 active ideas','AI refinement · 20/mo','Light competitor scans','Personal workspace'] },
    { name: 'Founder', price: '$24', cadence: 'per month', desc: 'For founders building seriously.', featured: true, tag: 'Most popular', cta: 'Start free trial', href: routes.signup, features: ['Unlimited ideas','Unlimited AI refinement','Live competitor radar + alerts','Roadmap planner + exports','Priority Copilot model'] },
    { name: 'Studio', price: '$72', cadence: 'per month', desc: 'For studios running many bets in parallel.', cta: 'Talk to us', href: 'mailto:hello@ideacopilot.app?subject=Studio%20plan', features: ['Multi-workspace · 10 seats','API access · webhooks','Custom market reports','SOC2 · SSO','Founder office hours'] },
  ]
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">08 — Pricing</span>
          <h2>Priced for <em>thinking</em>,<br />not seats.</h2>
          <p>Every plan includes the Copilot, competitor radar and roadmap planner. Cancel anytime — your ideas remain yours.</p>
        </div>
        <div className="pricing">
          {tiers.map((t) => (
            <div key={t.name} className={`price-card ${t.featured ? 'featured' : ''}`}>
              {t.tag && <span className="pc-tag">{t.tag}</span>}
              <span className="pc-name">{t.name}</span>
              <div className="pc-price">{t.price} <small>/ {t.cadence}</small></div>
              <p className="pc-desc">{t.desc}</p>
              <ul>
                {t.features.map((f) => (
                  <li key={f}><IconCheck /> <span>{f}</span></li>
                ))}
              </ul>
              <Link className="pc-cta" href={t.href}>{t.cta} →</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
