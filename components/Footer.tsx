export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mark" />
              <span style={{ fontSize: 16, letterSpacing: '-0.01em' }}>IdeaCopilot</span>
            </div>
            <p>The AI operating system for founders. Capture, refine, validate and ship — all in one intelligent workspace.</p>
            <div className="footer-social">
              <a href="#" aria-label="X"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 2h2L9.2 7l5.3 7H10l-3.4-4.5L2.5 14h-2l4.6-5.3L0 2h4.5l3 4Z"/></svg></a>
              <a href="#" aria-label="GitHub"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 0 0-2.5 15.6c.4 0 .5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-1-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8 0 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7 0-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1 0-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.5 7.5 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.1 2 .1 2.1.5.5.8 1.2.8 2.1 0 3.1-1.8 3.8-3.6 4 .3.2.6.7.6 1.4v2c0 .2.1.4.5.4A8 8 0 0 0 8 0Z"/></svg></a>
              <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1A1.3 1.3 0 1 0 3.3 3.6 1.3 1.3 0 0 0 3.3 1ZM2 5h2.5v9H2V5Zm4 0h2.4v1.2A2.6 2.6 0 0 1 10.7 5C13 5 14 6.4 14 8.7V14h-2.5V9.2c0-1.2-.2-2.4-1.6-2.4-1.5 0-1.7 1.2-1.7 2.3V14H6V5Z"/></svg></a>
              <a href="#" aria-label="YouTube"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M15.6 4.3a2 2 0 0 0-1.4-1.4C13 2.5 8 2.5 8 2.5s-5 0-6.2.4A2 2 0 0 0 .4 4.3 21 21 0 0 0 0 8a21 21 0 0 0 .4 3.7c.2.7.7 1.2 1.4 1.4 1.2.4 6.2.4 6.2.4s5 0 6.2-.4a2 2 0 0 0 1.4-1.4A21 21 0 0 0 16 8a21 21 0 0 0-.4-3.7ZM6.4 10.7V5.3L10.7 8l-4.3 2.7Z"/></svg></a>
            </div>
          </div>
          <div className="footer-col">
            <h6>Product</h6>
            <ul><li>Dashboard</li><li>Copilot</li><li>Competitor radar</li><li>Roadmap planner</li><li>Changelog</li></ul>
          </div>
          <div className="footer-col">
            <h6>Resources</h6>
            <ul><li>Documentation</li><li>Founder guide</li><li>Templates</li><li>API</li><li>Status</li></ul>
          </div>
          <div className="footer-col">
            <h6>Company</h6>
            <ul><li>About</li><li>Manifesto</li><li>Careers</li><li>Press</li><li>Contact</li></ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 IdeaCopilot Labs · v1.0.4</span>
          <span>Built for founders, by founders</span>
        </div>
      </div>
    </footer>
  )
}