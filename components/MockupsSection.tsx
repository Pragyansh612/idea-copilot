import MockDashboard from './mockups/MockDashboard'
import MockFeatureBoard from './mockups/MockFeatureBoard'
import MockRoadmapLarge from './mockups/MockRoadmapLarge'
import MockStrategyCard from './mockups/MockStrategyCard'

export default function MockupsSection() {
  return (
    <section className="section" id="mockups">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">05 — Product</span>
          <h2>An <em>operating system</em><br />for founder thinking.</h2>
          <p>Designed for clarity at every altitude — from the loose sketch of an idea to the sequenced roadmap that ships it.</p>
        </div>
        <div className="mock-grid">
          <div className="mock-card tall">
            <h4>Idea dashboard</h4>
            <p className="mk-desc">Every idea, scored on viability, market size, and gap potential. Always one click from refinement.</p>
            <div style={{ borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--bg-2)', overflow: 'hidden', height: 460 }}>
              <MockDashboard />
            </div>
          </div>
          <div className="mock-card">
            <h4>Feature board</h4>
            <p className="mk-desc">Backlog → shipped. Generated from your idea, organized like the team you don&apos;t have yet.</p>
            <MockFeatureBoard />
          </div>
          <div className="mock-card">
            <h4>Roadmap planner</h4>
            <p className="mk-desc">A sequence, not a checklist — with dependencies, rationale, and a phase you can actually ship.</p>
            <MockRoadmapLarge />
            <div style={{ marginTop: 16 }}>
              <MockStrategyCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}