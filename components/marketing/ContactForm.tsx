'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { routes } from '@/lib/routes'

const CONTACT_EMAIL = 'hello@ideacopilot.app'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('general')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent(`IdeaCopilot — ${topic}`)
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div className="contact-layout wrap">
      <div className="contact-info">
        <div className="contact-card">
          <div className="contact-card-label">Email</div>
          <a href={`mailto:${CONTACT_EMAIL}`} className="contact-card-value">
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className="contact-card">
          <div className="contact-card-label">Response time</div>
          <div className="contact-card-value">Within 2 business days</div>
        </div>
        <div className="contact-card">
          <div className="contact-card-label">Workspace</div>
          <div className="contact-card-value" style={{ fontSize: 14, fontWeight: 400 }}>
            Founders, indie hackers, and product teams validating ideas with AI.
          </div>
        </div>
        <p className="contact-note">
          Prefer to jump in?{' '}
          <Link href={routes.signup}>Create a free account</Link> or read the{' '}
          <Link href={routes.productDashboard}>product tour</Link>.
        </p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <h2 className="contact-form-title">Send a message</h2>
        <p className="contact-form-sub">
          Opens your email client with a pre-filled message — no account required.
        </p>

        <label className="contact-field">
          <span>Name</span>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </label>

        <label className="contact-field">
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </label>

        <label className="contact-field">
          <span>Topic</span>
          <select value={topic} onChange={e => setTopic(e.target.value)}>
            <option value="general">General question</option>
            <option value="support">Product support</option>
            <option value="partnership">Partnership</option>
            <option value="feedback">Feedback</option>
          </select>
        </label>

        <label className="contact-field">
          <span>Message</span>
          <textarea
            required
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="How can we help?"
          />
        </label>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Open in email app →
        </button>

        {sent && (
          <p className="contact-sent" role="status">
            If your mail app did not open, email us directly at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        )}
      </form>
    </div>
  )
}
