import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ContactForm from '@/components/marketing/ContactForm'
import { routes } from '@/lib/routes'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact — IdeaCopilot',
  description: 'Get in touch with the IdeaCopilot team.',
}

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="marketing-page">
        <div className="wrap marketing-hero marketing-hero--narrow">
          <span className="eyebrow">Contact</span>
          <h1 className="marketing-hero-title">
            Let&apos;s <em>talk</em> about your lab.
          </h1>
          <p className="marketing-hero-desc">
            Questions about the workspace, partnerships, or feedback on the product — we read every message.
          </p>
        </div>
        <ContactForm />
        <div className="wrap" style={{ paddingBottom: 48, textAlign: 'center' }}>
          <Link className="btn btn-ghost" href={routes.home}>← Back to home</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
