import Link from 'next/link'
import { IconArrow } from './Icons'
import { routes } from '@/lib/routes'
import MockDashboard from './mockups/MockDashboard'
import MockCompetitors from './mockups/MockCompetitors'
import MockInsight from './mockups/MockInsight'
import MockRoadmap from './mockups/MockRoadmap'
import MockChatMini from './mockups/MockChatMini'

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg">
        <div className="hero-grid" />
      </div>
      <div className="wrap hero-inner">
        <div className="hero-top">
          <Link href={routes.login} className="hero-tag" style={{ textDecoration: 'none', color: 'inherit' }}>
            <b>v1.0</b>
            <span>Public beta · shipping this quarter</span>
            <span className="dot" />
            <span>Join the beta →</span>
          </Link>
          <h1 className="hero-h">
            Turn ideas into<br />real <em>products</em>.
          </h1>
          <p className="lede">
            Capture sparks, refine them with AI, map the competitive landscape, and
            ship a sequenced roadmap — in one workspace built for founders who think
            in fragments.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href={routes.signup}>
              Start building <IconArrow />
            </Link>
            <Link className="btn btn-ghost" href={routes.workflow}>
              <span className="btn-play" /> See the workflow
            </Link>
          </div>
          <div className="hero-meta">
            <div className="avatars"><span /><span /><span /><span /></div>
            <span><b>4,200</b> founders building</span>
            <span className="sep" />
            <span className="stars">★★★★★</span>
            <span><b>4.9</b> on Product Hunt</span>
          </div>
        </div>

        <div className="hero-stage">
          <div className="stage-platter">
            <div className="hero-card hc-main"><MockDashboard /></div>
            <div className="hero-card hc-left"><MockCompetitors /></div>
            <div className="hero-card hc-right"><MockInsight /></div>
            <div className="hero-card hc-bottom"><MockRoadmap /></div>
            <div className="hero-card hc-chat"><MockChatMini /></div>
          </div>
        </div>
      </div>
    </section>
  )
}
