'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email === 'alex@brennan.studio' && pass === 'founder123') {
      document.cookie = 'ic-auth=1; path=/; max-age=86400'
      router.push('/dashboard')
    } else {
      setErr('Invalid credentials. Try alex@brennan.studio / founder123')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(60% 50% at 50% 0%, var(--accent-soft) 0%, transparent 60%)',
      }}/>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse 70% 50% at 50% 20%, #000 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 20%, #000 30%, transparent 80%)',
      }}/>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 400,
        margin: '0 20px',
        padding: 36,
        background: 'var(--surface)',
        border: '1px solid var(--line-2)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-pop)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <span className="mark" />
          <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.015em' }}>IdeaCopilot</span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
            color: 'var(--good)', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 4,
            background: 'color-mix(in srgb, var(--good) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--good) 28%, transparent)',
          }}>workspace</span>
        </div>

        <h2 style={{ fontWeight: 400, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6, color: 'var(--fg)' }}>
          Welcome back, <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--accent)' }}>founder</em>.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--fg-2)', marginBottom: 28, lineHeight: 1.5 }}>
          Sign in to your workspace.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="alex@brennan.studio"
              style={{
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--line-2)',
                background: 'var(--bg-2)', color: 'var(--fg)',
                font: 'inherit', fontSize: 14, outline: 0,
                transition: 'border-color .15s, box-shadow .15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-line)'; e.target.style.boxShadow = '0 0 0 4px color-mix(in srgb, var(--accent) 10%, transparent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--line-2)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
              Password
            </label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••••"
              style={{
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--line-2)',
                background: 'var(--bg-2)', color: 'var(--fg)',
                font: 'inherit', fontSize: 14, outline: 0,
                transition: 'border-color .15s, box-shadow .15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-line)'; e.target.style.boxShadow = '0 0 0 4px color-mix(in srgb, var(--accent) 10%, transparent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--line-2)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {err && (
            <div style={{ fontSize: 12.5, color: 'var(--warn)', fontFamily: 'var(--font-mono)', padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--warn) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 24%, transparent)' }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            style={{
              marginTop: 4,
              padding: '12px 20px',
              borderRadius: 10,
              background: 'var(--fg)',
              color: 'var(--bg)',
              fontWeight: 500,
              fontSize: 14.5,
              cursor: 'pointer',
              transition: 'transform .15s',
              border: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Sign in to workspace →
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
          Demo credentials auto-fill above · v1.0.4
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
          <a href="/" style={{ fontSize: 13, color: 'var(--fg-2)' }}>← Back to landing page</a>
        </div>
      </div>
    </div>
  )
}