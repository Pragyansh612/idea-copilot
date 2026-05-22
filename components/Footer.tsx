import Link from 'next/link'
import { routes } from '@/lib/routes'

const productLinks = [
  { label: 'Dashboard', href: routes.productDashboard },
  { label: 'Copilot', href: routes.productCopilot },
  { label: 'Competitor radar', href: routes.productCompetitors },
  { label: 'Roadmap planner', href: routes.productRoadmaps },
  // { label: 'Pricing', href: routes.pricing },
]

const resourceLinks = [
  { label: 'Workflow tour', href: routes.workflow },
  { label: 'Product mockups', href: routes.mockups },
  { label: 'Sign up', href: routes.signup },
  { label: 'Log in', href: routes.login },
]

const companyLinks = [
  { label: 'Why IdeaCopilot', href: routes.why },
  { label: 'The problem', href: routes.problem },
  { label: 'Contact', href: routes.contact },
]

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="footer-col">
      <h6>{title}</h6>
      <ul>
        {links.map(l => (
          <li key={l.label}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href={routes.home} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
              <span className="mark" />
              <span style={{ fontSize: 16, letterSpacing: '-0.01em' }}>IdeaCopilot</span>
            </Link>
            <p>The AI operating system for founders. Capture, refine, validate and ship — all in one intelligent workspace.</p>
            <div className="footer-social">
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 2h2L9.2 7l5.3 7H10l-3.4-4.5L2.5 14h-2l4.6-5.3L0 2h4.5l3 4Z"/></svg></a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 0 0-2.5 15.6c.4 0 .5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-1-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8 0 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7 0-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1 0-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.5 7.5 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.1 2 .1 2.1.5.5.8 1.2.8 2.1 0 3.1-1.8 3.8-3.6 4 .3.2.6.7.6 1.4v2c0 .2.1.4.5.4A8 8 0 0 0 8 0Z"/></svg></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1A1.3 1.3 0 1 0 3.3 3.6 1.3 1.3 0 0 0 3.3 1ZM2 5h2.5v9H2V5Zm4 0h2.4v1.2A2.6 2.6 0 0 1 10.7 5C13 5 14 6.4 14 8.7V14h-2.5V9.2c0-1.2-.2-2.4-1.6-2.4-1.5 0-1.7 1.2-1.7 2.3V14H6V5Z"/></svg></a>
            </div>
          </div>
          <FooterCol title="Product" links={productLinks} />
          <FooterCol title="Resources" links={resourceLinks} />
          <FooterCol title="Company" links={companyLinks} />
        </div>
        <div className="footer-bottom">
          <span>© 2026 IdeaCopilot Labs</span>
          <Link href={routes.login}>Log in to workspace</Link>
        </div>
      </div>
    </footer>
  )
}
